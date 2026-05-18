import { state, todayStr } from '../state.js';
import { getAllTodayTasks, getTodayChecks, getStreak, getMissedDays } from '../domains/care.js';

// Returns a one-line status string for the Care ring hero area and Temple featured card.
// Lives here because Temple is the primary consumer; Today's ring imports it for consistency.
export function getSmartFeedback(pct) {
  const streak = getStreak();
  const missed = getMissedDays();

  if (pct === 100) return 'Ritual complete.';

  if (streak >= 21) return 'Twenty-one days. This is a habit now.';
  if (streak >= 14) return 'Two weeks straight. Your skin is noticing.';
  if (streak >= 10) return 'Consistency is forming. Don\'t break it.';
  if (streak >= 7)  return 'One week streak. Real results start here.';
  if (streak >= 5)  return 'You\'re doing better than most. Keep going.';
  if (streak >= 3)  return 'Three days in. Momentum is building.';

  if (missed >= 3) return 'A few days off. Start fresh with the basics.';
  if (missed >= 2) return 'You slipped. Return to the basics.';
  if (missed === 1 && pct > 0) return 'Back at it — good.';
  if (missed === 1) return 'Yesterday was a miss. Start now.';

  if (pct >= 67) return 'Almost there';
  if (pct >= 34) return 'Halfway through';
  if (pct > 0)   return 'Off to a good start';
  if (streak === 1) return 'Day one. Show up again tomorrow.';

  return 'Begin the ritual.';
}

export function renderTemple() {
  const all = getAllTodayTasks();
  const checks = getTodayChecks();
  const done = all.filter(t => checks[t.id]).length;
  const pct = all.length ? Math.round(done / all.length * 100) : 0;

  const arc = document.getElementById('temple-ring-fg');
  const circumference = 69.12;
  arc.style.strokeDashoffset = circumference - (circumference * pct / 100);
  document.getElementById('temple-ring-pct').textContent = pct;

  document.getElementById('temple-status').textContent = getSmartFeedback(pct);

  const blurbs = ['Niacinamide tonight.', 'Salicylic acid tonight.', 'Rest night.'];
  document.getElementById('temple-hero-cycle').textContent = blurbs[state.cycleDay];

  const hasNote = !!(state.chronicle?.notes?.[todayStr]?.body);
  document.getElementById('temple-chronicle-state').textContent = hasNote ? 'Written' : 'Quiet';
}
