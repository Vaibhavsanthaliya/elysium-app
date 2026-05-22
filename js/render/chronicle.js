import { state, todayStr, saveState } from '../state.js';
import { formatTime12 } from '../utils.js';
import { getChronicleNote, upsertChronicleNote } from '../domains/chronicle.js';

const CHRONICLE_AUTOSAVE_DELAY = 800;
const DRIFT_MAX = 12;

const DAYS  = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
let chronicleSaveTimer = null;
let chronicleDirty = false;

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

function quietClass(index) {
  if (index >= 9) return ' is-faint';
  if (index >= 6) return ' is-quieter';
  if (index >= 3) return ' is-quiet';
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
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
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

// One resurfaced memory at a time. Derived deterministically from chronicle.notes.
// Order:
//   1. exact same-date one year ago
//   2. ±3-day window around that anchor (closest first)
//   3. oldest entry ≥ 60d old AND ≥ 14d older than the newest non-today entry
//   4. otherwise null (silence)
function getWellEntry() {
  const notes = state.chronicle?.notes || {};

  const t = new Date();
  const anchor = new Date(t.getFullYear() - 1, t.getMonth(), t.getDate());
  const anchorStr = `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, '0')}-${String(anchor.getDate()).padStart(2, '0')}`;

  const exact = notes[anchorStr];
  if (isLivingNote(exact) && anchorStr !== todayStr) {
    return { dateStr: anchorStr, note: exact, label: 'A year ago today' };
  }

  for (const off of [1, -1, 2, -2, 3, -3]) {
    const candStr = ymdOffset(anchorStr, off);
    if (candStr === todayStr) continue;
    const cand = notes[candStr];
    if (isLivingNote(cand)) {
      return { dateStr: candStr, note: cand, label: 'A year ago this week' };
    }
  }

  const pastAsc = Object.entries(notes)
    .filter(([d, n]) => d !== todayStr && isLivingNote(n))
    .sort((a, b) => a[0].localeCompare(b[0]));
  if (pastAsc.length === 0) return null;
  const newestNonToday = pastAsc[pastAsc.length - 1][0];
  for (const [dateStr, note] of pastAsc) {
    if (daysApart(todayStr, dateStr) >= 60 && daysApart(newestNonToday, dateStr) >= 14) {
      return { dateStr, note, label: 'From an earlier turn' };
    }
  }

  return null;
}

function renderWell() {
  const wellEl = document.getElementById('chronicle-well');
  const eyebrowEl = document.getElementById('chronicle-well-eyebrow');
  const bodyEl = document.getElementById('chronicle-well-body');
  if (!wellEl) return null;

  const candidate = getWellEntry();
  if (!candidate) {
    wellEl.hidden = true;
    if (eyebrowEl) eyebrowEl.textContent = '';
    if (bodyEl) bodyEl.textContent = '';
    return null;
  }

  if (eyebrowEl) eyebrowEl.textContent = candidate.label;
  if (bodyEl) bodyEl.textContent = candidate.note.body;
  wellEl.hidden = false;
  return candidate.dateStr;
}

function renderDrift(el, excludeDateStr) {
  const riverHd = document.getElementById('chronicle-river-hd');
  const entries = getPastEntries().filter(([d]) => d !== excludeDateStr);

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
    html += `<div class="chronicle-drift-entry${quietClass(shown)}">
      <div class="chronicle-drift-date">${formatDriftDate(dateStr)}</div>
      <div class="chronicle-drift-body">${escapeHtml(note.body)}</div>
    </div>`;
    shown++;
  }

  el.innerHTML = html;
}

export function renderChronicle() {
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

  const wellDateStr = renderWell();
  if (driftEl) renderDrift(driftEl, wellDateStr);
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
