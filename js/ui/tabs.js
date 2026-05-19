import { renderTemple } from '../render/temple.js';
import { renderAllLists } from '../render/today.js';
import { renderCycleList } from '../render/cycle.js';
import { renderChronicle } from '../render/chronicle.js';
import { renderProgress, renderWeeklyPhotos } from '../render/progress.js';
import { updateSettingsView } from '../render/settings.js';
import { isClosedForToday } from '../domains/sleep.js';

let closedDayHandler = null;

export function registerClosedDayHandler(fn) {
  closedDayHandler = typeof fn === 'function' ? fn : null;
}

export function switchTab(name) {
  if (isClosedForToday()) {
    closedDayHandler?.();
    return false;
  }

  window.scrollTo(0, 0);
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('pane-' + name).classList.add('active');
  const tabBtn = document.querySelector(`.tab[data-tab="${name}"]`);
  (tabBtn ?? document.querySelector('.tab[data-tab="temple"]')).classList.add('active');

  if (name === 'temple') renderTemple();
  if (name === 'chronicle') renderChronicle();
  if (name === 'progress') { renderProgress(); renderWeeklyPhotos(); }
  if (name === 'cycle') renderCycleList();
  if (name === 'settings') updateSettingsView();
  return true;
}
