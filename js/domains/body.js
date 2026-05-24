import { state, todayStr } from '../state.js';
import { getPeriodKey } from '../utils.js';
import { BODY_RITUALS } from '../constants.js';

function ensureBodyState() {
  if (!state.body || typeof state.body !== 'object' || Array.isArray(state.body)) {
    state.body = { arrivals: {} };
  }
  if (!state.body.arrivals || typeof state.body.arrivals !== 'object' || Array.isArray(state.body.arrivals)) {
    state.body.arrivals = {};
  }
}

export function arriveBody(dateStr) {
  ensureBodyState();
  if (!state.body.arrivals[dateStr]) state.body.arrivals[dateStr] = [];
  const arr = state.body.arrivals[dateStr];
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const at = `${hh}:${mm}`;
  const period = getPeriodKey(now.getHours());
  if (!arr.some(e => e.at === at)) {
    arr.push({ at, period });
  }
}

export function getBodyArrivals(dateStr) {
  return state.body?.arrivals?.[dateStr] || [];
}

export function hasArrivedToday(dateStr = todayStr) {
  return getBodyArrivals(dateStr).length > 0;
}

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

export function getBodyRitual() {
  const now = new Date();
  const idx = (now.getHours() + getDayOfYear(now) * 24) % BODY_RITUALS.length;
  return BODY_RITUALS[idx];
}
