import { CYCLE_FULL_NAMES, CYCLE_NAMES, CYCLE_DESC } from '../constants.js';
import { state, todayStr, saveState } from '../state.js';
import { renderAllLists } from './today.js';
import { renderTodayCycle } from './common.js';
import { showToast } from '../ui/toast.js';

export function renderCycleList() {
  const list = document.getElementById('cycle-list');
  list.innerHTML = '';
  CYCLE_FULL_NAMES.forEach((name, i) => {
    const card = document.createElement('div');
    card.className = 'cycle-card' + (i === state.cycleDay ? ' active' : '');
    card.innerHTML = `
      <div class="cycle-card-top">
        <span class="cycle-day-label">Cycle day ${i + 1}</span>
        ${i === state.cycleDay ? '<span class="cycle-active-badge">Tonight</span>' : ''}
      </div>
      <div class="cycle-name">${name.split('—')[1].trim()}</div>
      <div class="cycle-steps-text">${CYCLE_DESC[i]}</div>
    `;
    card.addEventListener('click', () => {
      state.cycleDay = i;
      state.lastCycleDate = todayStr;
      saveState();
      renderCycleList();
      renderTodayCycle();
      renderAllLists();
      showToast(`Switched to ${CYCLE_NAMES[i]} night`);
    });
    list.appendChild(card);
  });
}
