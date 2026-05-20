import { state } from '../state.js';

const LIGHT_PERIOD_LABELS = [
  { start: 0,  end: 4,  label: 'Night' },
  { start: 4,  end: 6,  label: 'First light' },
  { start: 6,  end: 10, label: 'Morning' },
  { start: 10, end: 15, label: 'Midday' },
  { start: 15, end: 18, label: 'Afternoon' },
  { start: 18, end: 20, label: 'Golden hour' },
  { start: 20, end: 22, label: 'Dusk' },
  { start: 22, end: 24, label: 'Night' },
];

export function getLightPeriodLabel(h) {
  const p = LIGHT_PERIOD_LABELS.find(p => h >= p.start && h < p.end);
  return p ? p.label : 'Night';
}

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
