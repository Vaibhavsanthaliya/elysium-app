import { STORAGE_KEY, DEFAULT_DATA } from './constants.js';
import { deepClone, ymd, isYmd, daysBetween, isValidReminderTime, uid } from './utils.js';
import { showToast } from './ui/toast.js';

export let state;
export let today;
export let todayStr;

// Injected by main.js to break the state → sync circular dependency.
// saveState() triggers this callback after writing localStorage.
let _syncCallback = null;
export function registerSyncCallback(fn) { _syncCallback = fn; }

// Used by sync.js when it replaces state wholesale after a cloud sync.
export function setState(newState) { state = newState; }

// Wraps the module-level initialization that ran at script parse time in the monolith.
// Must be the first call in main.js DOMContentLoaded before any renders.
export function initState() {
  state = loadState();
  today = new Date();
  todayStr = ymd(today);
  if (!state.startDate) {
    state.startDate = todayStr;
    saveState();
  }
  advanceCycleIfNeeded();
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return deepClone(DEFAULT_DATA);
    const parsed = JSON.parse(raw);
    return migrateState(mergeDefaults(parsed, DEFAULT_DATA));
  } catch {
    return deepClone(DEFAULT_DATA);
  }
}

export function mergeDefaults(obj, defaults) {
  if (typeof defaults !== 'object' || defaults === null) return obj ?? defaults;
  if (Array.isArray(defaults)) return Array.isArray(obj) ? obj : deepClone(defaults);
  const out = { ...defaults, ...(obj || {}) };
  for (const k of Object.keys(defaults)) {
    if (typeof defaults[k] === 'object' && defaults[k] !== null && !Array.isArray(defaults[k])) {
      out[k] = mergeDefaults(obj?.[k], defaults[k]);
    }
  }
  return out;
}

export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    _syncCallback?.();
  } catch (e) {
    showToast('Could not save data');
  }
}

