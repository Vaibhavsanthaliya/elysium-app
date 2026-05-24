import { state, todayStr } from '../state.js';
import { dayNumber, isYmd } from '../utils.js';
import { CYCLE_NAMES } from '../constants.js';
import { getTodayChecks, getNightTasks } from '../domains/care.js';
import { getLightPeriodLabel, getLastWitness } from '../domains/light.js';
import { getSleepEntry } from '../domains/sleep.js';
import { getMostRecentSession, getMostRecentReflectionSession } from '../domains/mind.js';
import { hasArrivedToday } from '../domains/body.js';
import { hasHeldToday } from '../domains/water.js';

// Time-of-day period buckets — used to set data-period on #pane-temple for ambient CSS shift.
const TEMPLE_PERIOD_BUCKETS = [
  { start: 0,  end: 4,  key: 'night' },
  { start: 4,  end: 6,  key: 'first-light' },
  { start: 6,  end: 10, key: 'morning' },
  { start: 10, end: 15, key: 'midday' },
  { start: 15, end: 18, key: 'afternoon' },
  { start: 18, end: 20, key: 'golden-hour' },
  { start: 20, end: 22, key: 'dusk' },
  { start: 22, end: 24, key: 'night' },
];

// Must mirror the EA-85 period baselines in css/temple.css.
const TEMPLE_PERIOD_ALPHA = {
  night: 0.06,
  'first-light': 0.09,
  morning: 0.12,
  midday: 0.08,
  afternoon: 0.10,
  'golden-hour': 0.14,
  dusk: 0.11,
};

const TEMPLE_WARMTH_PRESENCE_GAIN = 0.006;
const TEMPLE_WARMTH_DAILY_DECAY = 0.9945;
const TEMPLE_WARMTH_MAX_ALPHA_LIFT = 0.0240;
const TEMPLE_WARMTH_FLOOR_BASE = 0.012;
const TEMPLE_WARMTH_FLOOR_SCALE = 80;
const TEMPLE_WARMTH_FLOOR_CAP = 0.10;

// ── EA-90: Transient domain trace ────────────────────────────────────────────
let _pendingTrace = null;
let _pendingTraceAt = 0;
const TRACE_TTL_MS = 90000;

const TRACE_CARD_IDS = {
  light: 'temple-goto-light',
  sleep: 'temple-goto-sleep',
  mind:  'temple-goto-mind',
  care:  'temple-goto-today',
  body:  'temple-goto-body',
  water: 'temple-goto-water',
};

export function applyTempleTrace(domain) {
  const card = document.getElementById(TRACE_CARD_IDS[domain]);
  if (!card) return;
  card.classList.remove('just-touched');
  void card.offsetWidth;
  card.classList.add('just-touched');
  card.addEventListener('animationend', () => card.classList.remove('just-touched'), { once: true });
}

export function queueTempleTrace(domain) {
  _pendingTrace = domain;
  _pendingTraceAt = Date.now();
}

// Returns a one-line status string for the Care hero area and Temple featured card.
// Lives here because Temple is the primary consumer; Today imports it for consistency.
const CARE_CYCLE_ROMAN = ['I', 'II', 'III'];
const CARE_CYCLE_COPY = [
  {
    tonight: 'Niacinamide tonight.',
    motion: 'Niacinamide — in motion.',
    kept: 'Night I kept. Salicylic tomorrow.',
  },
  {
    tonight: 'Salicylic tonight. A light hand.',
    motion: 'Salicylic — in motion.',
    kept: 'Night II kept. Rest tomorrow.',
  },
  {
    tonight: 'Rest night.',
    motion: 'Rest night. Niacinamide returns tomorrow.',
    kept: 'Night III kept. Niacinamide returns tomorrow.',
  },
];

function getCareCycleCopy(cycleDay = state.cycleDay) {
  return CARE_CYCLE_COPY[cycleDay] || CARE_CYCLE_COPY[0];
}

export function getCareCycleLabel(cycleDay = state.cycleDay) {
  const roman = CARE_CYCLE_ROMAN[cycleDay] || CARE_CYCLE_ROMAN[0];
  const name = CYCLE_NAMES[cycleDay] || CYCLE_NAMES[0];
  return `Night ${roman} · ${name}`;
}

export function getCareTurnState() {
  const copy = getCareCycleCopy();
  const checks = getTodayChecks();
  const nightTasks = getNightTasks();
  const nightDone = nightTasks.filter(t => checks[t.id]).length;
  const nightKept = nightTasks.length > 0 && nightDone === nightTasks.length;
  const protocol = CYCLE_NAMES[state.cycleDay] || CYCLE_NAMES[0];
  const isRest = protocol.toLowerCase().includes('rest');

  if (nightKept) {
    return { key: 'kept', label: 'kept', copy: copy.kept };
  }

  if (nightDone > 0) {
    return { key: 'motion', label: 'in motion', copy: copy.motion };
  }

  if (isRest) {
    return { key: 'resting', label: 'resting', copy: copy.tonight };
  }

  return { key: 'untouched', label: 'untouched', copy: copy.tonight };
}

