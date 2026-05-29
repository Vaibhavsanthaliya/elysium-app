import { CYCLE_NAMES, CARE_PROTOCOL_NOTES } from '../constants.js';
import { state, today, todayStr } from '../state.js';
import { getLastChronicleNoteForCycleDay } from '../domains/chronicle.js';
import { getMorningTasks, getNightTasks, getTodayChecks, getCareRecord, getPreviousCareRecordForCycle } from '../domains/care.js';
import { getCareTurnState } from './temple.js';

const CARE_CYCLE_ROMAN = ['I', 'II', 'III'];
const CARE_MEMORY_LABELS = ['Last Niacinamide night', 'Last Salicylic night', 'Last rest night'];
const CARE_MEMORY_MAX = 160;

function getCareCycleLabel(cycleDay) {
  return `Night ${CARE_CYCLE_ROMAN[cycleDay]} · ${CYCLE_NAMES[cycleDay]}`;
}

function getCareCycleTurn(cycleDay) {
  return `Night ${CARE_CYCLE_ROMAN[cycleDay]}`;
}

function getNightProtocolLabel(cycleDay) {
  const name = CYCLE_NAMES[cycleDay];
  return name.toLowerCase().includes('rest') ? 'Rest night' : `Tonight · ${name}`;
}

function titleCaseState(label) {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getMemoryExcerpt(body) {
  const text = String(body || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return text.length > CARE_MEMORY_MAX ? `${text.slice(0, CARE_MEMORY_MAX - 3).trim()}...` : text;
}

function renderCareTurnMemory(cycleDay) {
  const wrap = document.getElementById('care-turn-memory');
  if (!wrap) return;

  const label = document.getElementById('care-turn-memory-label');
  const body = document.getElementById('care-turn-memory-body');
  const section = wrap.closest('.care-night-section');
  const memory = getLastChronicleNoteForCycleDay(cycleDay);
  const excerpt = getMemoryExcerpt(memory?.note?.body);

  if (!excerpt) {
    wrap.hidden = true;
    section?.classList.remove('has-care-memory');
    if (label) label.textContent = '';
    if (body) body.textContent = '';
    return;
  }

  if (label) label.textContent = CARE_MEMORY_LABELS[cycleDay] || CARE_MEMORY_LABELS[0];
  if (body) body.textContent = excerpt;
  section?.classList.add('has-care-memory');
  wrap.hidden = false;
}

const CARE_CONDITION_LABELS = { calmer: 'calmer', same: 'same', irritated: 'irritated' };

function formatCareMemoryDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// EA-174 — surfaces one prior same-protocol Care record (user-authored only).
function renderCareProtocolMemory(cycleDay) {
  const wrap = document.getElementById('care-protocol-memory');
  if (!wrap) return;

  const body = document.getElementById('care-protocol-memory-body');
  const dateEl = document.getElementById('care-protocol-memory-date');
  if (body) body.textContent = '';

  const result = getPreviousCareRecordForCycle(todayStr, cycleDay);
  const rec = result?.record;
  if (!result || !rec || (!rec.condition && !rec.morningNote && !rec.reactionNote)) {
    wrap.hidden = true;
    if (dateEl) dateEl.textContent = '';
    return;
  }

  const lines = [];
  if (rec.condition) lines.push(['Skin this morning', CARE_CONDITION_LABELS[rec.condition] || rec.condition]);
  if (rec.morningNote) lines.push(['Morning note', rec.morningNote]);
  if (rec.reactionNote) lines.push(['Reaction note', rec.reactionNote]);

  if (body) {
    lines.forEach(([label, value]) => {
      const p = document.createElement('p');
      p.className = 'care-protocol-memory-line';
      const lab = document.createElement('span');
      lab.className = 'care-protocol-memory-line-label';
      lab.textContent = `${label}: `;
      p.appendChild(lab);
      p.appendChild(document.createTextNode(value));
      body.appendChild(p);
    });
  }

  if (dateEl) dateEl.textContent = `From ${formatCareMemoryDate(result.dateStr)}`;
  wrap.hidden = false;
}

function renderTodayCycleIndicator(cycleDay, turnState) {
  const indicator = document.getElementById('care-state-indicator');
  if (!indicator) return;

  indicator.dataset.careState = turnState.key;
  indicator.querySelectorAll('[data-cycle-mark]').forEach(mark => {
    const cycleMark = Number(mark.dataset.cycleMark);
    mark.classList.toggle('is-current', cycleMark === cycleDay);
  });

  const label = document.getElementById('care-state-label');
  if (label) label.textContent = turnState.label;
}

function renderNightProtocolControl(turnState) {
  const keeper = document.getElementById('care-night-keeper');
  const action = document.getElementById('care-night-action');
  const stateLine = document.getElementById('care-night-state');
  const steps = document.getElementById('care-night-steps');
  const stepsMeta = document.getElementById('care-night-steps-meta');
  if (!keeper && !action && !stateLine && !steps && !stepsMeta) return;

  const checks = getTodayChecks();
  const nightTasks = getNightTasks();
  const nightDone = nightTasks.filter(t => checks[t.id]).length;
  const nightKept = nightTasks.length > 0 && nightDone === nightTasks.length;
  const inMotion = nightDone > 0 && !nightKept;
  const stateKey = nightKept ? 'kept' : inMotion ? 'motion' : turnState.key;

  if (keeper) keeper.dataset.nightState = stateKey;

  if (action) {
    action.disabled = nightKept || nightTasks.length === 0;
    action.textContent = nightKept ? 'Kept' : 'Keep tonight';
  }

  if (stateLine) {
    if (!nightTasks.length) {
      stateLine.textContent = 'Add a step to keep this night.';
    } else if (nightKept) {
      stateLine.textContent = 'Night kept.';
    } else if (inMotion) {
      stateLine.textContent = 'The protocol is in motion.';
    } else if (turnState.key === 'resting') {
      stateLine.textContent = 'A quiet rest turn.';
    } else {
      stateLine.textContent = 'Keep the protocol when the steps are done in life.';
    }
  }

  if (steps) {
    steps.dataset.nightState = stateKey;
    if (inMotion) steps.open = true;
  }

  if (stepsMeta) {
    stepsMeta.textContent = nightKept ? 'Kept' : inMotion ? 'In motion' : 'View protocol';
  }
}

function renderMorningProtocolControl() {
  const keeper = document.getElementById('care-morning-keeper');
  const action = document.getElementById('care-morning-action');
  const stateLine = document.getElementById('care-morning-state');
  const steps = document.getElementById('care-morning-steps');
  const stepsMeta = document.getElementById('care-morning-steps-meta');
  if (!keeper && !action && !stateLine && !steps && !stepsMeta) return;

  const checks = getTodayChecks();
  const morningTasks = getMorningTasks();
  const morningDone = morningTasks.filter(t => checks[t.id]).length;
  const morningKept = morningTasks.length > 0 && morningDone === morningTasks.length;
  const inMotion = morningDone > 0 && !morningKept;
  const stateKey = morningKept ? 'kept' : inMotion ? 'motion' : 'untouched';

  if (keeper) keeper.dataset.morningState = stateKey;

  if (action) {
    action.disabled = morningKept || morningTasks.length === 0;
    action.textContent = morningKept ? 'Morning kept' : 'Open the day';
  }

  if (stateLine) {
    if (!morningTasks.length) {
      stateLine.textContent = 'Add a step to keep the morning.';
    } else if (morningKept) {
      stateLine.textContent = 'Morning kept.';
    } else if (inMotion) {
      stateLine.textContent = 'The morning is in motion.';
    } else {
      stateLine.textContent = 'When the morning has been kept.';
    }
  }

  if (steps) {
    steps.dataset.morningState = stateKey;
    if (inMotion) steps.open = true;
  }

  if (stepsMeta) {
    stepsMeta.textContent = morningKept ? 'Kept' : inMotion ? 'In motion' : 'View morning';
  }
}

export function renderHeader() {
  const dl = document.getElementById('date-label');
  dl.textContent = today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export function renderTodayCycle() {
  const cycleDay = state.cycleDay;
  const turnState = getCareTurnState();
  const cycleTag = document.getElementById('cycle-tag');
  if (cycleTag) cycleTag.textContent = getCareCycleTurn(cycleDay);
  const ctn = document.getElementById('care-tonight');
  if (ctn) ctn.textContent = getCareCycleLabel(cycleDay);
  const protocolLabel = document.getElementById('night-protocol-label');
  if (protocolLabel) protocolLabel.textContent = getNightProtocolLabel(cycleDay);
  renderTodayCycleIndicator(cycleDay, turnState);
  renderMorningProtocolControl();
  renderNightProtocolControl(turnState);
  renderCareProtocolMemory(cycleDay);
  renderCareTurnMemory(cycleDay);
  const noteEl = document.getElementById('care-protocol-note');
  if (noteEl) noteEl.textContent = CARE_PROTOCOL_NOTES[cycleDay] || '';
  const strip = document.getElementById('care-cycle-strip');
  if (!strip) return;
  strip.innerHTML = CYCLE_NAMES.map((name, i) => {
    const isActive = i === cycleDay;
    const label = isActive ? titleCaseState(turnState.label) : i === (cycleDay + 1) % 3 ? 'Tomorrow' : 'Last night';
    return `<div class="care-cycle-card${isActive ? ` active state-${turnState.key}` : ''}">` +
      `<div class="care-cycle-ix">${CARE_CYCLE_ROMAN[i]}</div>` +
      `<div class="care-cycle-nm">${name}</div>` +
      `<div class="care-cycle-sm">${label}</div>` +
      `</div>`;
  }).join('');
  renderCareCheckIn();
  renderCareReactionNote();
}

export function renderCareCheckIn() {
  const rec = getCareRecord(todayStr);
  document.querySelectorAll('#care-condition-chips .care-checkin-chip').forEach(chip => {
    chip.classList.toggle('is-selected', chip.dataset.condition === rec.condition);
  });
  const noteEl = document.getElementById('care-morning-note');
  if (noteEl && document.activeElement !== noteEl) noteEl.value = rec.morningNote || '';
}

export function renderCareReactionNote() {
  const rec = getCareRecord(todayStr);
  const noteEl = document.getElementById('care-reaction-note');
  if (noteEl && document.activeElement !== noteEl) noteEl.value = rec.reactionNote || '';
}
