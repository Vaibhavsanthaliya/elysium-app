import { state } from '../state.js';

export function getLightEntry(dateStr) {
  return state.light?.entries?.[dateStr] ?? null;
}

export function witnessLight(dateStr) {
  if (!state.light) state.light = { entries: {} };
  if (!state.light.entries) state.light.entries = {};
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  state.light.entries[dateStr] = { witnessedAt: `${hh}:${mm}` };
}
