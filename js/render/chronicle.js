import { state, todayStr, saveState } from '../state.js';
import { formatTime12, getPeriodKey, ymd } from '../utils.js';
import {
  getChronicleNote,
  getResurfacedChronicleNote,
  upsertChronicleNote,
} from '../domains/chronicle.js';
import { getSleepNoteEntries } from '../domains/sleep.js';
import { getMindReflectionEntries } from '../domains/mind.js';
import { CHRONICLE_PROMPTS } from '../constants.js';
import {
  getChronicleMode,
  renderArchiveListIfActive,
  initChronicleArchiveEvents,
} from './chronicle-archive.js';

const CHRONICLE_AUTOSAVE_DELAY = 800;
const DRIFT_MAX = 12;
const DEEP_TIME_MIN_AGE = 60;
const CROSS_DOMAIN_MIN_AGE = 120;
const CROSS_DOMAIN_LEGACY_MIN_AGE = 180;
const BEGINNING_AGE = 365;

const DAYS  = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
let chronicleSaveTimer = null;
let chronicleDirty = false;
let wellSessionSignature = null;
let wellSessionCandidate = undefined;

function formatDriftDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAYS[dt.getDay()]} ${d} ${MONTHS[m - 1]}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function quietClass(dateStr) {
  const age = daysApart(todayStr, dateStr);
  if (age >= 181) return ' is-faint';
  if (age >= 61) return ' is-quieter';
  if (age >= 15) return ' is-quiet';
  return '';
}

function getPastEntries() {
  const notes = state.chronicle?.notes || {};
  return Object.entries(notes)
    .filter(([d]) => d !== todayStr)
    .sort((a, b) => b[0].localeCompare(a[0]));
}

function ymdOffset(baseStr, dayOffset) {
  const [y, m, d] = baseStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + dayOffset);
  return ymd(dt);
}

function daysApart(laterStr, earlierStr) {
  const [ly, lm, ld] = laterStr.split('-').map(Number);
  const [ey, em, ed] = earlierStr.split('-').map(Number);
  const later = new Date(ly, lm - 1, ld);
  const earlier = new Date(ey, em - 1, ed);
  return Math.round((later - earlier) / 86400000);
}

function isLivingNote(note) {
  return note && typeof note.body === 'string' && note.body.trim();
}

// Tie-break precedence for same-date entries across sources in the deep-time pool.
// Chronicle is the deep well; static, content-blind precedence.
const SOURCE_RANK = { chronicle: 0, mind: 1, sleep: 2 };

