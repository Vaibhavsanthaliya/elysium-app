import { renderTemple } from '../render/temple.js';
import { renderAllLists } from '../render/today.js';
import { renderCycleList } from '../render/cycle.js';
import { renderChronicle } from '../render/chronicle.js';
import { renderProgress, renderWeeklyPhotos } from '../render/progress.js';
import { updateSettingsView } from '../render/settings.js';

export function switchTab(name) {
  window.scrollTo(0, 0);
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('pane-' + name).classList.add('active');
  document.querySelector(`.tab[data-tab="${name}"]`).classList.add('active');

  if (name === 'temple') renderTemple();
  if (name === 'chronicle') renderChronicle();
  if (name === 'progress') { renderProgress(); renderWeeklyPhotos(); }
  if (name === 'cycle') renderCycleList();
  if (name === 'settings') updateSettingsView();
}
