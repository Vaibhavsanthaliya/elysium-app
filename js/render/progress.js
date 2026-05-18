import { MILESTONES, CYCLE_NAMES } from '../constants.js';
import { ymd, escapeHtml } from '../utils.js';
import { state, todayStr, today, saveState } from '../state.js';
import { getMilestoneStage } from '../state.js';
import { getStreak, getMorningTasksForDate, getDaysSinceStart, getCycleDayForDate } from '../domains/care.js';
import { renderAllLists } from './today.js';
import { renderWeeklyPhotos } from '../services/photos.js';

const ROMAN = ['I', 'II', 'III', 'IV'];

export function renderProgress() {
  const streak = getStreak();
  const logged = state.loggedDays.length;

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const thisWeek = state.loggedDays.filter(d => new Date(d + 'T00:00:00') >= weekStart).length;

  const goalProgress = Math.min(logged, 21);

  document.getElementById('stat-streak').textContent = streak;
  document.getElementById('stat-logged').textContent = logged;
  document.getElementById('stat-week').textContent = thisWeek;
  document.getElementById('stat-goal').textContent = goalProgress;

  const cal = document.getElementById('cal-grid');
  cal.innerHTML = '';
  const calStart = new Date(weekStart);
  calStart.setDate(calStart.getDate() - 35);
  const totalDays = 42;

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(calStart);
    d.setDate(calStart.getDate() + i);
    const ds = ymd(d);
    const isLogged = state.loggedDays.includes(ds);
    const isToday = ds === todayStr;
    const isFuture = d > today;
    const isPartial = !isLogged && !isFuture && !isToday
      && Object.keys(state.checks[ds] || {}).length > 0;

    const cell = document.createElement('div');
    cell.className = 'cal-day' +
      (isLogged ? ' logged' : '') +
      (isPartial ? ' partial' : '') +
      (isToday ? ' today' : '') +
      (isFuture ? ' future' : '');
    cell.textContent = d.getDate();
    cell.title = ds;
    if (!isFuture) {
      cell.addEventListener('click', () => openPastDayModal(ds));
    }
    cal.appendChild(cell);
  }

  const meta = document.getElementById('star-field-meta');
  if (meta) meta.textContent = `${logged} RECORDED`;

  requestAnimationFrame(() => {
    if (document.getElementById('pane-progress').classList.contains('active')) {
      renderConstellationLines();
    }
  });

  const daysSinceStart = getDaysSinceStart();
  const currentStage = getMilestoneStage(daysSinceStart);
  const upgradedStage = Number.isInteger(state.milestoneStage) ? state.milestoneStage : 0;
  const stageMeta = document.getElementById('milestone-stage-meta');
  if (stageMeta) stageMeta.textContent = `${ROMAN[currentStage] ?? currentStage} OF IV`;

  const ml = document.getElementById('milestone-list');
  ml.innerHTML = '';
  MILESTONES.forEach((m, i) => {
    const done = i < currentStage;
    const active = i === currentStage;
    const routineUpdated = i > 0 && upgradedStage >= i;
    const row = document.createElement('div');
    row.className = 'milestone-row' + (done ? ' done' : active ? ' active' : '');
    row.innerHTML = `
      <div class="milestone-index">${ROMAN[i] ?? String(i + 1)}</div>
      <div class="milestone-info">
        <div class="milestone-week">${m.weeks}</div>
        <div class="milestone-desc">${m.desc}</div>
      </div>
      <div class="milestone-badges">
        ${done ? '<span class="milestone-badge">Completed</span>' : ''}
        ${active ? '<span class="milestone-badge active">Active</span>' : ''}
        ${routineUpdated ? '<span class="milestone-badge updated">Routine updated</span>' : ''}
      </div>
    `;
    ml.appendChild(row);
  });
}