function hashKey(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function gateOpen(kind, modulo, threshold, dateStr = '') {
  return hashKey(`${kind}:${todayStr}:${dateStr}`) % modulo < threshold;
}

function pickByPhase(candidates, kind) {
  if (!candidates.length) return null;
  const ordered = [...candidates].sort((a, b) => {
    if (a.dateStr !== b.dateStr) return a.dateStr.localeCompare(b.dateStr);
    return SOURCE_RANK[a.source] - SOURCE_RANK[b.source];
  });
  return ordered[hashKey(`${kind}:${todayStr}`) % ordered.length];
}

function hasCoordinateResonance(entry) {
  const currentPeriod = getPeriodKey();
  if (entry.source === 'sleep') {
    return entry.period === currentPeriod;
  }
  if (entry.source === 'mind') {
    return entry.period === currentPeriod || entry.cycleDay === state.cycleDay;
  }
  return true;
}

function hasKnownCoordinate(entry) {
  if (entry.source === 'sleep') return typeof entry.period === 'string';
  if (entry.source === 'mind') {
    return typeof entry.period === 'string' || [0, 1, 2].includes(entry.cycleDay);
  }
  return true;
}

function isDeepTimeEligible(entry, newestNonTodayInUnion) {
  const age = daysApart(todayStr, entry.dateStr);
  if (age < DEEP_TIME_MIN_AGE) return false;
  if (daysApart(newestNonTodayInUnion, entry.dateStr) < 14) return false;
  if (entry.source === 'chronicle') return true;
  if (age < CROSS_DOMAIN_MIN_AGE) return false;
  if (hasKnownCoordinate(entry)) return hasCoordinateResonance(entry);
  return age >= CROSS_DOMAIN_LEGACY_MIN_AGE &&
    gateOpen(`well-legacy-${entry.source}`, 7, 1, entry.dateStr);
}

function collapseSameDate(candidates) {
  const byDate = new Map();
  for (const c of candidates) {
    const prev = byDate.get(c.dateStr);
    if (!prev || SOURCE_RANK[c.source] < SOURCE_RANK[prev.source]) {
      byDate.set(c.dateStr, c);
    }
  }
  return Array.from(byDate.values());
}

function getWellPoolSignature() {
  const notes = state.chronicle?.notes || {};
  const parts = [];
  for (const [dateStr, note] of Object.entries(notes)) {
    if (dateStr !== todayStr && dateStr <= todayStr && isLivingNote(note)) {
      parts.push(`chronicle:${dateStr}:${hashKey(note.body)}:${note.period || ''}:${note.cycleDay ?? ''}`);
    }
  }
  for (const e of getSleepNoteEntries()) {
    if (e.dateStr !== todayStr && e.dateStr <= todayStr) {
      parts.push(`sleep:${e.dateStr}:${hashKey(e.body)}:${e.period || ''}`);
    }
  }
  for (const e of getMindReflectionEntries()) {
    if (e.dateStr !== todayStr && e.dateStr <= todayStr) {
      parts.push(`mind:${e.dateStr}:${hashKey(e.body)}:${e.period || ''}:${e.cycleDay ?? ''}`);
    }
  }
  return `${todayStr}|${parts.sort().join('|')}`;
}

// One resurfaced memory at a time. Deterministic selection.
// Order:
//   1. exact same-date one year ago (Chronicle only)
//   2. ±3-day window around that anchor, day-of-year-rotated (Chronicle only)
//   3. deep-time pool — Chronicle ∪ Sleep ∪ Mind, age ≥ 60d AND ≥ 14d older than
//      the newest non-today entry across the union
//      — label: 'From the beginning' (≥365d) or 'From an earlier season' (60–364d)
//   4. otherwise null (silence)
// Returns: { source, dateStr, body, label } or null.
// Rarity gates are deterministic; renderWell holds the result for the session.
function getWellEntry() {
  const notes = state.chronicle?.notes || {};

  const t = new Date();
  const anchor = new Date(t.getFullYear() - 1, t.getMonth(), t.getDate());
  const anchorStr = ymd(anchor);

  const exact = notes[anchorStr];
  if (isLivingNote(exact) && anchorStr !== todayStr) {
    return { source: 'chronicle', dateStr: anchorStr, body: exact.body, label: 'A year ago today' };
  }

  // Rotate ±3 window order by day-of-year so the selection varies day-to-day.
  const startOfYear = new Date(t.getFullYear(), 0, 0);
  const dayOfYear = Math.round((t - startOfYear) / 86400000);
  const baseOffsets = [1, -1, 2, -2, 3, -3];
  const rotStart = dayOfYear % baseOffsets.length;
  const offsets = [...baseOffsets.slice(rotStart), ...baseOffsets.slice(0, rotStart)];
  const windowGateOpen = gateOpen('well-window', 5, 1, anchorStr);

  for (const off of offsets) {
    if (!windowGateOpen) continue;
    const candStr = ymdOffset(anchorStr, off);
    if (candStr === todayStr) continue;
    const cand = notes[candStr];
    if (isLivingNote(cand)) {
      return { source: 'chronicle', dateStr: candStr, body: cand.body, label: 'A year ago this week' };
    }
  }

  // Deep-time pool — Chronicle ∪ Sleep ∪ Mind.
  const pool = [];
  for (const [dateStr, note] of Object.entries(notes)) {
    if (dateStr === todayStr || dateStr > todayStr) continue;
    if (!isLivingNote(note)) continue;
    pool.push({
      source: 'chronicle',
      dateStr,
      body: note.body,
      period: note.period,
      cycleDay: note.cycleDay,
    });
  }
  for (const e of getSleepNoteEntries()) {
    if (e.dateStr === todayStr || e.dateStr > todayStr) continue;
    pool.push({ source: 'sleep', dateStr: e.dateStr, body: e.body, period: e.period });
  }
  for (const e of getMindReflectionEntries()) {
    if (e.dateStr === todayStr || e.dateStr > todayStr) continue;
    pool.push({
      source: 'mind',
      dateStr: e.dateStr,
      body: e.body,
      period: e.period,
      cycleDay: e.cycleDay,
    });
  }
  if (pool.length === 0) return null;

  // Newest non-today across the union, computed before exclusion filtering.
  const newestNonTodayInUnion = pool
    .map(c => c.dateStr)
    .sort((a, b) => b.localeCompare(a))[0];
  if (!newestNonTodayInUnion) return null;

  const eligible = collapseSameDate(pool.filter(c => isDeepTimeEligible(c, newestNonTodayInUnion)));
  if (eligible.length === 0) return null;

  const seasonal = eligible.filter(c => daysApart(todayStr, c.dateStr) < BEGINNING_AGE);
  const beginning = eligible.filter(c => daysApart(todayStr, c.dateStr) >= BEGINNING_AGE);

  let pick = null;
  if (seasonal.length && gateOpen('well-seasonal', 7, 1)) {
    pick = pickByPhase(seasonal, 'well-seasonal-pick');
  } else if (beginning.length && gateOpen('well-beginning', 17, 1)) {
    pick = pickByPhase(beginning, 'well-beginning-pick');
  }
  if (!pick) return null;

  const age = daysApart(todayStr, pick.dateStr);
  const label = age >= BEGINNING_AGE ? 'From the beginning' : 'From an earlier season';
  return { source: pick.source, dateStr: pick.dateStr, body: pick.body, label };
}

function renderWell() {
  const wellEl = document.getElementById('chronicle-well');
  const eyebrowEl = document.getElementById('chronicle-well-eyebrow');
  const bodyEl = document.getElementById('chronicle-well-body');
  if (!wellEl) return null;

  const signature = getWellPoolSignature();
  if (wellSessionSignature !== signature) {
    wellSessionSignature = signature;
    wellSessionCandidate = getWellEntry();
  }
  const candidate = wellSessionCandidate;
  if (!candidate) {
    wellEl.hidden = true;
    if (eyebrowEl) eyebrowEl.textContent = '';
    if (bodyEl) bodyEl.textContent = '';
    return null;
  }

  if (eyebrowEl) eyebrowEl.textContent = candidate.label;
  if (bodyEl) bodyEl.textContent = candidate.body;
  wellEl.hidden = false;
  return candidate.source === 'chronicle' ? candidate.dateStr : null;
}

function renderResurfaced() {
  const cardEl = document.getElementById('chronicle-resurfaced');
  const whenEl = document.getElementById('chronicle-resurfaced-when');
  const bodyEl = document.getElementById('chronicle-resurfaced-body');
  if (!cardEl) return null;

  const candidate = getResurfacedChronicleNote();
  if (!candidate) {
    cardEl.hidden = true;
    if (whenEl) whenEl.textContent = '';
    if (bodyEl) bodyEl.textContent = '';
    return null;
  }

  if (whenEl) whenEl.textContent = candidate.label;
  if (bodyEl) bodyEl.textContent = candidate.excerpt;
  cardEl.hidden = false;
  return candidate.dateStr;
}

function renderDrift(el, excludeDateStrs = []) {
  const riverHd = document.getElementById('chronicle-river-hd');
  const excluded = new Set(excludeDateStrs.filter(Boolean));
  const entries = getPastEntries().filter(([d]) => !excluded.has(d));

  if (entries.length === 0) {
    if (riverHd) riverHd.hidden = true;
    el.innerHTML = '';
    return;
  }

  if (riverHd) riverHd.hidden = false;

  let shown = 0;
  let html = '';
  for (const [dateStr, note] of entries) {
    if (shown >= DRIFT_MAX) break;
    html += `<div class="chronicle-drift-entry${quietClass(dateStr)}">
      <div class="chronicle-drift-date">${formatDriftDate(dateStr)}</div>
      <div class="chronicle-drift-body">${escapeHtml(note.body)}</div>
    </div>`;
    shown++;
  }

  el.innerHTML = html;
}

function getChroniclePromptEyebrow() {
  const map = {
    'night': 'TONIGHT', 'first-light': 'THIS MORNING',
    'morning': 'THIS MORNING', 'midday': 'TODAY',
    'afternoon': 'THIS AFTERNOON', 'golden-hour': 'THIS EVENING',
    'dusk': 'TONIGHT',
  };
  return map[getPeriodKey()] ?? 'TONIGHT';
}

function getChroniclePrompt() {
  const periodKey = getPeriodKey();
  const poolKey =
    (periodKey === 'first-light' || periodKey === 'morning') ? 'morning' :
    (periodKey === 'midday' || periodKey === 'afternoon') ? 'midday' :
    (periodKey === 'golden-hour' || periodKey === 'dusk') ? 'evening' :
    periodKey === 'night' ? 'night' : 'fallback';
  const pool = CHRONICLE_PROMPTS[poolKey] ?? CHRONICLE_PROMPTS.fallback;
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - startOfYear) / 86400000);
  return pool[dayOfYear % pool.length];
}

