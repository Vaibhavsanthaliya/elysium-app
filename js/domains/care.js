import { state, todayStr, today } from '../state.js';
import { isYmd, ymd, daysBetween } from '../utils.js';

export function getMorningTasks() {
  if (state.comfortMode) return state.tasks.morning.filter(t => t.comfortSafe);
  return state.tasks.morning;
}

export function getNightTasks() {
  return state.tasks.night[state.cycleDay] || [];
}

export function getMorningTasksForDate(dateStr) {
  return dateStr === todayStr ? getMorningTasks() : state.tasks.morning;
}

export function getAllTodayTasks() {
  return [
    ...getMorningTasks(),
    ...getNightTasks(),
    ...state.tasks.habit,
  ];
}

export function getTodayChecks() {
  if (!state.checks[todayStr]) state.checks[todayStr] = {};
  return state.checks[todayStr];
}

export function getStreak() {
  let streak = 0;
  const d = new Date(todayStr + 'T00:00:00');
  if (!state.loggedDays.includes(todayStr)) {
    d.setDate(d.getDate() - 1);
  }
  while (true) {
    const s = ymd(d);
    if (state.loggedDays.includes(s)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

export function getMissedDays() {
  let missed = 0;
  const d = new Date(todayStr + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  for (let i = 0; i < 7; i++) {
    if (!state.loggedDays.includes(ymd(d))) { missed++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return missed;
}

export function getDaysSinceStart() {
  const startDate = isYmd(state.startDate) ? state.startDate : todayStr;
  return Math.max(0, daysBetween(startDate, todayStr));
}

export function getCycleDayForDate(dateStr) {
  const daysAgo = daysBetween(dateStr, todayStr);
  return ((state.cycleDay - daysAgo) % 3 + 3) % 3;
}