export function migrateState(s) {
  s.tasks = s.tasks && typeof s.tasks === 'object' && !Array.isArray(s.tasks) ? s.tasks : deepClone(DEFAULT_DATA.tasks);
  s.tasks.morning = Array.isArray(s.tasks.morning) ? s.tasks.morning : deepClone(DEFAULT_DATA.tasks.morning);
  s.tasks.habit = Array.isArray(s.tasks.habit) ? s.tasks.habit : deepClone(DEFAULT_DATA.tasks.habit);
  s.tasks.night = s.tasks.night && typeof s.tasks.night === 'object' ? s.tasks.night : {};
  for (let i = 0; i < 3; i++) {
    s.tasks.night[i] = Array.isArray(s.tasks.night[i]) ? s.tasks.night[i] : deepClone(DEFAULT_DATA.tasks.night[i]);
  }

  s.cycleDay = Number(s.cycleDay);
  s.cycleDay = Number.isInteger(s.cycleDay) && s.cycleDay >= 0 && s.cycleDay <= 2 ? s.cycleDay : 0;
  s.milestoneStage = Number(s.milestoneStage);
  s.milestoneStage = Number.isInteger(s.milestoneStage) && s.milestoneStage >= 0 && s.milestoneStage <= 3 ? s.milestoneStage : 0;
  s.startDate = isYmd(s.startDate) ? s.startDate : null;
  s.lastCycleDate = isYmd(s.lastCycleDate) ? s.lastCycleDate : null;
  s.loggedDays = Array.isArray(s.loggedDays) ? Array.from(new Set(s.loggedDays.filter(isYmd))) : [];
  s.checks = s.checks && typeof s.checks === 'object' && !Array.isArray(s.checks) ? s.checks : {};
  s.checks = Object.fromEntries(Object.entries(s.checks)
    .filter(([date, checks]) => isYmd(date) && checks && typeof checks === 'object' && !Array.isArray(checks))
    .map(([date, checks]) => [date, Object.fromEntries(Object.entries(checks).filter(([, v]) => v === true))]));
  s.weeklyPhotos = Array.isArray(s.weeklyPhotos)
    ? s.weeklyPhotos
      .filter(p => p && typeof p.id === 'string' && p.id && isYmd(p.date))
      .map((p, i) => ({ id: p.id, date: p.date, label: typeof p.label === 'string' && p.label.trim() ? p.label.trim() : `Week ${i + 1}` }))
    : [];
  s.reminders = s.reminders && typeof s.reminders === 'object' && !Array.isArray(s.reminders) ? s.reminders : deepClone(DEFAULT_DATA.reminders);
  s.reminders.morningTime = isValidReminderTime(s.reminders.morningTime) ? s.reminders.morningTime : DEFAULT_DATA.reminders.morningTime;
  s.reminders.nightTime = isValidReminderTime(s.reminders.nightTime) ? s.reminders.nightTime : DEFAULT_DATA.reminders.nightTime;
  s.reminders.checkInTime = isValidReminderTime(s.reminders.checkInTime) ? s.reminders.checkInTime : DEFAULT_DATA.reminders.checkInTime;
  s.reminders.enabled = Boolean(s.reminders.enabled);

  const comfortSafeIds = ['m1', 'm2'];
  s.tasks.habit = s.tasks.habit
    .filter(t => t && typeof t.text === 'string' && t.text.trim())
    .map(t => ({ ...t, id: typeof t.id === 'string' && t.id ? t.id : uid(), text: t.text.trim() }));
  for (let i = 0; i < 3; i++) {
    s.tasks.night[i] = s.tasks.night[i]
      .filter(t => t && typeof t.text === 'string' && t.text.trim())
      .map(t => ({ ...t, id: typeof t.id === 'string' && t.id ? t.id : uid(), text: t.text.trim() }));
  }
  if (Array.isArray(s.tasks?.morning)) {
    s.tasks.morning = s.tasks.morning.filter(t => t && typeof t.text === 'string' && t.text.trim()).map(t => ({
      ...t,
      id: typeof t.id === 'string' && t.id ? t.id : uid(),
      text: t.text.trim(),
      comfortSafe: comfortSafeIds.includes(t.id) ? true : (t.comfortSafe ?? false),
    }));
  }
  s.chronicle = s.chronicle && typeof s.chronicle === 'object' && !Array.isArray(s.chronicle)
    ? s.chronicle : {};
  s.chronicle.notes = s.chronicle.notes && typeof s.chronicle.notes === 'object' && !Array.isArray(s.chronicle.notes)
    ? s.chronicle.notes : {};
  const _VALID_PERIODS = new Set(['night','first-light','morning','midday','afternoon','golden-hour','dusk']);
  for (const n of Object.values(s.chronicle.notes)) {
    if (!n || typeof n !== 'object') continue;
    if (n.period !== undefined && (typeof n.period !== 'string' || !_VALID_PERIODS.has(n.period))) delete n.period;
    if (n.cycleDay !== undefined && ![0,1,2].includes(n.cycleDay)) delete n.cycleDay;
  }
  s.light = s.light && typeof s.light === 'object' && !Array.isArray(s.light)
    ? s.light : {};
  s.light.entries = s.light.entries && typeof s.light.entries === 'object' && !Array.isArray(s.light.entries)
    ? s.light.entries : {};
  // Migrate old { witnessedAt } entries to { witnesses: [] } and validate each entry.
  for (const date of Object.keys(s.light.entries)) {
    if (!isYmd(date)) { delete s.light.entries[date]; continue; }
    const entry = s.light.entries[date];
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      s.light.entries[date] = { witnesses: [] };
      continue;
    }
    if (typeof entry.witnessedAt === 'string' && !Array.isArray(entry.witnesses)) {
      entry.witnesses = [entry.witnessedAt];
      delete entry.witnessedAt;
    }
    if (!Array.isArray(entry.witnesses)) entry.witnesses = [];
    entry.witnesses = entry.witnesses.filter(t => typeof t === 'string' && /^\d{2}:\d{2}$/.test(t));
  }
  s.sleep = s.sleep && typeof s.sleep === 'object' && !Array.isArray(s.sleep)
    ? s.sleep : {};
  s.sleep.entries = s.sleep.entries && typeof s.sleep.entries === 'object' && !Array.isArray(s.sleep.entries)
    ? s.sleep.entries : {};
  s.sleep.entries = Object.fromEntries(Object.entries(s.sleep.entries)
    .filter(([date, entry]) =>
      isYmd(date) &&
      entry &&
      typeof entry === 'object' &&
      !Array.isArray(entry) &&
      (entry.closed === true || isValidReminderTime(entry.bedtime))
    )
    .map(([date, entry]) => {
      const cleanEntry = {};
      if (entry.closed === true) cleanEntry.closed = true;
      if (isValidReminderTime(entry.bedtime)) cleanEntry.bedtime = entry.bedtime;
      if (!cleanEntry.closed && !cleanEntry.bedtime) cleanEntry.closed = true;
      if (typeof entry.note === 'string' && entry.note.trim()) {
        cleanEntry.note = entry.note.trim().slice(0, 500);
      }
      if (typeof entry.period === 'string' && _VALID_PERIODS.has(entry.period)) {
        cleanEntry.period = entry.period;
      }
      return [date, cleanEntry];
    }));
  s.mind = s.mind && typeof s.mind === 'object' && !Array.isArray(s.mind)
    ? s.mind : {};
  const _todayStr = ymd(new Date());
  s.mind.sessions = Array.isArray(s.mind.sessions)
    ? s.mind.sessions.filter(sess =>
        sess &&
        typeof sess === 'object' &&
        typeof sess.id === 'string' && sess.id &&
        isYmd(sess.date) &&
        typeof sess.durationMinutes === 'number' && sess.durationMinutes > 0 &&
        typeof sess.completed === 'boolean'
      ).filter(sess => sess.completed || sess.date === _todayStr)
      .map(sess => {
        const out = {
          id: sess.id,
          date: sess.date,
          startedAt: typeof sess.startedAt === 'string' ? sess.startedAt : new Date().toISOString(),
          durationMinutes: sess.durationMinutes,
          endedAt: typeof sess.endedAt === 'string' ? sess.endedAt : null,
          completed: sess.completed,
          reflection: typeof sess.reflection === 'string' ? sess.reflection.trim().slice(0, 500) : '',
        };
        if (typeof sess.period === 'string' && _VALID_PERIODS.has(sess.period)) out.period = sess.period;
        if ([0, 1, 2].includes(sess.cycleDay)) out.cycleDay = sess.cycleDay;
        return out;
      })
    : [];
  s.mind.arrivals = s.mind.arrivals && typeof s.mind.arrivals === 'object' && !Array.isArray(s.mind.arrivals)
    ? s.mind.arrivals : {};
  for (const date of Object.keys(s.mind.arrivals)) {
    if (!isYmd(date)) { delete s.mind.arrivals[date]; continue; }
    const raw = s.mind.arrivals[date];
    const arr = Array.isArray(raw) ? raw : [raw];
    const seen = new Set();
    const clean = arr
      .filter(e => {
        if (!e || typeof e !== 'object' || Array.isArray(e)) return false;
        if (!isValidReminderTime(e.at)) return false;
        if (e.period !== undefined && (typeof e.period !== 'string' || !_VALID_PERIODS.has(e.period))) return false;
        if (seen.has(e.at)) return false;
        seen.add(e.at);
        return true;
      })
      .map(e => {
        const out = { at: e.at };
        if (typeof e.period === 'string') out.period = e.period;
        return out;
      });
    if (clean.length) s.mind.arrivals[date] = clean[0];
    else delete s.mind.arrivals[date];
  }
  s.body = s.body && typeof s.body === 'object' && !Array.isArray(s.body)
    ? s.body : {};
  s.body.arrivals = s.body.arrivals && typeof s.body.arrivals === 'object' && !Array.isArray(s.body.arrivals)
    ? s.body.arrivals : {};
  for (const date of Object.keys(s.body.arrivals)) {
    if (!isYmd(date)) { delete s.body.arrivals[date]; continue; }
    const arr = s.body.arrivals[date];
    if (!Array.isArray(arr)) { s.body.arrivals[date] = []; continue; }
    s.body.arrivals[date] = arr.filter(e =>
      e && typeof e === 'object' &&
      typeof e.at === 'string' && /^\d{2}:\d{2}$/.test(e.at) &&
      (e.period === undefined || _VALID_PERIODS.has(e.period))
    );
  }
  s.water = s.water && typeof s.water === 'object' && !Array.isArray(s.water)
    ? s.water : {};
  s.water.holdings = s.water.holdings && typeof s.water.holdings === 'object' && !Array.isArray(s.water.holdings)
    ? s.water.holdings : {};
  for (const date of Object.keys(s.water.holdings)) {
    if (!isYmd(date)) { delete s.water.holdings[date]; continue; }
    const arr = s.water.holdings[date];
    if (!Array.isArray(arr)) { delete s.water.holdings[date]; continue; }
    const seen = new Set();
    const clean = arr
      .filter(e => {
        if (!e || typeof e !== 'object' || Array.isArray(e)) return false;
        if (Object.keys(e).some(k => k !== 'at' && k !== 'period')) return false;
        if (e.period !== undefined && (typeof e.period !== 'string' || !_VALID_PERIODS.has(e.period))) return false;
        if (!isValidReminderTime(e.at)) return false;
        if (seen.has(e.at)) return false;
        seen.add(e.at);
        return true;
      })
      .map(e => ({ at: e.at }));
    if (clean.length) s.water.holdings[date] = clean;
    else delete s.water.holdings[date];
  }

  s.today = s.today && typeof s.today === 'object' && !Array.isArray(s.today) ? s.today : {};
  s.today.date = isYmd(s.today.date) ? s.today.date : null;
  s.today.intentions = Array.isArray(s.today.intentions) ? s.today.intentions : [];
  s.today.intentions = s.today.intentions
    .filter(i => i && typeof i === 'object' &&
      typeof i.id === 'string' && i.id &&
      typeof i.text === 'string' && i.text.trim() &&
      typeof i.kept === 'boolean'
    )
    .map(i => ({
      id: i.id,
      text: i.text.trim().slice(0, 120),
      kept: i.kept,
      addedAt: typeof i.addedAt === 'string' ? i.addedAt : new Date().toISOString(),
      ...(isYmd(i.carriedFrom) ? { carriedFrom: i.carriedFrom } : {}),
    }))
    .slice(0, 3);
  s.today.carryover = Array.isArray(s.today.carryover) ? s.today.carryover : [];
  s.today.carryover = s.today.carryover
    .filter(i => i && typeof i === 'object' &&
      typeof i.id === 'string' && i.id &&
      typeof i.text === 'string' && i.text.trim()
    )
    .map(i => ({ id: uid(), text: i.text.trim().slice(0, 120) }));
  s.today.carryoverDate = isYmd(s.today.carryoverDate) ? s.today.carryoverDate : null;
  s.today.sleepDecisions = Array.isArray(s.today.sleepDecisions)
    ? s.today.sleepDecisions.filter(d =>
        d && typeof d === 'object' &&
        typeof d.id === 'string' && d.id &&
        typeof d.carry === 'boolean'
      )
    : [];
  s.today.sleepHandoffDismissedFor = isYmd(s.today.sleepHandoffDismissedFor)
    ? s.today.sleepHandoffDismissedFor
    : null;

  s.care = s.care && typeof s.care === 'object' && !Array.isArray(s.care) ? s.care : {};
  s.care.records = s.care.records && typeof s.care.records === 'object' && !Array.isArray(s.care.records)
    ? s.care.records : {};
  const _VALID_CONDITIONS = new Set(['calmer', 'same', 'irritated']);
  for (const [date, rec] of Object.entries(s.care.records)) {
    if (!isYmd(date)) { delete s.care.records[date]; continue; }
    if (!rec || typeof rec !== 'object' || Array.isArray(rec)) { delete s.care.records[date]; continue; }
    if (rec.condition !== undefined && !_VALID_CONDITIONS.has(rec.condition)) delete rec.condition;
    if (rec.morningNote !== undefined) {
      if (typeof rec.morningNote !== 'string') delete rec.morningNote;
      else { rec.morningNote = rec.morningNote.trim().slice(0, 300); if (!rec.morningNote) delete rec.morningNote; }
    }
    if (rec.reactionNote !== undefined) {
      if (typeof rec.reactionNote !== 'string') delete rec.reactionNote;
      else { rec.reactionNote = rec.reactionNote.trim().slice(0, 300); if (!rec.reactionNote) delete rec.reactionNote; }
    }
    if (rec.updatedAt !== undefined && typeof rec.updatedAt !== 'string') delete rec.updatedAt;
    if (!rec.condition && !rec.morningNote && !rec.reactionNote) delete s.care.records[date];
  }

  return s;
}

// Advance cycleDay by elapsed days since last open; call after any state load.
export function advanceCycleIfNeeded() {
  if (!state.lastCycleDate) {
    state.lastCycleDate = todayStr;
    saveState();
    return;
  }
  if (state.lastCycleDate === todayStr) return;
  const daysElapsed = daysBetween(state.lastCycleDate, todayStr);
  if (daysElapsed > 0) {
    state.cycleDay = (state.cycleDay + daysElapsed) % 3;
    state.lastCycleDate = todayStr;
    saveState();
  }
}

export function getMilestoneStage(daysSinceStart) {
  if (daysSinceStart >= 56) return 3;
  if (daysSinceStart >= 28) return 2;
  if (daysSinceStart >= 14) return 1;
  return 0;
}
