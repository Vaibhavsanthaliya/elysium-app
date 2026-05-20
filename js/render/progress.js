import { MILESTONES, CYCLE_NAMES } from '../constants.js';
import { ymd, escapeHtml } from '../utils.js';
import { state, todayStr, today, saveState } from '../state.js';
import { getMilestoneStage } from '../state.js';
import { getDaysSinceStart, getCycleDayForDate } from '../domains/care.js';
import { getChronicleNote } from '../domains/chronicle.js';
import { renderWeeklyPhotos } from '../services/photos.js';

const CARE_CYCLE_ROMAN = ['I', 'II', 'III'];
const STAGE_TITLES = ['foundation', 'acne control', 'marks and texture', 'maintenance'];

export function renderProgress() {
  const logged = state.loggedDays.length;

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);

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
  if (meta) meta.textContent = '';

  requestAnimationFrame(() => {
    if (document.getElementById('pane-progress').classList.contains('active')) {
      renderConstellationLines();
    }
  });

  const daysSinceStart = getDaysSinceStart();
  const currentStage = getMilestoneStage(daysSinceStart);
  const stageMeta = document.getElementById('milestone-stage-meta');
  if (stageMeta) stageMeta.textContent = '';

  const ml = document.getElementById('milestone-list');
  ml.innerHTML = '';
  const stageLine = document.createElement('p');
  stageLine.className = 'stage-line';
  const stageTitle = STAGE_TITLES[currentStage] ?? MILESTONES[currentStage]?.desc?.toLowerCase() ?? 'ritual';
  stageLine.innerHTML = `<span class="stage-line-title">${escapeHtml(stageTitle)}</span>`;
  ml.appendChild(stageLine);
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
  const date = new Date(dateStr + 'T00:00:00');
  if (date > today) return;

  const cycleDay = dateStr === todayStr ? state.cycleDay : getCycleDayForDate(dateStr);
  document.getElementById('past-day-title').textContent = 'Day record';

  renderPastDayBody(dateStr, cycleDay, date);
  document.getElementById('past-day-modal').hidden = false;
}

function formatRecordDate(date) {
  const weekday = date.toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase();
  const day = date.getDate();
  const month = date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
  return `${weekday} · ${day} ${month}`;
}

function getRecordStatus(dateStr, date) {
  const hasChecks = Object.keys(state.checks[dateStr] || {}).length > 0;
  if (date > today) return { key: 'future', label: 'quiet' };
  if (state.loggedDays.includes(dateStr)) return { key: 'kept', label: 'kept' };
  if (hasChecks) return { key: 'partial', label: 'partial' };
  if (dateStr === todayStr) return { key: 'quiet', label: 'quiet' };
  return { key: 'missed', label: 'not kept' };
}

function getProtocolLabels(cycleDay) {
  const protocol = CYCLE_NAMES[cycleDay] || CYCLE_NAMES[0];
  const roman = CARE_CYCLE_ROMAN[cycleDay] || String(cycleDay + 1);
  if (protocol.toLowerCase().includes('rest')) {
    return { context: 'Rest night', summary: 'Rest night' };
  }
  return {
    context: `Night ${roman} · ${protocol}`,
    summary: `Night ${roman}`,
  };
}

function getChronicleExcerpt(dateStr) {
  const body = getChronicleNote(dateStr)?.body;
  if (!body) return '';
  const excerpt = body.replace(/\s+/g, ' ').trim();
  if (!excerpt) return '';
  return excerpt.length > 150 ? `${excerpt.slice(0, 147).trim()}...` : excerpt;
}

export function renderPastDayBody(dateStr, cycleDay, providedDate) {
  const date = providedDate || new Date(dateStr + 'T00:00:00');
  const status = getRecordStatus(dateStr, date);
  const protocol = getProtocolLabels(cycleDay);
  const chronicleExcerpt = getChronicleExcerpt(dateStr);
  const isPast = dateStr !== todayStr && date <= today;
  const isKept = status.key === 'kept';
  const body = document.getElementById('past-day-body');
  body.innerHTML = `
    <div class="past-day-record state-${status.key}">
      <p class="past-day-date-meta">${escapeHtml(formatRecordDate(date))}</p>
      <div class="past-day-memory-card">
        <p class="past-day-protocol">${escapeHtml(protocol.context)}</p>
        <p class="past-day-state-line">${escapeHtml(protocol.summary)} · <em>${escapeHtml(status.label)}</em></p>
      </div>
      ${chronicleExcerpt ? `<div class="past-day-chronicle">
        <p class="past-day-chronicle-label">Chronicle</p>
        <p class="past-day-chronicle-body">${escapeHtml(chronicleExcerpt)}</p>
      </div>` : ''}
      ${isPast ? `<div class="past-day-actions">
        <button class="past-day-mark-btn" data-action="${isKept ? 'clear' : 'mark'}">${isKept ? 'Clear record' : 'Mark as kept'}</button>
      </div>` : ''}
    </div>
  `;

  if (isPast) {
    const markBtn = body.querySelector('.past-day-mark-btn');
    if (markBtn) {
      markBtn.addEventListener('click', () => {
        if (isKept) {
          state.loggedDays = state.loggedDays.filter(d => d !== dateStr);
        } else if (!state.loggedDays.includes(dateStr)) {
          state.loggedDays.push(dateStr);
        }
        saveState();
        renderPastDayBody(dateStr, cycleDay, date);
      });
    }
  }
}

export function closePastDayModal() {
  document.getElementById('past-day-modal').hidden = true;
  if (document.getElementById('pane-progress').classList.contains('active')) renderProgress();
}

export { renderWeeklyPhotos };
