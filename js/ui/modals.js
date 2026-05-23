// NOTE: renderAllLists is imported from render/today.js — this creates a safe ESM cycle
// (render/today.js imports openEditModal/openTaskInfoModal from here). Both sides only
// consume the imports inside function bodies, never at module evaluation time.
// Future EA: resolve via event delegation in main.js.
import { TASK_INFO } from '../constants.js';
import { daysBetween, uid, ymd } from '../utils.js';
import { state, saveState, todayStr } from '../state.js';
import {
  getSleepEntry,
  isClosedForToday,
  reopenSleepClosure,
  saveSleepClosure,
} from '../domains/sleep.js';
import {
  beginMindSession,
  endMindSession,
  getMostRecentReflectionSession,
  getTodaySession,
} from '../domains/mind.js';
import { arriveBody, getBodyArrivals } from '../domains/body.js';
import { getWaterHoldings, holdWater } from '../domains/water.js';
import { showToast } from './toast.js';
import { renderTemple, applyTempleTrace } from '../render/temple.js';
import { renderAllLists } from '../render/today.js';

let _confirmResolve = null;

export function showConfirm(message, confirmLabel) {
  return new Promise((resolve) => {
    _confirmResolve = resolve;
    const msgEl = document.getElementById('confirm-modal-msg');
    const okBtn = document.getElementById('confirm-modal-ok');
    if (msgEl) msgEl.textContent = message;
    if (okBtn) okBtn.textContent = confirmLabel || 'Confirm';
    document.getElementById('confirm-modal').hidden = false;
  });
}

export function registerConfirmModal() {
  function close(result) {
    document.getElementById('confirm-modal').hidden = true;
    if (_confirmResolve) { _confirmResolve(result); _confirmResolve = null; }
  }
  document.getElementById('confirm-modal-ok')?.addEventListener('click', () => close(true));
  document.getElementById('confirm-modal-cancel')?.addEventListener('click', () => close(false));
  document.getElementById('confirm-modal-backdrop')?.addEventListener('click', () => close(false));
}

let editContext = null;
let _bodyArrivedThisSession = false;
let _waterHeldThisSession = false;
const MIND_MIN_HELD_MS = 60000;
let mindSelectedDuration = 25;
let mindActiveSessionId = null;
let mindHolding = false;
let mindHoldStartedAtMs = 0;
let mindHoldTimer = null;

export function openTaskInfoModal(taskId) {
  const info = TASK_INFO[taskId];
  if (!info) return;
  document.getElementById('task-info-title').textContent = info.title;
  document.getElementById('task-info-what').textContent = info.what;
  document.getElementById('task-info-how').textContent = info.how;
  document.getElementById('task-info-skip').textContent = info.skip;
  document.getElementById('task-info-modal').hidden = false;
}

export function closeTaskInfoModal() {
  document.getElementById('task-info-modal').hidden = true;
}

// Expose to global scope for inline onclick attributes in index.html.
// TODO: remove this once task-info-modal onclick attrs are replaced
// with addEventListener wiring in main.js (future EA).
window.closeTaskInfoModal = closeTaskInfoModal;

export function openSleepModal() {
  const modal = document.getElementById('sleep-modal');
  const stateA = document.getElementById('sleep-state-a');
  const stateB = document.getElementById('sleep-state-b');
  const entry = getSleepEntry(todayStr);

  if (entry) {
    stateA.hidden = true;
    stateB.hidden = false;
  } else {
    stateA.hidden = false;
    stateB.hidden = true;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const eyebrow = document.getElementById('sleep-eyebrow');
    if (eyebrow) eyebrow.textContent = `HYPNOS · ${hh}:${mm}`;
    const noteEl = document.getElementById('sleep-note');
    if (noteEl) noteEl.value = '';

    const recentEl = document.getElementById('sleep-recent');
    if (recentEl) {
      const yd = new Date();
      yd.setDate(yd.getDate() - 1);
      const yesterdayStr = `${yd.getFullYear()}-${String(yd.getMonth() + 1).padStart(2, '0')}-${String(yd.getDate()).padStart(2, '0')}`;
      const yesterdayEntry = getSleepEntry(yesterdayStr);
      const yesterdayNote = yesterdayEntry && typeof yesterdayEntry.note === 'string' ? yesterdayEntry.note.trim() : '';
      if (yesterdayNote) {
        recentEl.textContent = yesterdayNote;
        recentEl.hidden = false;
      } else {
        recentEl.textContent = '';
        recentEl.hidden = true;
      }
    }
  }

  modal.hidden = false;
}

