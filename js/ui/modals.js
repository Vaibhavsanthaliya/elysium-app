// NOTE: renderAllLists is imported from render/today.js — this creates a safe ESM cycle
// (render/today.js imports openEditModal/openTaskInfoModal from here). Both sides only
// consume the imports inside function bodies, never at module evaluation time.
// Future EA: resolve via event delegation in main.js.
import { TASK_INFO, BODY_RELIEF_AREAS } from '../constants.js';
import { uid, ymd } from '../utils.js';
import { state, saveState, todayStr } from '../state.js';
import {
  getSleepClosureInvitations,
  getSleepEntry,
  isClosedForToday,
  reopenSleepClosure,
  saveSleepClosure,
} from '../domains/sleep.js';
import { saveSleepShutdownDecisions, addTodayIntention } from '../domains/today-plan.js';
import { getMindReflectionEntries, getMindOffload, saveMindOffload, clearMindOffload } from '../domains/mind.js';
import { arriveBody, getBodyArrivals } from '../domains/body.js';
import { showToast } from './toast.js';
import { renderTemple, applyTempleTrace } from '../render/temple.js';
import { renderAllLists } from '../render/today.js';
import { renderTodayPlan } from '../render/today-plan.js';

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
let _sleepShutdownDecisions = new Map(); // id → 'carry' | 'pass'
let _bodyArrivedThisSession = false;
let _bodySelectedArea = null;
let _mindArrivedThisSession = false;

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

function renderSleepInvitations() {
  const invitationsEl = document.getElementById('sleep-invitations');
  if (!invitationsEl) return;

  invitationsEl.replaceChildren();
  getSleepClosureInvitations().forEach((invitation, idx) => {
    const row = document.createElement('div');
    row.className = 'sleep-invitation';

    const index = document.createElement('span');
    index.className = 'sleep-invitation-index';
    index.textContent = String(idx + 1).padStart(2, '0');

    const text = document.createElement('span');
    text.className = 'sleep-invitation-text';
    text.textContent = invitation;

    row.append(index, text);
    invitationsEl.appendChild(row);
  });
}

function renderSleepShutdown() {
  const section = document.getElementById('sleep-shutdown');
  const list = document.getElementById('sleep-shutdown-list');
  if (!section || !list) return;

  const intentions = Array.isArray(state.today?.intentions) ? state.today.intentions : [];
  const unkept = intentions.filter(i => !i.kept);

  if (!unkept.length) {
    section.hidden = true;
    return;
  }

  list.replaceChildren();

  unkept.forEach(intention => {
    const item = document.createElement('div');
    item.className = 'sleep-shutdown-item';
    item.dataset.id = intention.id;

    const text = document.createElement('span');
    text.className = 'sleep-shutdown-text';
    text.textContent = intention.text;

    const actions = document.createElement('div');
    actions.className = 'sleep-shutdown-actions';

    const carryBtn = document.createElement('button');
    carryBtn.type = 'button';
    carryBtn.className = 'sleep-shutdown-carry';
    carryBtn.textContent = 'Carry tomorrow';

    const passBtn = document.createElement('button');
    passBtn.type = 'button';
    passBtn.className = 'sleep-shutdown-pass';
    passBtn.textContent = 'Let pass';

    carryBtn.addEventListener('click', () => {
      const current = _sleepShutdownDecisions.get(intention.id);
      if (current === 'carry') {
        _sleepShutdownDecisions.delete(intention.id);
        item.classList.remove('is-carry');
      } else {
        _sleepShutdownDecisions.set(intention.id, 'carry');
        item.classList.add('is-carry');
        item.classList.remove('is-pass');
      }
    });

    passBtn.addEventListener('click', () => {
      const current = _sleepShutdownDecisions.get(intention.id);
      if (current === 'pass') {
        _sleepShutdownDecisions.delete(intention.id);
        item.classList.remove('is-pass');
      } else {
        _sleepShutdownDecisions.set(intention.id, 'pass');
        item.classList.add('is-pass');
        item.classList.remove('is-carry');
      }
    });

    actions.append(carryBtn, passBtn);
    item.append(text, actions);
    list.appendChild(item);
  });

  section.hidden = false;
}

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
    _sleepShutdownDecisions = new Map();
    const eyebrow = document.getElementById('sleep-eyebrow');
    if (eyebrow) eyebrow.textContent = 'HYPNOS';

    renderSleepInvitations();
    renderSleepShutdown();

    const parkingEl = document.getElementById('sleep-parking');
    if (parkingEl) parkingEl.value = '';

    const recentEl = document.getElementById('sleep-recent');
    if (recentEl) {
      const yd = new Date();
      yd.setDate(yd.getDate() - 1);
      const yesterdayStr = ymd(yd);
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
  _sleepShutdownDecisions = new Map();
  document.getElementById('sleep-modal').hidden = true;
  return true;
}

