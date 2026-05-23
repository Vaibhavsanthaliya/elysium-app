import { state, todayStr } from '../state.js';
import { isYmd, daysBetween } from '../utils.js';

export function getMorningTasks() {
  if (state.comfortMode) return state.tasks.morning.filter(t => t.comfortSafe);
  return state.tasks.morning;
}

export function getNightTasks() {
  return state.tasks.night[state.cycleDay] || [];
}

export function getTodayChecks() {
  if (!state.checks[todayStr]) state.checks[todayStr] = {};
  return state.checks[todayStr];
}

export function getDaysSinceStart() {
  const startDate = isYmd(state.startDate) ? state.startDate : todayStr;
  return Math.max(0, daysBetween(startDate, todayStr));
}

export function getCycleDayForDate(dateStr) {
  const daysAgo = daysBetween(dateStr, todayStr);
  return ((state.cycleDay - daysAgo) % 3 + 3) % 3;
}
