import { state, saveState, todayStr } from '../state.js';
import { uid, isYmd, daysBetween, ymd } from '../utils.js';

const MAX_INTENTIONS = 3;
const MAX_TEXT = 120;

export function normalizeTodayPlanIfNeeded() {
  const plan = state.today;
  if (plan.date === todayStr) return;

  if (plan.date !== null && isYmd(plan.date)) {
    const gap = daysBetween(plan.date, todayStr);
    if (gap === 1) {
      const unkept = plan.intentions.filter(i => !i.kept);
      const decisions = Array.isArray(plan.sleepDecisions) ? plan.sleepDecisions : [];
      if (decisions.length) {
        const passIds = new Set(decisions.filter(d => !d.carry).map(d => d.id));
        plan.carryover = unkept
          .filter(i => !passIds.has(i.id))
          .map(i => ({ id: uid(), text: i.text }));
      } else {
        plan.carryover = unkept.map(i => ({ id: uid(), text: i.text }));
      }
      plan.sleepDecisions = [];
      plan.carryoverDate = plan.date;
    } else {
      plan.carryover = [];
      plan.carryoverDate = null;
      plan.sleepDecisions = [];
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

export function updateIntention(id, text) {
  const plan = getTodayPlan();
  const intention = plan.intentions.find(i => i.id === id);
  const nextText = String(text || '').trim().slice(0, MAX_TEXT);
  if (!intention || !nextText) return false;
  intention.text = nextText;
  saveState();
  return true;
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

// decisionsMap: Map<id, 'carry'|'pass'>
// Always writes — even if empty, clears any stale decisions from a previous session.
export function saveSleepShutdownDecisions(decisionsMap) {
  const decisions = [];
  if (decisionsMap && decisionsMap.size) {
    for (const [id, action] of decisionsMap) {
      decisions.push({ id, carry: action === 'carry' });
    }
  }
  state.today.sleepDecisions = decisions;
  saveState();
}

export function getMorningSleepHandoff() {
  const yd = new Date();
  yd.setDate(yd.getDate() - 1);
  const yesterdayStr = ymd(yd);
  if (state.today.sleepHandoffDismissedFor === yesterdayStr) return null;
  const note = state.sleep?.entries?.[yesterdayStr]?.note?.trim();
  return note || null;
}

export function dismissSleepHandoff() {
  const yd = new Date();
  yd.setDate(yd.getDate() - 1);
  state.today.sleepHandoffDismissedFor = ymd(yd);
  saveState();
}
