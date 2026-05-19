import { CYCLE_NAMES } from '../constants.js';
import { state, today } from '../state.js';
import { getCareTurnState } from './temple.js';

const CARE_CYCLE_ROMAN = ['I', 'II', 'III'];

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
  const status = document.getElementById('hero-status');
  if (status) status.textContent = turnState.copy;
  const protocolLabel = document.getElementById('night-protocol-label');
  if (protocolLabel) protocolLabel.textContent = getNightProtocolLabel(cycleDay);
  renderTodayCycleIndicator(cycleDay, turnState);
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
}