export function closeSleepModal() {
  if (isClosedForToday()) return false;
  document.getElementById('sleep-modal').hidden = true;
  return true;
}

export function saveSleepModal() {
  const noteText = document.getElementById('sleep-note')?.value?.trim() || '';
  if (!saveSleepClosure(todayStr, noteText)) {
    showToast('Could not save');
    return;
  }
  saveState();
  const sleepStateEl = document.getElementById('temple-sleep-state');
  if (sleepStateEl) sleepStateEl.textContent = 'Closed';
  document.getElementById('sleep-state-a').hidden = true;
  document.getElementById('sleep-state-b').hidden = false;
  applyTempleTrace('sleep');
}

export function reopenSleepModal() {
  if (!reopenSleepClosure(todayStr)) {
    showToast('Could not reopen');
    return false;
  }
  saveState();
  renderTemple();
  document.getElementById('sleep-modal').hidden = true;
  return true;
}

function clearMindHoldTimer() {
  if (!mindHoldTimer) return;
  clearInterval(mindHoldTimer);
  mindHoldTimer = null;
}

function getMindHoldElapsedMs() {
  if (!mindHoldStartedAtMs) return 0;
  return Math.max(0, Date.now() - mindHoldStartedAtMs);
}

function updateMindHoldUi() {
  const elapsedMs = getMindHoldElapsedMs();
  const endBtn = document.getElementById('mind-end');
  const fillEl = document.getElementById('mind-held-fill');
  const durationMs = Math.max(1, mindSelectedDuration * 60000);
  const progress = Math.min(1, elapsedMs / durationMs);

  if (fillEl) fillEl.style.setProperty('--mind-held-progress', String(progress));
  if (endBtn) endBtn.hidden = elapsedMs < MIND_MIN_HELD_MS;
}

function renderMindRecentReflection() {
  const el = document.getElementById('mind-recent-reflection');
  if (!el) return;

  const recent = getMostRecentReflectionSession();
  if (!recent) {
    el.hidden = true;
    el.textContent = '';
    return;
  }

  const dayDelta = daysBetween(recent.date, todayStr);
  const label = dayDelta === 1 ? 'Yesterday' : 'Last held';
  el.textContent = `${label}: "${recent.reflection.trim()}"`;
  el.hidden = false;
}

function showMindState(stateName) {
  document.getElementById('mind-state-a').hidden = stateName !== 'a';
  document.getElementById('mind-state-b').hidden = stateName !== 'b';
  document.getElementById('mind-state-c').hidden = stateName !== 'c';
}

function setMindDuration(durationMinutes) {
  mindSelectedDuration = Number(durationMinutes) || 25;
  document.querySelectorAll('#mind-modal .mind-dur').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.min) === mindSelectedDuration);
  });
}

function startMindHold(session) {
  mindActiveSessionId = session.id;
  mindHolding = true;
  setMindDuration(session.durationMinutes);
  const startMs = Date.parse(session.startedAt || '');
  mindHoldStartedAtMs = Number.isFinite(startMs) ? startMs : Date.now();
  showMindState('b');
  updateMindHoldUi();
  clearMindHoldTimer();
  mindHoldTimer = setInterval(updateMindHoldUi, 1000);
}

function openMindModal() {
  clearMindHoldTimer();
  mindActiveSessionId = null;
  mindHolding = false;
  mindHoldStartedAtMs = 0;
  setMindDuration(25);
  renderMindRecentReflection();

  const reflEl = document.getElementById('mind-reflection');
  if (reflEl) reflEl.value = '';

  const activeSession = getTodaySession();
  if (activeSession && !activeSession.completed) {
    startMindHold(activeSession);
  } else {
    showMindState('a');
  }

  document.getElementById('mind-modal').hidden = false;
}

function closeMindModal() {
  if (mindHolding) return;
  clearMindHoldTimer();
  document.getElementById('mind-modal').hidden = true;
  mindActiveSessionId = null;
  mindHoldStartedAtMs = 0;
}

export function openMindModalIfActive() {
  const activeSession = getTodaySession();
  if (activeSession && !activeSession.completed) {
    openMindModal();
  }
}