export function getSmartFeedback() {
  return getCareTurnState().copy;
}

function renderTempleCycleIndicator(turnState) {
  const indicator = document.getElementById('temple-cycle-indicator');
  if (!indicator) return;

  indicator.dataset.careState = turnState.key;
  indicator.querySelectorAll('[data-cycle-mark]').forEach(mark => {
    const cycleMark = Number(mark.dataset.cycleMark);
    mark.classList.toggle('is-current', cycleMark === state.cycleDay);
  });

  const label = document.getElementById('temple-cycle-state');
  if (label) label.textContent = turnState.label;
}

function addPresenceDay(days, dateStr, todayDayNum) {
  if (!isYmd(dateStr)) return;
  const n = dayNumber(dateStr);
  if (n === null || n > todayDayNum) return;
  days.add(n);
}

function collectTemplePresenceDays(todayDayNum) {
  const days = new Set();

  if (Array.isArray(state.loggedDays)) {
    state.loggedDays.forEach(dateStr => addPresenceDay(days, dateStr, todayDayNum));
  }

  const checks = state.checks || {};
  for (const [dateStr, dayChecks] of Object.entries(checks)) {
    if (dayChecks && typeof dayChecks === 'object' && Object.values(dayChecks).some(Boolean)) {
      addPresenceDay(days, dateStr, todayDayNum);
    }
  }

  const notes = state.chronicle?.notes || {};
  for (const [dateStr, note] of Object.entries(notes)) {
    if (typeof note?.body === 'string' && note.body.trim()) {
      addPresenceDay(days, dateStr, todayDayNum);
    }
  }

  const lightEntries = state.light?.entries || {};
  for (const [dateStr, entry] of Object.entries(lightEntries)) {
    if (Array.isArray(entry?.witnesses) && entry.witnesses.length) {
      addPresenceDay(days, dateStr, todayDayNum);
    }
  }

  const sleepEntries = state.sleep?.entries || {};
  for (const dateStr of Object.keys(sleepEntries)) {
    addPresenceDay(days, dateStr, todayDayNum);
  }

  const sessions = state.mind?.sessions;
  if (Array.isArray(sessions)) {
    sessions.forEach(session => {
      if (session?.completed || session?.date === todayStr) {
        addPresenceDay(days, session.date, todayDayNum);
      }
    });
  }

  if (Array.isArray(state.weeklyPhotos)) {
    state.weeklyPhotos.forEach(photo => addPresenceDay(days, photo?.date, todayDayNum));
  }

  const bodyArrivals = state.body?.arrivals || {};
  for (const [dateStr, arr] of Object.entries(bodyArrivals)) {
    if (Array.isArray(arr) && arr.length) {
      addPresenceDay(days, dateStr, todayDayNum);
    }
  }

  const waterHoldings = state.water?.holdings || {};
  for (const [dateStr, arr] of Object.entries(waterHoldings)) {
    if (Array.isArray(arr) && arr.length) {
      addPresenceDay(days, dateStr, todayDayNum);
    }
  }

  return Array.from(days).sort((a, b) => a - b);
}

function softenTempleWarmth(value, floor, absentDays) {
  if (absentDays <= 0 || value <= floor) return value;
  return floor + (value - floor) * Math.pow(TEMPLE_WARMTH_DAILY_DECAY, absentDays);
}

function deriveTempleWarmthCoefficient() {
  const todayDayNum = dayNumber(todayStr);
  if (todayDayNum === null) return 0;

  const presenceDays = collectTemplePresenceDays(todayDayNum);
  if (!presenceDays.length) return 0;

  const floor = Math.min(
    TEMPLE_WARMTH_FLOOR_CAP,
    TEMPLE_WARMTH_FLOOR_BASE + (Math.log1p(presenceDays.length) / TEMPLE_WARMTH_FLOOR_SCALE)
  );

  let warmth = 0;
  let cursor = presenceDays[0];

  for (const presenceDay of presenceDays) {
    warmth = softenTempleWarmth(warmth, floor, presenceDay - cursor);
    warmth += (1 - warmth) * TEMPLE_WARMTH_PRESENCE_GAIN;
    cursor = presenceDay + 1;
  }

  warmth = softenTempleWarmth(warmth, floor, todayDayNum - cursor + 1);
  return Math.min(1, Math.max(floor, warmth));
}

function formatTempleAlpha(value) {
  return value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}

function getTempleGradientAlpha(periodKey) {
  const baseAlpha = TEMPLE_PERIOD_ALPHA[periodKey] ?? 0.10;
  const lift = deriveTempleWarmthCoefficient() * TEMPLE_WARMTH_MAX_ALPHA_LIFT;
  return baseAlpha + lift;
}