export function saveSleepModal() {
  saveSleepShutdownDecisions(_sleepShutdownDecisions);
  _sleepShutdownDecisions = new Map();
  const parkingEl = document.getElementById('sleep-parking');
  const noteText = parkingEl ? parkingEl.value : '';
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

function mindThreadDateLabel(dateStr) {
  const now = new Date();
  if (dateStr === todayStr) return 'Today';
  const [y, m, d] = dateStr.split('-').map(Number);
  const diff = Math.round((now - new Date(y, m - 1, d)) / 86400000);
  if (diff === 1) return 'Yesterday';
  if (diff === 2) return 'Two days ago';
  if (diff === 3) return 'Three days ago';
  if (diff <= 6) return 'Earlier this week';
  if (diff <= 13) return 'Last week';
  return 'Some time ago';
}

function renderMindThreads() {
  const el = document.getElementById('mind-threads');
  if (!el) return;
  const entries = getMindReflectionEntries()
    .sort((a, b) => (b.dateStr > a.dateStr ? 1 : -1))
    .slice(0, 3);
  el.replaceChildren();
  if (!entries.length) { el.hidden = true; return; }

  const label = document.createElement('div');
  label.className = 'mind-threads-label';
  label.textContent = 'Earlier threads';
  el.appendChild(label);

  entries.forEach(entry => {
    const thread = document.createElement('div');
    thread.className = 'mind-thread';
    const meta = document.createElement('div');
    meta.className = 'mind-thread-meta';
    meta.textContent = mindThreadDateLabel(entry.dateStr);
    const body = document.createElement('div');
    body.className = 'mind-thread-body';
    body.textContent = entry.body;
    thread.append(meta, body);
    el.appendChild(thread);
  });

  el.hidden = false;
}

function showMindMessage(text) {
  const msgEl = document.getElementById('mind-offload-message');
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.hidden = false;
}

function openMindModal() {
  _mindArrivedThisSession = false;
  const offload = getMindOffload(todayStr);
  const inputEl = document.getElementById('mind-offload-input');
  const msgEl = document.getElementById('mind-offload-message');
  if (inputEl) inputEl.value = offload?.text || '';
  if (msgEl) { msgEl.textContent = ''; msgEl.hidden = true; }
  renderMindThreads();
  document.getElementById('mind-modal').hidden = false;
  setTimeout(() => inputEl?.focus(), 180);
}

function closeMindModal() {
  document.getElementById('mind-modal').hidden = true;
  if (_mindArrivedThisSession) {
    _mindArrivedThisSession = false;
    applyTempleTrace('mind');
  }
}

export function registerMindModal() {
  document.getElementById('temple-goto-mind')?.addEventListener('click', openMindModal);
  document.getElementById('mind-modal-backdrop')?.addEventListener('click', closeMindModal);

  document.getElementById('mind-offload-save')?.addEventListener('click', () => {
    const text = document.getElementById('mind-offload-input')?.value?.trim() || '';
    if (!text) { showMindMessage('Nothing to hold.'); return; }
    if (saveMindOffload(text)) {
      _mindArrivedThisSession = true;
      renderTemple();
    }
    showMindMessage('The thread has been set down.');
  });

  document.getElementById('mind-offload-today')?.addEventListener('click', () => {
    const text = document.getElementById('mind-offload-input')?.value?.trim() || '';
    if (!text) { showMindMessage('Nothing to place.'); return; }
    const intentions = state.today?.intentions || [];
    if (intentions.some(i => i.text === text)) {
      showMindMessage('Already placed in Today.');
      return;
    }
    const result = addTodayIntention(text);
    if (result.ok) {
      clearMindOffload();
      const inputEl = document.getElementById('mind-offload-input');
      if (inputEl) inputEl.value = '';
      _mindArrivedThisSession = true;
      renderTemple();
      renderTodayPlan();
      showMindMessage('Placed in Today.');
    } else if (result.reason === 'full') {
      showMindMessage('Today is already holding three.');
    } else {
      showMindMessage('Nothing to place.');
    }
  });

  document.getElementById('mind-offload-clear')?.addEventListener('click', () => {
    clearMindOffload();
    const inputEl = document.getElementById('mind-offload-input');
    if (inputEl) inputEl.value = '';
    showMindMessage('Cleared.');
  });
}


function renderBodyHorizonMarks() {
  const marksEl = document.getElementById('body-marks');
  if (!marksEl) return;
  marksEl.querySelectorAll('.body-arrival-mark').forEach(el => el.remove());

  const yd = new Date();
  yd.setDate(yd.getDate() - 1);
  const yesterdayStr = ymd(yd);

  const appendMark = (arrival, linger = false) => {
    if (!arrival || typeof arrival.at !== 'string') return;
    const [wh, wm] = arrival.at.split(':').map(Number);
    if (!Number.isFinite(wh) || !Number.isFinite(wm)) return;
    const pct = ((wh * 60 + wm) / 1440 * 100).toFixed(1);
    const mark = document.createElement('div');
    mark.className = linger ? 'body-arrival-mark is-linger' : 'body-arrival-mark';
    mark.style.left = `${pct}%`;
    marksEl.appendChild(mark);
  };

  getBodyArrivals(yesterdayStr).forEach(arrival => appendMark(arrival, true));
  getBodyArrivals(todayStr).forEach(arrival => appendMark(arrival, false));
}

export function openBodyModal() {
  _bodyArrivedThisSession = false;
  _bodySelectedArea = null;
  document.querySelectorAll('#body-area-chips .body-area-chip')
    .forEach(c => c.classList.remove('is-selected'));
  const reliefEl = document.getElementById('body-relief-text');
  if (reliefEl) reliefEl.textContent = '';
  const arriveBtn = document.getElementById('body-arrive-btn');
  if (arriveBtn) arriveBtn.hidden = true;
  renderBodyHorizonMarks();
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
  document.getElementById('body-area-chips')?.addEventListener('click', e => {
    const chip = e.target.closest('.body-area-chip');
    if (!chip) return;
    const area = chip.dataset.area;
    document.querySelectorAll('.body-area-chip').forEach(c => c.classList.remove('is-selected'));
    chip.classList.add('is-selected');
    _bodySelectedArea = area;
    const reliefEl = document.getElementById('body-relief-text');
    if (reliefEl) reliefEl.textContent = BODY_RELIEF_AREAS[area] || '';
    const arriveBtn = document.getElementById('body-arrive-btn');
    if (arriveBtn) arriveBtn.hidden = false;
  });
  document.getElementById('body-arrive-btn')?.addEventListener('click', () => {
    arriveBody(todayStr);
    _bodyArrivedThisSession = true;
    saveState();
    renderTemple();
    renderBodyHorizonMarks();
    const reliefEl = document.getElementById('body-relief-text');
    if (reliefEl) reliefEl.textContent = 'The body has returned.';
    const btn = document.getElementById('body-arrive-btn');
    if (btn) btn.hidden = true;
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
