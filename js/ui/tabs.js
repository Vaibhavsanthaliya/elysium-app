import { renderTemple } from '../render/temple.js';
import { renderAllLists } from '../render/today.js';
import { renderTodayPlan } from '../render/today-plan.js';
import { renderCycleList, cancelCycleArm } from '../render/cycle.js';
import { renderChronicle } from '../render/chronicle.js';
import { renderProgress, renderWeeklyPhotos } from '../render/progress.js';
import { updateSettingsView } from '../render/settings.js';
import { isClosedForToday } from '../domains/sleep.js';

let closedDayHandler = null;
let leavingTimer = null;

export function registerClosedDayHandler(fn) {
  closedDayHandler = typeof fn === 'function' ? fn : null;
}

function runRenderFor(name) {
  if (name === 'today') renderTodayPlan();
  if (name === 'temple') renderTemple();
  if (name === 'chronicle') renderChronicle();
  if (name === 'progress') { renderProgress(); renderWeeklyPhotos(); }
  if (name === 'cycle') renderCycleList();
  if (name === 'settings') updateSettingsView();
}

function clearLeavingPane() {
  if (leavingTimer) {
    clearTimeout(leavingTimer);
    leavingTimer = null;
  }

  document.querySelectorAll('.tab-pane.is-leaving').forEach(p => {
    p.classList.remove('is-leaving', 'active');
  });
}

function settlePaneLayout(pane) {
  pane.style.display = 'none';
  void pane.offsetHeight;
  pane.style.display = 'block';
  void pane.offsetHeight;
  pane.style.display = '';

  pane.getAnimations?.().forEach(animation => {
    try { animation.finish(); } catch {}
  });
}

export function refreshActivePaneLayout() {
  clearLeavingPane();

  const activePane = document.querySelector('.tab-pane.active:not(.is-leaving)');
  if (!activePane?.id?.startsWith('pane-')) return false;

  const name = activePane.id.slice(5);
  runRenderFor(name);
  window.scrollTo(0, 0);

  settlePaneLayout(activePane);

  return true;
}

export function switchTab(name, options = {}) {
  if (!options.skipClosedDayCheck && isClosedForToday()) {
    closedDayHandler?.();
    return false;
  }

  const newPane = document.getElementById('pane-' + name);
  if (!newPane) return false;

  const currentPane = document.querySelector('.tab-pane.active:not(.is-leaving)');
  if (currentPane?.id === 'pane-cycle') cancelCycleArm();

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const tabBtn = document.querySelector(`.tab[data-tab="${name}"]`);
  (tabBtn ?? document.querySelector('.tab[data-tab="temple"]')).classList.add('active');

  if (currentPane === newPane) {
    runRenderFor(name);
    if (options.settleLayout) settlePaneLayout(newPane);
    return true;
  }

  clearLeavingPane();

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const swap = () => {
    leavingTimer = null;
    if (currentPane) currentPane.classList.remove('active', 'is-leaving');
    window.scrollTo(0, 0);
    newPane.classList.add('active');
    runRenderFor(name);
    if (options.settleLayout) settlePaneLayout(newPane);
  };

  if (currentPane && !reduceMotion) {
    currentPane.classList.add('is-leaving');
    leavingTimer = setTimeout(swap, 120);
  } else {
    swap();
  }

  return true;
}
