import { state } from '../state.js';

export function getChronicleNote(dateStr) {
  return state.chronicle?.notes?.[dateStr] ?? null;
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
