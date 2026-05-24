import { state, todayStr } from '../state.js';
import { uid, isYmd, getPeriodKey } from '../utils.js';
import { MIND_RITUALS } from '../constants.js';

function ensureMindState() {
  if (!state.mind || typeof state.mind !== 'object' || Array.isArray(state.mind)) {
    state.mind = { sessions: [] };
  }
  if (!Array.isArray(state.mind.sessions)) {
    state.mind.sessions = [];
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

export function getTodaySession() {
  const sessions = state.mind?.sessions;
  if (!Array.isArray(sessions)) return null;
  return sessions
    .filter(s => s.date === todayStr)
    .sort((a, b) => (b.startedAt > a.startedAt ? 1 : -1))[0] || null;
}

export function getSessionHeldMs(session, nowMs = Date.now()) {
  const startMs = Date.parse(session?.startedAt || '');
  if (!Number.isFinite(startMs)) return 0;

  if (typeof session?.endedAt === 'string') {
    const endMs = Date.parse(session.endedAt);
    return Number.isFinite(endMs) ? Math.max(0, endMs - startMs) : 0;
  }

  if (session?.completed) {
    return Math.max(0, Number(session.durationMinutes || 0) * 60000);
  }

  return Math.max(0, nowMs - startMs);
}

export function formatHeldMs(ms) {
  const minutes = Math.floor(Math.max(0, ms) / 60000);
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
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

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

export function getMindRitual() {
  const now = new Date();
  const idx = (now.getHours() + getDayOfYear(now) * 24) % MIND_RITUALS.length;
  return MIND_RITUALS[idx];
}

export function beginMindSession(durationMinutes) {
  ensureMindState();
  const session = {
    id: uid(),
    date: todayStr,
    startedAt: new Date().toISOString(),
    durationMinutes: Number(durationMinutes),
    endedAt: null,
    completed: false,
    reflection: '',
  };
  state.mind.sessions.push(session);
  return session;
}

export function endMindSession(sessionId, reflection) {
  ensureMindState();
  const session = state.mind.sessions.find(s => s.id === sessionId);
  if (!session) return false;
  if (typeof session.endedAt !== 'string') {
    session.endedAt = new Date().toISOString();
  }
  session.completed = true;
  session.reflection = typeof reflection === 'string' ? reflection.trim().slice(0, 500) : '';
  // Imprint atmospheric coordinates at completion time.
  if (session.period === undefined)   session.period   = getPeriodKey();
  if (session.cycleDay === undefined) session.cycleDay = state.cycleDay;
  return true;
}
