import { state, todayStr, saveState } from '../state.js';
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

const _VALID_CONDITIONS = new Set(['calmer', 'same', 'irritated']);

export function getCareRecord(dateStr) {
  return state.care?.records?.[dateStr] || {};
}

export function saveCareCheckIn(dateStr, { condition, morningNote } = {}) {
  if (!isYmd(dateStr)) return;
  if (!state.care) state.care = { records: {} };
  if (!state.care.records) state.care.records = {};
  const rec = { ...(state.care.records[dateStr] || {}) };
  if (condition !== undefined) {
    if (_VALID_CONDITIONS.has(condition)) rec.condition = condition;
    else delete rec.condition;
  }
  if (morningNote !== undefined) {
    const trimmed = String(morningNote).trim().slice(0, 300);
    if (trimmed) rec.morningNote = trimmed;
    else delete rec.morningNote;
  }
  rec.updatedAt = new Date().toISOString();
  if (rec.condition || rec.morningNote || rec.reactionNote) {
    state.care.records[dateStr] = rec;
  } else {
    delete state.care.records[dateStr];
  }
  saveState();
}

// Resurfaces the most recent previous kept night sharing the same cycle protocol
// that carries at least one user-authored Care record field. Reads existing data
// only — no derivation, no storage, no new state. (EA-174)
export function getPreviousCareRecordForCycle(dateStr, cycleDay) {
  if (!isYmd(dateStr)) return null;
  const targetCycleDay = Number(cycleDay);
  if (!Number.isInteger(targetCycleDay) || targetCycleDay < 0 || targetCycleDay > 2) return null;

  const records = state.care?.records || {};
  const logged = new Set(Array.isArray(state.loggedDays) ? state.loggedDays : []);

  const entry = Object.entries(records)
    .filter(([d, rec]) =>
      isYmd(d) &&
      d < dateStr &&
      logged.has(d) &&
      getCycleDayForDate(d) === targetCycleDay &&
      rec && (rec.condition || rec.morningNote || rec.reactionNote)
    )
    .sort((a, b) => b[0].localeCompare(a[0]))[0];

  if (!entry) return null;
  return { dateStr: entry[0], cycleDay: targetCycleDay, record: entry[1] };
}

export function saveCareReactionNote(dateStr, note) {
  if (!isYmd(dateStr)) return;
  if (!state.care) state.care = { records: {} };
  if (!state.care.records) state.care.records = {};
  const rec = { ...(state.care.records[dateStr] || {}) };
  const trimmed = typeof note === 'string' ? note.trim().slice(0, 300) : '';
  if (trimmed) rec.reactionNote = trimmed;
  else delete rec.reactionNote;
  rec.updatedAt = new Date().toISOString();
  if (rec.condition || rec.morningNote || rec.reactionNote) {
    state.care.records[dateStr] = rec;
  } else {
    delete state.care.records[dateStr];
  }
  saveState();
}
