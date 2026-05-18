import { state, todayStr } from '../state.js';
import { isValidReminderTime, isYmd, ymd } from '../utils.js';

function ensureSleepState() {
  if (!state.sleep || typeof state.sleep !== 'object' || Array.isArray(state.sleep)) {
    state.sleep = { entries: {} };
  }
  if (!state.sleep.entries || typeof state.sleep.entries !== 'object' || Array.isArray(state.sleep.entries)) {
    state.sleep.entries = {};
  }
}

export function getSleepEntry(dateStr = todayStr) {
  if (!isYmd(dateStr)) return null;
  const entry = state.sleep?.entries?.[dateStr];
  return entry && isValidReminderTime(entry.bedtime) ? entry : null;
}

export function getLastSleepEntry() {
  const entries = Object.entries(state.sleep?.entries || {})
    .filter(([dateStr, entry]) => isYmd(dateStr) && isValidReminderTime(entry?.bedtime))
    .sort(([a], [b]) => b.localeCompare(a));

  if (!entries.length) return null;
  const [dateStr, entry] = entries[0];
  return { dateStr, bedtime: entry.bedtime };
}

export function getRecentSleepHistory(days = 7) {
  const start = new Date(`${todayStr}T00:00:00`);
  return Array.from({ length: days }, (_, offset) => {
    const date = new Date(start);
    date.setDate(start.getDate() - offset);
    const dateStr = ymd(date);
    return {
      dateStr,
      entry: getSleepEntry(dateStr),
    };
  });
}

export function saveSleepBedtime(dateStr, bedtime) {
  if (!isYmd(dateStr) || !isValidReminderTime(bedtime)) return false;
  ensureSleepState();
  state.sleep.entries[dateStr] = { bedtime };
  return true;
}
