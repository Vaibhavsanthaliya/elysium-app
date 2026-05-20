import { state, todayStr } from '../state.js';
import { getCycleDayForDate } from './care.js';
import { isYmd } from '../utils.js';

export function getChronicleNote(dateStr) {
  return state.chronicle?.notes?.[dateStr] ?? null;
}

export function getLastChronicleNoteForCycleDay(cycleDay = state.cycleDay) {
  const notes = state.chronicle?.notes || {};
  const targetCycleDay = Number(cycleDay);
  if (!Number.isInteger(targetCycleDay) || targetCycleDay < 0 || targetCycleDay > 2) return null;

  const entry = Object.entries(notes)
    .filter(([dateStr, note]) =>
      isYmd(dateStr) &&
      dateStr < todayStr &&
      getCycleDayForDate(dateStr) === targetCycleDay &&
      typeof note?.body === 'string' &&
      note.body.trim()
    )
    .sort((a, b) => b[0].localeCompare(a[0]))[0];

  return entry ? { dateStr: entry[0], note: entry[1] } : null;
}

export function upsertChronicleNote(dateStr, body) {
  if (!state.chronicle) state.chronicle = { notes: {} };
  if (!state.chronicle.notes) state.chronicle.notes = {};
  if (body) {
    state.chronicle.notes[dateStr] = { body, updatedAt: new Date().toISOString() };
  } else {
    delete state.chronicle.notes[dateStr];
  }
}
