import { CYCLE_NAMES, CYCLE_FULL_NAMES } from '../constants.js';
import { state, today } from '../state.js';
import { getStreak } from '../domains/care.js';

export function renderHeader() {
  const dl = document.getElementById('date-label');
  dl.textContent = today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  document.getElementById('streak-num').textContent = getStreak();
}

export function renderTodayCycle() {
  document.getElementById('cycle-tag').textContent = CYCLE_NAMES[state.cycleDay];
  document.getElementById('hero-cycle').textContent = `Tonight: ${CYCLE_FULL_NAMES[state.cycleDay]}`;
}