function ymdFromOffset(daysBack) {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function hasSignalOn(dateStr) {
  if (state.chronicle?.notes?.[dateStr]?.body) return true;
  if (state.sleep?.entries?.[dateStr]) return true;
  if (state.light?.entries?.[dateStr]?.witnesses?.length) return true;
  const sessions = state.mind?.sessions;
  if (Array.isArray(sessions) && sessions.some(s => s.completed && s.date === dateStr)) return true;
  return false;
}

function hasAnyHistory() {
  const notes = state.chronicle?.notes;
  if (notes && Object.keys(notes).some(d => d !== todayStr && notes[d]?.body)) return true;
  const sleep = state.sleep?.entries;
  if (sleep && Object.keys(sleep).some(d => d !== todayStr)) return true;
  const light = state.light?.entries;
  if (light && Object.keys(light).some(d => d !== todayStr && light[d]?.witnesses?.length)) return true;
  const sessions = state.mind?.sessions;
  if (Array.isArray(sessions) && sessions.some(s => s.completed && s.date !== todayStr)) return true;
  return false;
}

function isQuietStretch(lookbackDays = 7) {
  for (let i = 1; i <= lookbackDays; i++) {
    if (hasSignalOn(ymdFromOffset(i))) return false;
  }
  return true;
}

function getDailyLine() {
  if (getSleepEntry(todayStr)) return 'The day has been closed.';

  const yesterdayStr = ymdFromOffset(1);
  if (getSleepEntry(yesterdayStr) && new Date().getHours() < 11) return 'The night has passed.';

  const turnState = getCareTurnState();
  if (turnState.key === 'kept') return 'The night has been kept.';
  if (turnState.key === 'motion') return 'The night moves quietly.';

  if (state.chronicle?.notes?.[todayStr]?.body) return 'A line was left.';

  const recent = getMostRecentSession();
  if (recent && recent.date === todayStr) return 'A time was held.';

  if (getLastWitness(todayStr)) return 'Light was seen.';

  if (isQuietStretch() && hasAnyHistory()) return 'The room has waited.';

  return '';
}

export function renderTemple() {
  if (_pendingTrace) {
    if (Date.now() - _pendingTraceAt < TRACE_TTL_MS) {
      const domain = _pendingTrace;
      _pendingTrace = null;
      _pendingTraceAt = 0;
      applyTempleTrace(domain);
    } else {
      _pendingTrace = null;
      _pendingTraceAt = 0;
    }
  }

  const h = new Date().getHours();
  const period = TEMPLE_PERIOD_BUCKETS.find(p => h >= p.start && h < p.end) ?? TEMPLE_PERIOD_BUCKETS[0];
  const paneEl = document.getElementById('pane-temple');
  if (paneEl) {
    paneEl.dataset.period = period.key;
    paneEl.style.setProperty('--temple-grad-alpha', formatTempleAlpha(getTempleGradientAlpha(period.key)));
  }

  const line = getDailyLine();
  const lineEl = document.getElementById('temple-daily-line');
  if (lineEl) {
    lineEl.textContent = line;
    const greetingEl = lineEl.parentElement;
    if (greetingEl) greetingEl.hidden = !line;
  }

  const turnState = getCareTurnState();

  document.getElementById('temple-status').textContent = getCareCycleLabel();
  document.getElementById('temple-hero-cycle').textContent = turnState.copy;
  renderTempleCycleIndicator(turnState);

  const hasNote = !!(state.chronicle?.notes?.[todayStr]?.body);
  document.getElementById('temple-chronicle-state').textContent = hasNote ? 'A line' : 'Quiet';

  const lastWitness = getLastWitness(todayStr);
  const lightStateEl = document.getElementById('temple-light-state');
  if (lightStateEl) {
    if (lastWitness) {
      const h = parseInt(lastWitness.split(':')[0], 10);
      lightStateEl.textContent = getLightPeriodLabel(Number.isFinite(h) ? h : 0);
    } else {
      lightStateEl.textContent = 'Unseen';
    }
  }

  const sleepStateEl = document.getElementById('temple-sleep-state');
  if (sleepStateEl) {
    const todaySleep = getSleepEntry(todayStr);
    sleepStateEl.textContent = todaySleep ? 'Closed' : 'Unclosed';
  }

  const mindStateEl = document.getElementById('temple-mind-state');
  if (mindStateEl) {
    const recent = getMostRecentSession();
    mindStateEl.textContent = recent ? 'Held' : 'Quiet';
  }

  const mindLineEl = document.getElementById('temple-mind-line');
  if (mindLineEl) {
    const reflectionSession = getMostRecentReflectionSession();
    if (reflectionSession && reflectionSession.reflection) {
      mindLineEl.textContent = reflectionSession.reflection.trim();
      mindLineEl.hidden = false;
    } else {
      mindLineEl.textContent = '';
      mindLineEl.hidden = true;
    }
  }

  const bodyStateEl = document.getElementById('temple-body-state');
  if (bodyStateEl) {
    bodyStateEl.textContent = hasArrivedToday() ? 'Stood' : 'Unreturned';
  }

  const waterStateEl = document.getElementById('temple-water-state');
  if (waterStateEl) {
    waterStateEl.textContent = hasHeldToday() ? 'Stilled' : 'Unstirred';
  }
}
