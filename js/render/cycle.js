import { CYCLE_NAMES } from '../constants.js';
import { state, todayStr, saveState } from '../state.js';
import { renderAllLists } from './today.js';
import { renderTodayCycle } from './common.js';

const ROMAN = ['I', 'II', 'III'];
const NODE_NAMES = ['Niacinamide', 'Salicylic', 'Rest'];

let _armTimer = null;
let _armedIndex = null;

function commitCycle(i) {
  clearTimeout(_armTimer);
  _armTimer = null;
  _armedIndex = null;
  state.cycleDay = i;
  state.lastCycleDate = todayStr;
  saveState();
  renderCycleList();
  renderTodayCycle();
  renderAllLists();
}

function armNode(i, nodeEl) {
  clearTimeout(_armTimer);
  _armTimer = null;
  _armedIndex = null;
  document.querySelectorAll('.al-node').forEach(n => n.classList.remove('is-armed'));
  const center = document.querySelector('.al-center');
  if (center) center.classList.remove('is-preview');
  nodeEl.classList.add('is-armed');
  const numEl = document.getElementById('al-numeral');
  const lblEl = document.getElementById('al-lbl');
  if (numEl) numEl.textContent = ROMAN[i];
  if (lblEl) lblEl.textContent = NODE_NAMES[i].toUpperCase();
  if (center) center.classList.add('is-preview');
  _armedIndex = i;
  _armTimer = setTimeout(() => commitCycle(i), 1500);
}

export function cancelCycleArm() {
  clearTimeout(_armTimer);
  _armTimer = null;
  _armedIndex = null;
  document.querySelectorAll('.al-node').forEach(n => n.classList.remove('is-armed'));
  const center = document.querySelector('.al-center');
  if (center) center.classList.remove('is-preview');
  const numEl = document.getElementById('al-numeral');
  const lblEl = document.getElementById('al-lbl');
  if (numEl) numEl.textContent = ROMAN[state.cycleDay];
  if (lblEl) lblEl.textContent = NODE_NAMES[state.cycleDay].toUpperCase();
}

export function renderCycleList() {
  clearTimeout(_armTimer);
  _armTimer = null;
  _armedIndex = null;

  const wrap = document.getElementById('cycle-astrolabe');
  if (!wrap) return;

  wrap.querySelectorAll('.al-node').forEach(n => n.remove());

  const center = document.querySelector('.al-center');
  if (center) center.classList.remove('is-preview');

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
      if (isActive) return;
      if (i === _armedIndex) {
        commitCycle(i);
      } else {
        armNode(i, btn);
      }
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
