import { CYCLE_NAMES } from '../constants.js';
import { state, todayStr, saveState } from '../state.js';
import { renderAllLists } from './today.js';
import { renderTodayCycle } from './common.js';
import { showToast } from '../ui/toast.js';

const ROMAN = ['I', 'II', 'III'];
const NODE_NAMES = ['Niacinamide', 'Salicylic', 'Rest'];

export function renderCycleList() {
  const wrap = document.getElementById('cycle-astrolabe');
  if (!wrap) return;

  wrap.querySelectorAll('.al-node').forEach(n => n.remove());

  const radius = 102;
  NODE_NAMES.forEach((name, i) => {
    const angle = -90 + (360 / 3) * i;
    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius;
    const isActive = i === state.cycleDay;

    const btn = document.createElement('button');
    btn.className = 'al-node' + (isActive ? ' active' : '');
    btn.setAttribute('aria-label', `${name} — cycle day ${i + 1}${isActive ? ', tonight' : ''}`);
    btn.style.cssText = `left: calc(50% + ${x}px - 26px); top: calc(50% + ${y}px - 26px)`;
    btn.innerHTML = `
      <span class="al-node-numeral">${ROMAN[i]}</span>
      <span class="al-node-name">${name}</span>
    `;
    btn.addEventListener('click', () => {
      state.cycleDay = i;
      state.lastCycleDate = todayStr;
      saveState();
      renderCycleList();
      renderTodayCycle();
      renderAllLists();
      showToast(CYCLE_NAMES[i]);
    });
    wrap.appendChild(btn);
  });

  const numEl = document.getElementById('al-numeral');
  const lblEl = document.getElementById('al-lbl');
  const eyebrow = document.getElementById('cycle-eyebrow');

  if (numEl) numEl.textContent = ROMAN[state.cycleDay];
  if (lblEl) lblEl.textContent = NODE_NAMES[state.cycleDay].toUpperCase();
  if (eyebrow) {
    eyebrow.textContent = `NIGHT ${ROMAN[state.cycleDay]} · ${NODE_NAMES[state.cycleDay].toUpperCase()}`;
  }
}
