import { state, todayStr } from '../state.js';
import { CYCLE_NAMES } from '../constants.js';
import { getTodayChecks, getNightTasks } from '../domains/care.js';
import { getLightPeriodLabel, getLastWitness } from '../domains/light.js';
import { getSleepEntry } from '../domains/sleep.js';
import { formatHeldMs, getMostRecentSession, getSessionHeldMs } from '../domains/mind.js';

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

function getDailyLine() {
  if (getSleepEntry(todayStr)) return 'The day has been closed.';

  const turnState = getCareTurnState();
  if (turnState.key === 'kept') return 'The night has been kept.';
  if (turnState.key === 'motion') return 'The night moves quietly.';

  if (state.chronicle?.notes?.[todayStr]?.body) return 'A line was left.';

  const recent = getMostRecentSession();
  if (recent && recent.date === todayStr) return 'A time was held.';

  if (getLastWitness(todayStr)) return 'Light was seen.';

  return '';
}

export function renderTemple() {
  const h = new Date().getHours();
  const period = TEMPLE_PERIOD_BUCKETS.find(p => h >= p.start && h < p.end) ?? TEMPLE_PERIOD_BUCKETS[0];
  const paneEl = document.getElementById('pane-temple');
  if (paneEl) paneEl.dataset.period = period.key;

  const lineEl = document.getElementById('temple-daily-line');
  if (lineEl) lineEl.textContent = getDailyLine();

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
    sleepStateEl.textContent = todaySleep ? 'Closed' : '—';
  }

  const mindStateEl = document.getElementById('temple-mind-state');
  if (mindStateEl) {
    const recent = getMostRecentSession();
    mindStateEl.textContent = recent ? `Held · ${formatHeldMs(getSessionHeldMs(recent))}` : 'Unheld';
  }
}
