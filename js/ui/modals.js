// NOTE: renderAllLists is imported from render/today.js — this creates a safe ESM cycle
// (render/today.js imports openEditModal/openTaskInfoModal from here). Both sides only
// consume the imports inside function bodies, never at module evaluation time.
// Future EA: resolve via event delegation in main.js.
import { TASK_INFO } from '../constants.js';
import { formatTime12, isValidReminderTime, uid } from '../utils.js';
import { state, saveState, todayStr } from '../state.js';
import {
  getRecentSleepHistory,
  getSleepEntry,
  saveSleepBedtime as upsertSleepBedtime,
} from '../domains/sleep.js';
import { showToast } from './toast.js';
import { renderAllLists } from '../render/today.js';

let editContext = null; // { mode: 'add'|'edit', section, task, cycleDay }

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

function formatSleepHistoryDate(dateStr, index) {
  if (index === 0) return 'TODAY';
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
  }).toUpperCase();
}

function renderSleepHistory() {
  const historyEl = document.getElementById('sleep-history-list');
  if (!historyEl) return;

  historyEl.innerHTML = getRecentSleepHistory().map(({ dateStr, entry }, index) => `
    <div class="sleep-history-row${entry ? ' has-entry' : ''}">
      <span class="sleep-history-date">${formatSleepHistoryDate(dateStr, index)}</span>
      <span class="sleep-history-dot" aria-hidden="true"></span>
      <span class="sleep-history-time">${entry ? formatTime12(entry.bedtime) : '—'}</span>
    </div>
  `).join('');
}

export function openSleepModal() {
  const modal = document.getElementById('sleep-modal');
  const input = document.getElementById('sleep-bedtime');
  const entry = getSleepEntry(todayStr);
  input.value = entry?.bedtime || '';
  renderSleepHistory();
  modal.hidden = false;
  setTimeout(() => input.focus(), 250);
}

export function closeSleepModal() {
  document.getElementById('sleep-modal').hidden = true;
}

export function saveSleepModal() {
  const input = document.getElementById('sleep-bedtime');
  const bedtime = input.value.trim();
  if (!isValidReminderTime(bedtime)) {
    showToast('Enter a valid bedtime');
    return;
  }
  if (!upsertSleepBedtime(todayStr, bedtime)) {
    showToast('Could not save bedtime');
    return;
  }

  saveState();
  const sleepStateEl = document.getElementById('temple-sleep-state');
  if (sleepStateEl) sleepStateEl.textContent = formatTime12(bedtime);
  renderSleepHistory();
  closeSleepModal();
  showToast('Bedtime saved');
}

export function openEditModal(section, task) {
  editContext = { mode: 'edit', section, task };
  document.getElementById('modal-title').textContent = 'Edit task';
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
  document.getElementById('modal-title').textContent = 'New task';
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
  if (!text) { showToast('Task name is required'); return; }

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
    showToast('Task added');
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
    showToast('Task saved');
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

export function deleteTask() {
  if (!editContext || editContext.mode !== 'edit') return;
  if (!confirm('Delete this task?')) return;
  removeTaskById(editContext.task.id);
  saveState();
  renderAllLists();
  closeModal();
  showToast('Task deleted');
}
