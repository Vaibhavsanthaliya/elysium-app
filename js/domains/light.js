import { state, saveState } from '../state.js';
import { getDayOfYear } from '../utils.js';
import { LIGHT_OPENING_INVITATIONS } from '../constants.js';

// Returns the most recent witness time string ("HH:MM") for the given date, or null.
export function getLastWitness(dateStr) {
  const witnesses = state.light?.entries?.[dateStr]?.witnesses;
  if (!Array.isArray(witnesses) || witnesses.length === 0) return null;
  return witnesses[witnesses.length - 1];
}

export function getLightOpeningInvitation() {
  const now = new Date();
  return LIGHT_OPENING_INVITATIONS[getDayOfYear(now) % LIGHT_OPENING_INVITATIONS.length];
}

const _VALID_DAYLIGHT = new Set(['inside', 'some', 'strong']);

export function saveDaylight(dateStr, level) {
  if (!state.light) state.light = { entries: {} };
  if (!state.light.entries) state.light.entries = {};
  if (!state.light.entries[dateStr]) state.light.entries[dateStr] = { witnesses: [] };
  const entry = state.light.entries[dateStr];
  if (_VALID_DAYLIGHT.has(level)) {
    entry.daylight = level;
  } else {
    delete entry.daylight;
  }
  saveState();
}

export function getDaylight(dateStr) {
  const d = state.light?.entries?.[dateStr]?.daylight;
  return _VALID_DAYLIGHT.has(d) ? d : null;
}

export function witnessLight(dateStr) {
  if (!state.light) state.light = { entries: {} };
  if (!state.light.entries) state.light.entries = {};
  if (!state.light.entries[dateStr]) state.light.entries[dateStr] = { witnesses: [] };
  const entry = state.light.entries[dateStr];
  if (!Array.isArray(entry.witnesses)) entry.witnesses = [];
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const timeStr = `${hh}:${mm}`;
  // Deduplicate: only push if this minute hasn't been recorded yet
  if (entry.witnesses[entry.witnesses.length - 1] !== timeStr) {
    entry.witnesses.push(timeStr);
  }
}
