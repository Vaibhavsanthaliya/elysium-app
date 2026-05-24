import { state, todayStr, saveState } from '../state.js';
import { isYmd } from '../utils.js';
import { WATER_RITUALS } from '../constants.js';

export function ensureWaterState() {
  if (!state.water || typeof state.water !== 'object' || Array.isArray(state.water)) {
    state.water = { holdings: {} };
  }
  if (!state.water.holdings || typeof state.water.holdings !== 'object' || Array.isArray(state.water.holdings)) {
    state.water.holdings = {};
  }
}

export function holdWater(dateStr) {
  ensureWaterState();
  if (!isYmd(dateStr)) return null;
  if (!state.water.holdings[dateStr]) state.water.holdings[dateStr] = [];
  if (!Array.isArray(state.water.holdings[dateStr])) state.water.holdings[dateStr] = [];
  const arr = state.water.holdings[dateStr];
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const at = `${hh}:${mm}`;
  if (!arr.some(e => e.at === at)) {
    arr.push({ at });
  }
  saveState();
  return { at };
}

export function getWaterHoldings(dateStr) {
  const holdings = state.water?.holdings?.[dateStr];
  return Array.isArray(holdings) ? holdings : [];
}

export function hasHeldToday(dateStr = todayStr) {
  return getWaterHoldings(dateStr).length > 0;
}

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

export function getWaterRitual() {
  const now = new Date();
  const idx = (now.getHours() + getDayOfYear(now) * 24) % WATER_RITUALS.length;
  return WATER_RITUALS[idx];
}