function renderPromptCard() {
  const eyebrowEl = document.getElementById('chronicle-prompt-eyebrow');
  const textEl = document.getElementById('chronicle-prompt-text');
  if (eyebrowEl) eyebrowEl.textContent = getChroniclePromptEyebrow();
  if (textEl) textEl.textContent = getChroniclePrompt();
}

function renderContinuityFragment() {
  const el = document.getElementById('chronicle-continuity');
  if (!el) return;
  const notes = state.chronicle?.notes || {};
  const todayNote = notes[todayStr];

  if (todayNote && typeof todayNote.body === 'string' && todayNote.body.trim()) {
    el.hidden = true;
    return;
  }

  const hasAnyNote = Object.values(notes).some(
    n => n && typeof n.body === 'string' && n.body.trim()
  );
  if (!hasAnyNote && state.startDate === todayStr) {
    el.textContent = 'This is where it begins.';
    el.hidden = false;
    return;
  }

  const yesterdayNote = notes[ymdOffset(todayStr, -1)];
  if (yesterdayNote && typeof yesterdayNote.body === 'string' && yesterdayNote.body.trim()) {
    el.textContent = 'The night before is still here.';
    el.hidden = false;
    return;
  }

  const past = Object.keys(notes)
    .filter(d => d < todayStr && notes[d]?.body?.trim())
    .sort((a, b) => b.localeCompare(a));
  if (past.length > 0 && daysApart(todayStr, past[0]) >= 7) {
    el.textContent = 'The chronicle receives what comes.';
    el.hidden = false;
    return;
  }

  el.hidden = true;
}