export function registerMindModal() {
  document.getElementById('temple-goto-mind')?.addEventListener('click', openMindModal);
  document.getElementById('mind-modal-backdrop')?.addEventListener('click', closeMindModal);

  document.querySelectorAll('#mind-modal .mind-dur').forEach(btn => {
    btn.addEventListener('click', () => setMindDuration(btn.dataset.min));
  });

  document.getElementById('mind-begin')?.addEventListener('click', () => {
    const session = beginMindSession(mindSelectedDuration);
    startMindHold(session);
    saveState();
  });

  document.getElementById('mind-end')?.addEventListener('click', () => {
    if (!mindHolding || getMindHoldElapsedMs() < MIND_MIN_HELD_MS) {
      updateMindHoldUi();
      return;
    }

    mindHolding = false;
    clearMindHoldTimer();
    if (mindActiveSessionId) {
      endMindSession(mindActiveSessionId, '');
      saveState();
      renderTemple();
    }
    showMindState('c');
    setTimeout(() => document.getElementById('mind-reflection')?.focus(), 200);
  });

  document.getElementById('mind-complete')?.addEventListener('click', () => {
    const reflection = document.getElementById('mind-reflection')?.value?.trim() || '';
    if (mindActiveSessionId) {
      endMindSession(mindActiveSessionId, reflection);
    }
    saveState();
    renderTemple();
    applyTempleTrace('mind');
    document.getElementById('mind-modal').hidden = true;
    mindActiveSessionId = null;
    mindHolding = false;
    mindHoldStartedAtMs = 0;
    clearMindHoldTimer();
  });
}

function renderBodyHorizonMarks() {
  const marksEl = document.getElementById('body-marks');
  if (!marksEl) return;
  marksEl.querySelectorAll('.body-arrival-mark').forEach(el => el.remove());
  const arrivals = getBodyArrivals(todayStr);
  for (const a of arrivals) {
    const [wh, wm] = a.at.split(':').map(Number);
    if (!Number.isFinite(wh) || !Number.isFinite(wm)) continue;
    const pct = ((wh * 60 + wm) / 1440 * 100).toFixed(1);
    const mark = document.createElement('div');
    mark.className = 'body-arrival-mark';
    mark.style.left = `${pct}%`;
    marksEl.appendChild(mark);
  }
}

export function openBodyModal() {
  _bodyArrivedThisSession = false;
  renderBodyHorizonMarks();
  const btn = document.getElementById('body-arrive-btn');
  if (btn) { btn.textContent = 'Returned'; btn.classList.remove('is-still'); }
  document.getElementById('body-modal').hidden = false;
}

export function closeBodyModal() {
  document.getElementById('body-modal').hidden = true;
  if (_bodyArrivedThisSession) {
    _bodyArrivedThisSession = false;
    applyTempleTrace('body');
  }
}

export function registerBodyModal() {
  document.getElementById('body-modal-backdrop')?.addEventListener('click', closeBodyModal);
  document.getElementById('body-modal-close')?.addEventListener('click', closeBodyModal);
  document.getElementById('body-arrive-btn')?.addEventListener('click', () => {
    arriveBody(todayStr);
    _bodyArrivedThisSession = true;
    saveState();
    renderTemple();
    renderBodyHorizonMarks();
    const btn = document.getElementById('body-arrive-btn');
    if (btn) btn.classList.add('is-still');
    setTimeout(() => {
      const b = document.getElementById('body-arrive-btn');
      if (b) b.classList.remove('is-still');
    }, 3000);
  });
}

function renderWaterSurfaceMarks() {
  const marksEl = document.getElementById('water-marks');
  if (!marksEl) return;
  marksEl.querySelectorAll('.water-holding-mark').forEach(el => el.remove());

  const yd = new Date();
  yd.setDate(yd.getDate() - 1);
  const yesterdayStr = ymd(yd);

  const appendMark = (entry, linger = false) => {
    if (!entry || typeof entry.at !== 'string') return;
    const [wh, wm] = entry.at.split(':').map(Number);
    if (!Number.isFinite(wh) || !Number.isFinite(wm)) return;
    const pct = ((wh * 60 + wm) / 1440 * 100).toFixed(1);
    const mark = document.createElement('div');
    mark.className = linger ? 'water-holding-mark is-linger' : 'water-holding-mark';
    mark.style.left = `${pct}%`;
    marksEl.appendChild(mark);
  };

  getWaterHoldings(yesterdayStr).forEach(entry => appendMark(entry, true));
  getWaterHoldings(todayStr).forEach(entry => appendMark(entry, false));
}

export function openWaterModal() {
  _waterHeldThisSession = false;
  renderWaterSurfaceMarks();
  const btn = document.getElementById('water-hold-btn');
  if (btn) { btn.textContent = 'Held'; btn.classList.remove('is-still'); }
  document.getElementById('water-modal').hidden = false;
}

export function closeWaterModal() {
  document.getElementById('water-modal').hidden = true;
  if (_waterHeldThisSession) {
    _waterHeldThisSession = false;
    applyTempleTrace('water');
  }
}

