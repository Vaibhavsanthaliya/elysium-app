import { state, saveState, todayStr } from '../state.js';
import { isYmd, isValidReminderTime, getPeriodKey, uid } from '../utils.js';

function ensureMindState() {
  if (!state.mind || typeof state.mind !== 'object' || Array.isArray(state.mind)) {
    state.mind = { sessions: [], arrivals: {} };
  }
  if (!Array.isArray(state.mind.sessions)) {
    state.mind.sessions = [];
  }
  if (!state.mind.arrivals || typeof state.mind.arrivals !== 'object' || Array.isArray(state.mind.arrivals)) {
    state.mind.arrivals = {};
  }
}

export function getMostRecentSession() {
  const sessions = state.mind?.sessions;
  if (!Array.isArray(sessions) || !sessions.length) return null;
  return sessions
    .filter(s => s.completed)
    .sort((a, b) => (b.startedAt > a.startedAt ? 1 : -1))[0] || null;
}

export function getMostRecentReflectionSession() {
  const sessions = state.mind?.sessions;
  if (!Array.isArray(sessions) || !sessions.length) return null;
  return sessions
    .filter(s => s.completed && typeof s.reflection === 'string' && s.reflection.trim())
    .sort((a, b) => (b.startedAt > a.startedAt ? 1 : -1))[0] || null;
}

export function getMindReflectionEntries() {
  const sessions = state.mind?.sessions;
  if (!Array.isArray(sessions)) return [];
  const byDate = new Map();
  for (const s of sessions) {
    if (!s?.completed) continue;
    if (!isYmd(s.date)) continue;
    const body = typeof s.reflection === 'string' ? s.reflection.trim() : '';
    if (!body) continue;
    const prev = byDate.get(s.date);
    if (!prev || (s.startedAt || '') > (prev.startedAt || '')) {
      byDate.set(s.date, {
        dateStr: s.date,
        body,
        startedAt: s.startedAt,
        period: s.period,
        cycleDay: s.cycleDay,
      });
    }
  }
  return Array.from(byDate.values()).map(({ dateStr, body, period, cycleDay }) => ({
    dateStr,
    body,
    period,
    cycleDay,
  }));
}

function currentTime24(now = new Date()) {
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function getMindArrival(dateStr = todayStr) {
  ensureMindState();
  if (!isYmd(dateStr)) return null;
  const arrival = state.mind.arrivals[dateStr];
  return arrival && typeof arrival === 'object' && !Array.isArray(arrival) ? arrival : null;
}

export function hasMindArrival(dateStr = todayStr) {
  return Boolean(getMindArrival(dateStr));
}

export function saveMindReflection(dateStr = todayStr, body = '') {
  ensureMindState();
  if (!isYmd(dateStr)) return false;
  const reflection = typeof body === 'string' ? body.trim().slice(0, 500) : '';
  if (!reflection) return false;
  const now = new Date();
  state.mind.sessions.push({
    id: uid(),
    date: dateStr,
    startedAt: now.toISOString(),
    durationMinutes: 1,
    endedAt: now.toISOString(),
    completed: true,
    reflection,
    period: getPeriodKey(now.getHours()),
  });
  return true;
}

export function arriveMind(dateStr = todayStr) {
  ensureMindState();
  if (!isYmd(dateStr)) return false;

  const now = new Date();
  const at = currentTime24(now);
  if (!isValidReminderTime(at)) return false;

  if (!state.mind.arrivals[dateStr]) {
    state.mind.arrivals[dateStr] = { at, period: getPeriodKey(now.getHours()) };
  }
  return true;
}

export function getMindThread(dateStr = todayStr) {
  ensureMindState();
  const t = state.mind.thread;
  if (!t || typeof t !== 'object' || t.date !== dateStr) return null;
  return t;
}

export function saveMindThread(dateStr = todayStr, text = '') {
  ensureMindState();
  if (!isYmd(dateStr)) return false;
  const trimmed = typeof text === 'string' ? text.trim().slice(0, 500) : '';
  if (!trimmed) return false;
  state.mind.thread = {
    date: dateStr,
    text: trimmed,
    keptNearby: true,
    updatedAt: new Date().toISOString(),
  };
  return true;
}

export function clearMindThread() {
  ensureMindState();
  state.mind.thread = null;
}

export function getMindOffload(dateStr = todayStr) {
  ensureMindState();
  const t = state.mind.thread;
  if (!t || typeof t !== 'object' || t.date !== dateStr) return null;
  const text = typeof t.text === 'string' ? t.text.trim() : '';
  return text ? { text, updatedAt: t.updatedAt || null } : null;
}

export function saveMindOffload(text = '') {
  ensureMindState();
  const trimmed = typeof text === 'string' ? text.trim().slice(0, 300) : '';
  if (!trimmed) return false;
  state.mind.thread = {
    date: todayStr,
    text: trimmed,
    keptNearby: true,
    updatedAt: new Date().toISOString(),
  };
  arriveMind(todayStr);
  saveState();
  return true;
}

export function clearMindOffload() {
  ensureMindState();
  state.mind.thread = null;
  saveState();
}

