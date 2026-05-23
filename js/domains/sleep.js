import { state, todayStr } from '../state.js';
import { isValidReminderTime, isYmd, getPeriodKey } from '../utils.js';

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

export function isClosedForToday(dateStr = todayStr) {
  return Boolean(getSleepEntry(dateStr));
}

export function reopenSleepClosure(dateStr = todayStr) {
  if (!isYmd(dateStr)) return false;
  ensureSleepState();
  delete state.sleep.entries[dateStr];
  return true;
}

export function getSleepNoteEntries() {
  const entries = state.sleep?.entries || {};
  const out = [];
  for (const [dateStr, entry] of Object.entries(entries)) {
    if (!isYmd(dateStr)) continue;
    const body = typeof entry?.note === 'string' ? entry.note.trim() : '';
    if (!body) continue;
    out.push({ dateStr, body, period: entry.period });
  }
  return out;
}

export function saveSleepClosure(dateStr, noteText) {
  if (!isYmd(dateStr)) return false;
  ensureSleepState();
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const entry = { bedtime: `${hh}:${mm}`, period: getPeriodKey(now.getHours()) };
  if (noteText) entry.note = noteText.trim().slice(0, 500);
  state.sleep.entries[dateStr] = entry;
  return true;
}