function renderConstellationLines() {
  const grid = document.getElementById('cal-grid');
  if (!grid) return;
  const old = grid.querySelector('.constellation-svg');
  if (old) old.remove();

  const loggedCells = [...grid.querySelectorAll('.cal-day.logged')];
  if (loggedCells.length < 2) return;

  const gridRect = grid.getBoundingClientRect();
  if (!gridRect.width) return;

  const allCells = [...grid.querySelectorAll('.cal-day')];
  const cellUnit = allCells.length > 0
    ? allCells[0].getBoundingClientRect().width
    : gridRect.width / 7;
  // 1.9× allows H/V/diagonal immediate neighbors; blocks skip-one row/column long jumps
  const maxDist = cellUnit * 1.9;

  const points = loggedCells.map(el => {
    const r = el.getBoundingClientRect();
    return { cx: r.left - gridRect.left + r.width / 2, cy: r.top - gridRect.top + r.height / 2 };
  });

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'constellation-svg');
  svg.setAttribute('width', gridRect.width);
  svg.setAttribute('height', gridRect.height);

  // All-pairs: connect any two logged nodes within the distance threshold.
  // Produces genuine constellation clusters rather than a simple date-order chain.
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[j].cx - points[i].cx;
      const dy = points[j].cy - points[i].cy;
      if (Math.sqrt(dx * dx + dy * dy) > maxDist) continue;
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', points[i].cx);
      line.setAttribute('y1', points[i].cy);
      line.setAttribute('x2', points[j].cx);
      line.setAttribute('y2', points[j].cy);
      svg.appendChild(line);
    }
  }
  grid.appendChild(svg);
}

export function openPastDayModal(dateStr) {
  const isToday = dateStr === todayStr;
  const date = new Date(dateStr + 'T00:00:00');
  const cycleDay = isToday ? state.cycleDay : getCycleDayForDate(dateStr);

  document.getElementById('past-day-title').textContent = isToday
    ? 'Today'
    : date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  renderPastDayBody(dateStr, cycleDay);
  document.getElementById('past-day-modal').hidden = false;
}

export function renderPastDayBody(dateStr, cycleDay) {
  const checks = state.checks[dateStr] || {};
  const sections = [
    { label: 'Morning', tasks: getMorningTasksForDate(dateStr) },
    { label: `Night · ${CYCLE_NAMES[cycleDay]}`, tasks: state.tasks.night[cycleDay] || [] },
    { label: 'Habits', tasks: state.tasks.habit },
  ];

  const body = document.getElementById('past-day-body');
  body.innerHTML = sections.map(({ label, tasks }) => {
    if (!tasks.length) return '';
    const items = tasks.map(task => {
      const done = checks[task.id] === true;
      return `<li class="task-item ${done ? 'done' : ''}" data-id="${escapeHtml(task.id)}">
        <div class="task-check">
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="2.5 6.5 5 9 9.5 3.5"/></svg>
        </div>
        <span class="task-text">${escapeHtml(task.text)}</span>
      </li>`;
    }).join('');
    return `<div class="past-day-section">
      <p class="past-day-section-label">${label}</p>
      <ul class="task-list">${items}</ul>
    </div>`;
  }).join('');

  body.querySelectorAll('.task-item').forEach(li => {
    li.addEventListener('click', () => togglePastDayTask(dateStr, li.dataset.id, cycleDay));
  });
}

export function togglePastDayTask(dateStr, taskId, cycleDay) {
  if (!state.checks[dateStr]) state.checks[dateStr] = {};
  const checks = state.checks[dateStr];
  if (checks[taskId]) { delete checks[taskId]; } else { checks[taskId] = true; }

  const morningTasks = getMorningTasksForDate(dateStr);
  const morningDone = morningTasks.length === 0 || morningTasks.every(t => checks[t.id]);
  const nightTasks = state.tasks.night[cycleDay] || [];
  const nightDone = nightTasks.length === 0 || nightTasks.every(t => checks[t.id]);
  const dayComplete = morningDone && nightDone;

  if (dayComplete && !state.loggedDays.includes(dateStr)) {
    state.loggedDays.push(dateStr);
  } else if (!dayComplete && state.loggedDays.includes(dateStr)) {
    state.loggedDays = state.loggedDays.filter(d => d !== dateStr);
  }

  saveState();
  renderPastDayBody(dateStr, cycleDay);
  if (dateStr === todayStr) {
    renderAllLists();
    document.getElementById('streak-num').textContent = getStreak();
  }
}

export function closePastDayModal() {
  document.getElementById('past-day-modal').hidden = true;
  document.getElementById('streak-num').textContent = getStreak();
  if (document.getElementById('pane-progress').classList.contains('active')) renderProgress();
}

export { renderWeeklyPhotos };
