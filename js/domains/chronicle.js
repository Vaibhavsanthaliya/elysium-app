import { state, todayStr } from '../state.js';
import { getCycleDayForDate } from './care.js';
import { isYmd, getPeriodKey, daysBetween, ymd } from '../utils.js';

const RESURFACE_OFFSETS = [7, 14, 30];
const RESURFACE_EXCERPT_MAX = 142;

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

function ymdOffset(dateStr, offset) {
  if (!isYmd(dateStr)) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + offset);
  return ymd(date);
}

function isLivingNote(note) {
  return note && typeof note.body === 'string' && note.body.trim();
}

function excerptChronicleBody(body) {
  const normalized = String(body).replace(/\s+/g, ' ').trim();
  if (normalized.length <= RESURFACE_EXCERPT_MAX) return normalized;
  const clipped = normalized.slice(0, RESURFACE_EXCERPT_MAX + 1);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, lastSpace > 64 ? lastSpace : RESURFACE_EXCERPT_MAX).trim()}...`;
}

function getResurfaceLabel(dateStr, note, referenceDateStr) {
  const age = daysBetween(dateStr, referenceDateStr);
  if (age === 7) return 'A week ago';
  if (note?.period === 'night' || note?.period === 'dusk') return 'From a previous night';

  const [refYear, refMonth] = referenceDateStr.split('-');
  const [entryYear, entryMonth] = dateStr.split('-');
  if (refYear === entryYear && refMonth === entryMonth) return 'Earlier this month';

  return 'From before';
}

export function getResurfacedChronicleNote(referenceDateStr = todayStr) {
  if (!isYmd(referenceDateStr)) return null;
  const notes = state?.chronicle?.notes || {};

  for (const offset of RESURFACE_OFFSETS) {
    const dateStr = ymdOffset(referenceDateStr, -offset);
    const note = dateStr ? notes[dateStr] : null;
    if (isLivingNote(note)) {
      return {
        dateStr,
        label: getResurfaceLabel(dateStr, note, referenceDateStr),
        excerpt: excerptChronicleBody(note.body),
      };
    }
  }

  const nearest = Object.entries(notes)
    .filter(([dateStr, note]) =>
      isYmd(dateStr) &&
      dateStr < referenceDateStr &&
      isLivingNote(note)
    )
    .sort((a, b) => b[0].localeCompare(a[0]))[0];

  if (!nearest) return null;
  const [dateStr, note] = nearest;
  return {
    dateStr,
    label: getResurfaceLabel(dateStr, note, referenceDateStr),
    excerpt: excerptChronicleBody(note.body),
  };
}

export function upsertChronicleNote(dateStr, body) {
  if (!state.chronicle) state.chronicle = { notes: {} };
  if (!state.chronicle.notes) state.chronicle.notes = {};
  if (body) {
    const existing = state.chronicle.notes[dateStr];
    const entry = { body, updatedAt: new Date().toISOString() };
    // Imprint atmospheric coordinates at first write; preserve on subsequent saves.
    entry.period   = existing?.period   ?? getPeriodKey();
    entry.cycleDay = existing?.cycleDay ?? state.cycleDay;
    state.chronicle.notes[dateStr] = entry;
  } else {
    delete state.chronicle.notes[dateStr];
  }
}

export function getChronicleEntries() {
  const notes = state.chronicle?.notes || {};
  return Object.entries(notes)
    .filter(([dateStr, note]) =>
      isYmd(dateStr) &&
      typeof note?.body === 'string' &&
      note.body.trim()
    )
    .sort((a, b) => b[0].localeCompare(a[0]));
}

export function searchChronicleEntries(query) {
  const q = query.trim().toLowerCase();
  if (!q) return getChronicleEntries();
  return getChronicleEntries().filter(([, note]) =>
    note.body.toLowerCase().includes(q)
  );
}