export function renderChronicle() {
  initChronicleArchiveEvents();

  if (getChronicleMode() === 'read') {
    renderArchiveListIfActive();
    return;
  }

  const note = getChronicleNote(todayStr);
  const textarea = document.getElementById('chronicle-textarea');
  const status = document.getElementById('chronicle-status');
  const driftEl = document.getElementById('chronicle-drift');

  if (textarea && !chronicleDirty) textarea.value = note ? note.body : '';

  if (status) {
    if (chronicleDirty) {
      status.textContent = '';
      status.hidden = true;
    } else if (note && note.updatedAt) {
      const d = new Date(note.updatedAt);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      status.textContent = `Saved · ${formatTime12(`${hh}:${mm}`)}`;
      status.hidden = false;
    } else {
      status.textContent = '';
      status.hidden = true;
    }
  }

  const resurfacedDateStr = renderResurfaced();
  const wellDateStr = renderWell();
  if (driftEl) renderDrift(driftEl, [resurfacedDateStr, wellDateStr]);
  renderPromptCard();
  renderContinuityFragment();
}

export function saveChronicleNote(fromBlur = false) {
  if (!chronicleDirty) return false;
  clearTimeout(chronicleSaveTimer);
  chronicleSaveTimer = null;

  const textarea = document.getElementById('chronicle-textarea');
  if (!textarea) return false;
  const body = fromBlur ? textarea.value.trim() : textarea.value;
  const note = getChronicleNote(todayStr);
  const existingBody = note ? note.body : '';

  chronicleDirty = false;
  if (body === existingBody) {
    if (fromBlur) renderChronicle();
    return false;
  }

  upsertChronicleNote(todayStr, body);
  saveState();

  if (fromBlur) {
    renderChronicle();
  } else {
    const status = document.getElementById('chronicle-status');
    if (status) {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      status.textContent = `Saved · ${formatTime12(`${hh}:${mm}`)}`;
      status.hidden = false;
    }
  }
  return true;
}

export function scheduleChronicleAutosave() {
  chronicleDirty = true;
  const status = document.getElementById('chronicle-status');
  if (status) {
    status.textContent = '';
    status.hidden = true;
  }
  clearTimeout(chronicleSaveTimer);
  chronicleSaveTimer = setTimeout(() => saveChronicleNote(), CHRONICLE_AUTOSAVE_DELAY);
}

export function flushPendingChronicleSave() {
  if (!chronicleDirty) return false;
  return saveChronicleNote(true);
}
