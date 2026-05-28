import { state, saveState, todayStr } from '../state.js';
import { uid, isYmd, daysBetween } from '../utils.js';

const MAX_INTENTIONS = 3;
const MAX_TEXT = 120;

export function normalizeTodayPlanIfNeeded() {
  const plan = state.today;
  if (plan.date === todayStr) return;

  if (plan.date !== null && isYmd(plan.date)) {
    const gap = daysBetween(plan.date, todayStr);
    if (gap === 1) {
      const unkept = plan.intentions.filter(i => !i.kept);
      plan.carryover = unkept.map(i => ({ id: uid(), text: i.text }));
      plan.carryoverDate = plan.date;
    } else {
      plan.carryover = [];
      plan.carryoverDate = null;
    }
  } else {
    plan.carryover = [];
    plan.carryoverDate = null;
  }

  plan.date = todayStr;
  plan.intentions = [];
  saveState();
}

export function getTodayPlan() {
  return state.today;
}

export function addTodayIntention(text) {
  const trimmed = text.trim().slice(0, MAX_TEXT);
  if (!trimmed) return { ok: false, reason: 'empty' };
  if (state.today.intentions.length >= MAX_INTENTIONS) return { ok: false, reason: 'full' };
  const intention = { id: uid(), text: trimmed, kept: false, addedAt: new Date().toISOString() };
  state.today.intentions.push(intention);
  state.today.date = todayStr;
  saveState();
  return { ok: true, intention };
}

export function toggleTodayIntention(id) {
  const item = state.today.intentions.find(i => i.id === id);
  if (!item) return;
  item.kept = !item.kept;
  saveState();
}

export function deleteIntention(id) {
  state.today.intentions = state.today.intentions.filter(i => i.id !== id);
  saveState();
}

export function getCarryoverCandidates() {
  const plan = state.today;
  if (!plan.carryover.length || !plan.carryoverDate) return [];
  return plan.carryover.map(i => ({ ...i, date: plan.carryoverDate }));
}

export function bringForwardIntention(id) {
  const plan = state.today;
  const item = plan.carryover.find(i => i.id === id);
  if (!item) return;
  if (plan.intentions.length >= MAX_INTENTIONS) return;
  plan.intentions.push({
    id: uid(),
    text: item.text,
    kept: false,
    addedAt: new Date().toISOString(),
    carriedFrom: plan.carryoverDate,
  });
  plan.carryover = plan.carryover.filter(i => i.id !== id);
  if (!plan.carryover.length) plan.carryoverDate = null;
  plan.date = todayStr;
  saveState();
}

export function letIntentionPass(id) {
  const plan = state.today;
  plan.carryover = plan.carryover.filter(i => i.id !== id);
  if (!plan.carryover.length) plan.carryoverDate = null;
  saveState();
}
