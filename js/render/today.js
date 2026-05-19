// NOTE: This module imports openEditModal/openTaskInfoModal from ui/modals.js.
// That is a render→ui import (upward in the hierarchy) and is a documented exception
// required by the current task-item event wiring pattern. Future EA to resolve via
// event delegation in main.js and removal of this cross-layer dependency.
import { TASK_INFO } from '../constants.js';
import { escapeHtml } from '../utils.js';
import { state, todayStr, saveState } from '../state.js';
import { getMorningTasks, getNightTasks, getTodayChecks } from '../domains/care.js';
import { renderTodayCycle } from './common.js';
import { getSmartFeedback, renderTemple } from './temple.js';
import { showToast } from '../ui/toast.js';
import { openEditModal, openTaskInfoModal } from '../ui/modals.js';

export function renderTaskList(section, listEl) {
  listEl.innerHTML = '';
  let tasks;
  if (section === 'night') tasks = getNightTasks();
  else if (section === 'morning') tasks = getMorningTasks();
  else tasks = state.tasks[section];
  const checks = getTodayChecks();

  if (!tasks.length) {
    listEl.innerHTML = `<li class="empty-list">No tasks. Tap ＋ to add one.</li>`;
    return;
  }

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item' + (checks[task.id] ? ' done' : '');
    const hasInfo = Boolean(TASK_INFO[task.id]);
    li.innerHTML = `
      <div class="task-check">
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="2.5 6.5 5 9 9.5 3.5"/>
        </svg>
      </div>
      <span class="task-text">${escapeHtml(task.text)}</span>
      ${hasInfo ? `<button class="task-info-btn" aria-label="Task info" data-info>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      </button>` : ''}
      <button class="task-edit-btn" aria-label="Edit task" data-edit>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
        </svg>
      </button>
    `;
    li.addEventListener('click', (e) => {
      if (e.target.closest('[data-info]')) {
        openTaskInfoModal(task.id);
      } else if (e.target.closest('[data-edit]')) {
        openEditModal(section, task);
      } else {
        toggleTask(task.id);
      }
    });
    listEl.appendChild(li);
  });
}

export function renderAllLists() {
  renderTaskList('morning', document.getElementById('list-morning'));
  renderTaskList('night', document.getElementById('list-night'));
  renderTaskList('habit', document.getElementById('list-habit'));
  renderTodayCycle();
  renderTemple();
  const comfortTag = document.getElementById('comfort-tag');
  if (comfortTag) comfortTag.hidden = !state.comfortMode;
}

export function toggleTask(taskId) {
  const checks = getTodayChecks();
  if (checks[taskId]) {
    delete checks[taskId];
  } else {
    checks[taskId] = true;
  }

  const morning = getMorningTasks();
  const morningDone = morning.length === 0 || morning.every(t => checks[t.id]);
  const nightTasks = getNightTasks();
  const nightDone = nightTasks.length === 0 || nightTasks.every(t => checks[t.id]);
  const dayComplete = morningDone && nightDone;

  if (dayComplete && !state.loggedDays.includes(todayStr)) {
    state.loggedDays.push(todayStr);
    showToast(getSmartFeedback());
  } else if (!dayComplete && state.loggedDays.includes(todayStr)) {
    state.loggedDays = state.loggedDays.filter(d => d !== todayStr);
  }

  saveState();
  renderAllLists();
}
