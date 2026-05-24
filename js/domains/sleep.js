import { state, todayStr } from '../state.js';
import { isValidReminderTime, isYmd, getPeriodKey } from '../utils.js';
import { SLEEP_RITUALS } from '../constants.js';

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

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

export function getSleepRitual() {
  const now = new Date();
  const idx = (now.getHours() + getDayOfYear(now) * 24) % SLEEP_RITUALS.length;
  return SLEEP_RITUALS[idx];
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