export function registerWaterModal() {
  document.getElementById('water-modal-backdrop')?.addEventListener('click', closeWaterModal);
  document.getElementById('water-modal-close')?.addEventListener('click', closeWaterModal);
  document.getElementById('water-hold-btn')?.addEventListener('click', () => {
    holdWater(todayStr);
    _waterHeldThisSession = true;
    renderTemple();
    renderWaterSurfaceMarks();
    const btn = document.getElementById('water-hold-btn');
    if (btn) btn.classList.add('is-still');
    setTimeout(() => {
      const b = document.getElementById('water-hold-btn');
      if (b) b.classList.remove('is-still');
    }, 3000);
  });
}

export function openEditModal(section, task) {
  editContext = { mode: 'edit', section, task };
  document.getElementById('modal-title').textContent = 'Edit step';
  document.getElementById('edit-text').value = task.text;
  document.getElementById('edit-section').value = section;
  document.getElementById('section-field').hidden = false;

  const cycleField = document.getElementById('cycle-field');
  if (section === 'night') {
    cycleField.hidden = false;
    let foundDay = state.cycleDay;
    for (let i = 0; i < 3; i++) {
      if (state.tasks.night[i].some(t => t.id === task.id)) { foundDay = i; break; }
    }
    document.getElementById('edit-cycle').value = String(foundDay);
    editContext.cycleDay = foundDay;
  } else {
    cycleField.hidden = true;
  }

  document.getElementById('modal-delete').hidden = false;
  document.getElementById('edit-modal').hidden = false;
  setTimeout(() => document.getElementById('edit-text').focus(), 250);
}

export function openAddModal(section) {
  editContext = { mode: 'add', section };
  document.getElementById('modal-title').textContent = 'New step';
  document.getElementById('edit-text').value = '';
  document.getElementById('edit-section').value = section;
  document.getElementById('section-field').hidden = false;

  const cycleField = document.getElementById('cycle-field');
  if (section === 'night') {
    cycleField.hidden = false;
    document.getElementById('edit-cycle').value = String(state.cycleDay);
  } else {
    cycleField.hidden = true;
  }

  document.getElementById('modal-delete').hidden = true;
  document.getElementById('edit-modal').hidden = false;
  setTimeout(() => document.getElementById('edit-text').focus(), 250);
}

export function closeModal() {
  document.getElementById('edit-modal').hidden = true;
  editContext = null;
}

export function handleSectionChange(newSection) {
  document.getElementById('cycle-field').hidden = (newSection !== 'night');
  if (newSection === 'night') {
    document.getElementById('edit-cycle').value = String(state.cycleDay);
  }
}

export function saveTask() {
  if (!editContext) return;
  const text = document.getElementById('edit-text').value.trim();
  if (!text) { showToast('Name your step'); return; }

  const newSection = document.getElementById('edit-section').value;
  const cycleVal = document.getElementById('edit-cycle').value;
  if (!['morning', 'night', 'habit'].includes(newSection)) {
    showToast('Choose a valid section');
    return;
  }
  if (newSection === 'night' && cycleVal !== 'all' && !['0', '1', '2'].includes(cycleVal)) {
    showToast('Choose a valid cycle day');
    return;
  }

  if (editContext.mode === 'add') {
    const task = { id: uid(), text };
    if (newSection === 'night') {
      if (cycleVal === 'all') {
        for (let i = 0; i < 3; i++) {
          state.tasks.night[i].push({ id: uid(), text });
        }
      } else {
        state.tasks.night[parseInt(cycleVal)].push(task);
      }
    } else {
      state.tasks[newSection].push(task);
    }
  } else {
    removeTaskById(editContext.task.id);
    const task = { ...editContext.task, text };
    if (newSection === 'night') {
      if (cycleVal === 'all') {
        for (let i = 0; i < 3; i++) {
          state.tasks.night[i].push({ id: uid(), text });
        }
      } else {
        state.tasks.night[parseInt(cycleVal)].push(task);
      }
    } else {
      state.tasks[newSection].push(task);
    }
  }

  saveState();
  renderAllLists();
  closeModal();
}

export function removeTaskById(id) {
  state.tasks.morning = state.tasks.morning.filter(t => t.id !== id);
  state.tasks.habit = state.tasks.habit.filter(t => t.id !== id);
  for (let i = 0; i < 3; i++) {
    state.tasks.night[i] = state.tasks.night[i].filter(t => t.id !== id);
  }
}

export async function deleteTask() {
  if (!editContext || editContext.mode !== 'edit') return;
  const confirmed = await showConfirm('Remove this step?', 'Remove');
  if (!confirmed) return;
  removeTaskById(editContext.task.id);
  saveState();
  renderAllLists();
  closeModal();
}
