  /* ==========================================================================
   Skin · App logic
   - Editable tasks per section
   - Cycle-aware night routine (3-day rotation)
   - Local notification reminders
   - LocalStorage persistence
   ========================================================================== */

const STORAGE_KEY = 'skincare_app_v1';
const SUPABASE_URL = 'https://rqkxxqweqijyiaktjylc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxa3h4cXdlcWlqeWlha3RqeWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2ODg4MTYsImV4cCI6MjA5MzI2NDgxNn0.okMqlpfHqGqp2OJg-4hWwg5dAVDmrIJsXrPyNNh6q7M';
const DEFAULT_DATA = {
  startDate: null,
  cycleDay: 0, // 0=niacinamide, 1=salicylic, 2=rest
  lastCycleDate: null, // tracks last date cycle was set to detect day changes
  milestoneStage: 0, // 0=foundation, 1=acne control, 2=marks/texture, 3=maintenance
  loggedDays: [],
  checks: {}, // { 'YYYY-MM-DD': { taskId: true } }
  comfortMode: false,
  tasks: {
    morning: [
      { id: 'm1', text: 'Salicylic acid face wash', comfortSafe: true },
      { id: 'm2', text: 'Re\'equil Ultra Matte SPF 50 sunscreen', comfortSafe: true },
      { id: 'm3', text: 'Wait 5–10 min, dab excess with tissue' },
    ],
    night: {
      0: [ // Day 1 — Niacinamide
        { id: 'n1', text: 'Face wash' },
        { id: 'n2', text: 'Niacinamide serum (pea-sized)' },
        { id: 'n3', text: 'Light moisturizer' },
      ],
      1: [ // Day 2 — Salicylic
        { id: 'n4', text: 'Face wash' },
        { id: 'n5', text: 'Salicylic acid serum (pea-sized)' },
        { id: 'n6', text: 'Light moisturizer' },
      ],
      2: [ // Day 3 — Rest
        { id: 'n7', text: 'Face wash' },
        { id: 'n8', text: 'Moisturizer only — rest night' },
      ],
    },
    habit: [
      { id: 'h1', text: 'Drink 2.5–3L water' },
      { id: 'h2', text: 'No face touching / pimple picking' },
      { id: 'h3', text: 'Fresh pillowcase if 2+ days old' },
    ],
  },
  reminders: {
    enabled: false,
    morningTime: '08:00',
    nightTime: '22:00',
    checkInTime: '21:00',
  },
  weeklyPhotos: [], // [{ id, date, label }] — image data lives in IndexedDB
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

const CYCLE_NAMES = ['Niacinamide', 'Salicylic', 'Rest night'];
const CYCLE_FULL_NAMES = ['Day 1 — Niacinamide', 'Day 2 — Salicylic', 'Day 3 — Rest'];
const CYCLE_DESC = [
  'Face wash → Niacinamide serum → Moisturizer',
  'Face wash → Salicylic serum → Moisturizer',
  'Face wash → Moisturizer only',
];

const MILESTONES = [
  { weeks: 'Week 1–2', desc: 'Reduced oiliness', days: 14 },
  { weeks: 'Week 3–4', desc: 'Fewer new pimples', days: 28 },
  { weeks: 'Week 6–8', desc: 'Marks begin fading', days: 56 },
  { weeks: 'Week 8–12', desc: 'Noticeably smoother skin', days: 84 },
];

const MILESTONE_UPGRADES = {
  1: [
    { section: 'habit', id: 'ms1_h_active_pimples', upgradeKey: 'ms1-active-pimples', text: 'Check active pimples before bed' },
    { section: 'habit', id: 'ms1_h_pimple_patch', upgradeKey: 'ms1-pimple-patch', text: 'Use pimple patch only on active whiteheads' },
  ],
  2: [
    { section: 'habit', id: 'ms2_h_track_marks', upgradeKey: 'ms2-track-marks', text: 'Track marks and texture weekly' },
    { section: 'morning', id: 'ms2_m_marks_treatment', upgradeKey: 'ms2-marks-treatment', text: 'Apply marks treatment only if skin is calm', requiresComfortOff: true },
  ],
  3: [
    { section: 'habit', id: 'ms3_h_review_routine', upgradeKey: 'ms3-review-routine', text: 'Review routine: keep what works, remove what irritates' },
    { section: 'habit', id: 'ms3_h_comparison_photo', upgradeKey: 'ms3-comparison-photo', text: 'Take comparison photo' },
  ],
};

const TASK_INFO = {
  m1: {
    title: 'Salicylic acid face wash',
    what: 'BHA cleanser that dissolves inside pores, removes excess oil, and keeps breakouts from forming.',
    how: 'Pea-sized amount. Lather for 30–60 seconds, then rinse fully.',
    skip: 'Your skin feels tight or dry after using it — start with once daily.',
  },
  m2: {
    title: 'SPF 50 sunscreen',
    what: 'UV rays worsen post-acne marks and slow healing. SPF is the single most impactful daytime step.',
    how: 'Two finger-lengths for face and neck. Apply last, after all other steps.',
    skip: 'Never skip it — even indoors, UV comes through windows.',
  },
  m3: {
    title: 'Wait after sunscreen',
    what: 'Chemical sunscreens need time to bind with skin before they protect you.',
    how: 'Wait 5–10 minutes before stepping out. Dab excess gently with a tissue — don\'t rub.',
    skip: 'Never skip the wait on sunny days.',
  },
  n1: {
    title: 'Face wash (evening)',
    what: 'Removes sunscreen residue, oil, and pollution from the day.',
    how: 'Use the same salicylic face wash. 30–60 seconds, then rinse.',
    skip: 'Rarely — always cleanse when you\'ve worn sunscreen.',
  },
  n2: {
    title: 'Niacinamide serum',
    what: 'Controls oil and fades post-acne marks (PIH). One of the safest actives for daily use.',
    how: 'Pea-sized amount. Press gently into skin — don\'t rub. Apply before moisturizer.',
    skip: 'If stinging persists after a week, try every other night instead.',
  },
  n3: {
    title: 'Light moisturizer',
    what: 'Keeps your skin barrier intact so actives penetrate better and irritation stays low.',
    how: 'Thin layer after serums. Light gel or lotion formulas work best with this routine.',
    skip: 'Skin is actively broken out — use the lightest formula you have.',
  },
  n4: {
    title: 'Face wash (evening)',
    what: 'Removes sunscreen residue, oil, and pollution from the day.',
    how: 'Use the same salicylic face wash. 30–60 seconds, then rinse.',
    skip: 'Rarely — always cleanse when you\'ve worn sunscreen.',
  },
  n5: {
    title: 'Salicylic acid serum',
    what: 'Exfoliates inside pores and targets active breakouts. More concentrated than the face wash.',
    how: 'Pea-sized, on affected areas or T-zone only. Not all over the face.',
    skip: 'Skin feels dry or red — skip to a rest night and come back to it.',
  },
  n6: {
    title: 'Light moisturizer',
    what: 'Keeps your skin barrier intact so actives penetrate better and irritation stays low.',
    how: 'Thin layer after serums. Light gel or lotion formulas work best with this routine.',
    skip: 'Skin is actively broken out — use the lightest formula you have.',
  },
  n7: {
    title: 'Face wash (rest night)',
    what: 'Even on rest nights, cleansing removes the day\'s buildup before it sits on skin overnight.',
    how: 'Gentle rinse, 30 seconds. No actives tonight.',
    skip: 'Rarely — only if you already washed your face within the last hour or two.',
  },
  n8: {
    title: 'Moisturizer only',
    what: 'Rest night lets your skin recover from the week\'s actives without piling on more.',
    how: 'Slightly more moisturizer than usual is fine tonight.',
    skip: 'Never — this rest is intentional. Skipping actives is the point.',
  },
  h1: {
    title: 'Water intake',
    what: 'Dehydration makes skin produce more oil to compensate, worsening breakouts.',
    how: '2.5–3L spread through the day. Starting with a large glass each morning helps.',
    skip: 'Heavy exercise or heat — drink even more.',
  },
  h2: {
    title: 'No touching or picking',
    what: 'Hands carry bacteria. Picking spreads infection and causes scarring that takes months to fade.',
    how: 'If you must touch your face, wash hands first. The urge passes — the scar doesn\'t.',
    skip: 'There is no exception here.',
  },
  h3: {
    title: 'Pillowcase hygiene',
    what: 'A used pillowcase reapplies oils, bacteria, and product residue to your face for 7–8 hours.',
    how: 'Flip after night 1, replace after night 2. A clean towel on top works too.',
    skip: 'You\'ve had a completely clean face, clean hair, and no sweating.',
  },
};

// Backfill comfortSafe on known default tasks for users who already have saved state
function migrateState(s) {
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
  return s;
}

function getMilestoneStage(daysSinceStart) {
  if (daysSinceStart >= 56) return 3;
  if (daysSinceStart >= 28) return 2;
  if (daysSinceStart >= 14) return 1;
  return 0;
}

function getDaysSinceStart() {
  const startDate = isYmd(state.startDate) ? state.startDate : todayStr;
  return Math.max(0, daysBetween(startDate, todayStr));
}

function getAllTaskGroups() {
  return [
    state.tasks.morning,
    state.tasks.habit,
    state.tasks.night?.[0] || [],
    state.tasks.night?.[1] || [],
    state.tasks.night?.[2] || [],
  ];
}

function taskExistsByKey(upgradeKey, text) {
  const normalizedText = text.trim().toLowerCase();
  return getAllTaskGroups().some(group =>
    Array.isArray(group) && group.some(task =>
      task.upgradeKey === upgradeKey || task.text?.trim().toLowerCase() === normalizedText
    )
  );
}

function applyMilestoneRoutine(stage) {
  const upgrades = MILESTONE_UPGRADES[stage] || [];
  upgrades.forEach(upgrade => {
    if (upgrade.requiresComfortOff && state.comfortMode) return;
    if (taskExistsByKey(upgrade.upgradeKey, upgrade.text)) return;

    const task = { id: upgrade.id, text: upgrade.text, upgradeKey: upgrade.upgradeKey };
    if (upgrade.section === 'morning') state.tasks.morning.push(task);
    if (upgrade.section === 'habit') state.tasks.habit.push(task);
  });
}

function updateMilestoneStage() {
  const currentStage = Number.isInteger(state.milestoneStage) ? state.milestoneStage : 0;
  const newStage = getMilestoneStage(getDaysSinceStart());
  if (newStage <= currentStage) return false;

  for (let stage = currentStage + 1; stage <= newStage; stage++) {
    applyMilestoneRoutine(stage);
  }
  state.milestoneStage = newStage;
  saveState();
  showToast(`Ritual updated for ${MILESTONES[newStage].weeks}`);
  return true;
}

// Advance cycleDay by elapsed days since last open; call after any state load
function advanceCycleIfNeeded() {
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

// =============== STATE ===============
let state = loadState();
const today = new Date();
const todayStr = ymd(today);

if (!state.startDate) {
  state.startDate = todayStr;
  saveState();
}

advanceCycleIfNeeded();

// =============== STORAGE ===============
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return deepClone(DEFAULT_DATA);
    const parsed = JSON.parse(raw);
    return migrateState(mergeDefaults(parsed, DEFAULT_DATA));
  } catch {
    return deepClone(DEFAULT_DATA);
  }
}

function mergeDefaults(obj, defaults) {
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

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    scheduleSaveToSupabase();
  } catch (e) {
    showToast('Could not save data');
  }
}

// =============== AUTH VIEW ===============
function showAuthView(view) {
  ['signin', 'signup', 'forgot', 'confirm', 'reset'].forEach(v => {
    document.getElementById(`auth-${v}`).hidden = (v !== view);
  });
  document.getElementById('auth-error').hidden = true;
}

// =============== SUPABASE ===============
let sb = null;
let sbUserId = null;
let sbSaveTimer = null;
let syncInProgress = false;

function initSupabase() {
  if (!window.supabase) {
    console.warn('Supabase unavailable — running in offline/local mode');
    return;
  }
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const authScreen = document.getElementById('auth-screen');
  authScreen.hidden = false;
  showAuthView('signin');
  let initialSessionChecked = false;

  async function applyAuthSession(event, session) {
    sbUserId = session?.user?.id ?? null;
    if (event === 'PASSWORD_RECOVERY') {
      authScreen.hidden = false;
      showAuthView('reset');
      return;
    }
    if (session) {
      authScreen.hidden = true;
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        const syncUserId = sbUserId;
        await syncFromSupabase();
        if (sbUserId !== syncUserId) return;
        updateAccountView();
      }
    } else {
      authScreen.hidden = false;
      showAuthView('signin');
    }
  }

  sb.auth.onAuthStateChange((event, session) => {
    if (!initialSessionChecked && !session && event !== 'SIGNED_OUT' && event !== 'PASSWORD_RECOVERY') return;
    applyAuthSession(event, session);
  });

  sb.auth.getSession().then(({ data: { session } }) => {
    initialSessionChecked = true;
    return applyAuthSession('INITIAL_SESSION', session);
  }).catch((e) => {
    console.warn('Supabase session check failed', e);
    initialSessionChecked = true;
    authScreen.hidden = false;
    showAuthView('signin');
  });

  // Safety net: if onAuthStateChange never fires (stale SW, CDN issue, etc.)
  // fall back to a direct session check and show sign-in if no session found
  setTimeout(async () => {
    if (initialSessionChecked) return;
    try {
      const { data: { session } } = await sb.auth.getSession();
      initialSessionChecked = true;
      await applyAuthSession('INITIAL_SESSION', session);
    } catch (e) {
      console.warn('Supabase fallback session check failed', e);
      initialSessionChecked = true;
      authScreen.hidden = false;
      showAuthView('signin');
    }
  }, 1500);
}

async function syncFromSupabase() {
  if (!sb || !sbUserId) return;
  if (syncInProgress) return;
  syncInProgress = true;
  const syncUserId = sbUserId;
  try {
    const { data, error } = await sb.from('user_data').select('data').eq('user_id', syncUserId).single();
    if (sbUserId !== syncUserId) return;
    if (error?.code === 'PGRST116') {
      // New user — push local state up as-is
      await sb.from('user_data').upsert(
        { user_id: syncUserId, data: deepClone(state), updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
      return;
    }
    if (error) throw error;
    if (data?.data) {
      const cloud = migrateState(mergeDefaults(data.data, DEFAULT_DATA));

      // Union loggedDays so no completed days are ever lost
      const mergedLoggedDays = Array.from(new Set([
        ...(Array.isArray(state.loggedDays) ? state.loggedDays : []),
        ...(Array.isArray(cloud.loggedDays) ? cloud.loggedDays : []),
      ])).filter(isYmd);

      // Deep-merge checks: keep every checked task from both local and cloud
      const mergedChecks = {};
      const allDates = new Set([
        ...Object.keys(state.checks || {}),
        ...Object.keys(cloud.checks || {}),
      ]);
      for (const date of allDates) {
        if (!isYmd(date)) continue;
        const merged = { ...(state.checks?.[date] || {}), ...(cloud.checks?.[date] || {}) };
        // Strip legacy false values so old data doesn't cause wrong toggle behaviour
        mergedChecks[date] = Object.fromEntries(Object.entries(merged).filter(([, v]) => v === true));
      }

      // Cloud is source of truth for tasks/settings; restore merged progress
      state = cloud;
      state.loggedDays = mergedLoggedDays;
      state.checks = mergedChecks;
      if (!state.startDate) state.startDate = todayStr;
      migrateState(state);
      advanceCycleIfNeeded();
      updateMilestoneStage();

      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      renderHeader();
      renderTodayCycle();
      renderAllLists();
      renderCycleList();
      if (document.getElementById('pane-progress').classList.contains('active')) renderProgress();
      if (document.getElementById('pane-settings').classList.contains('active')) updateSettingsView();
      if (state.reminders?.enabled && 'Notification' in window && Notification.permission === 'granted') {
        scheduleReminders();
      } else {
        clearScheduledReminders();
      }
    }
  } catch (e) {
    console.warn('Supabase sync failed', e);
  } finally {
    syncInProgress = false;
  }
}

async function flushToSupabase() {
  if (!sb || !sbUserId) return;
  clearTimeout(sbSaveTimer);
  const saveUserId = sbUserId;
  const dataSnapshot = deepClone(state);
  try {
    await sb.from('user_data').upsert(
      { user_id: saveUserId, data: dataSnapshot, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  } catch (e) {
    console.warn('Supabase save failed', e);
  }
}

function scheduleSaveToSupabase() {
  if (!sb || !sbUserId) return;
  clearTimeout(sbSaveTimer);
  sbSaveTimer = setTimeout(() => flushToSupabase(), 300);
}

function updateAccountView() {
  if (!sb) return;
  sb.auth.getUser().then(({ data: { user } }) => {
    const el = document.getElementById('account-email');
    if (el) el.textContent = user?.email ?? '—';
  }).catch(() => {});
}

// =============== UTILS ===============
function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isYmd(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + 'T00:00:00');
  return !Number.isNaN(parsed.getTime()) && ymd(parsed) === value;
}

function dayNumber(dateStr) {
  if (!isYmd(dateStr)) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

function daysBetween(fromDateStr, toDateStr) {
  const from = dayNumber(fromDateStr);
  const to = dayNumber(toDateStr);
  if (from === null || to === null) return 0;
  return to - from;
}

function uid() {
  return 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
}

function getTodayChecks() {
  if (!state.checks[todayStr]) state.checks[todayStr] = {};
  return state.checks[todayStr];
}

function getNightTasks() {
  return state.tasks.night[state.cycleDay] || [];
}

function getMorningTasks() {
  if (state.comfortMode) return state.tasks.morning.filter(t => t.comfortSafe);
  return state.tasks.morning;
}

function getMorningTasksForDate(dateStr) {
  return dateStr === todayStr ? getMorningTasks() : state.tasks.morning;
}

function getAllTodayTasks() {
  return [
    ...getMorningTasks(),
    ...getNightTasks(),
    ...state.tasks.habit,
  ];
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.hidden = true, 2200);
}

function formatTime12(t24) {
  if (!isValidReminderTime(t24)) return '';
  const [h, m] = t24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function isValidReminderTime(time24) {
  if (typeof time24 !== 'string' || !/^\d{2}:\d{2}$/.test(time24)) return false;
  const [h, m] = time24.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

// =============== RENDER ===============
function renderHeader() {
  const dl = document.getElementById('date-label');
  dl.textContent = today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  document.getElementById('streak-num').textContent = getStreak();
}

function renderTodayCycle() {
  document.getElementById('cycle-tag').textContent = CYCLE_NAMES[state.cycleDay];
  document.getElementById('hero-cycle').textContent = `Tonight: ${CYCLE_FULL_NAMES[state.cycleDay]}`;
}

function renderTaskList(section, listEl) {
  listEl.innerHTML = '';
  let tasks;
  if (section === 'night') tasks = getNightTasks();
  else if (section === 'morning') tasks = getMorningTasks();
  else tasks = state.tasks[section];
  const checks = getTodayChecks();

  if (!tasks.length) {
    listEl.innerHTML = `<li class="empty-list">No tasks. Tap ＋ to add one.</li>`;
    return;
  }

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item' + (checks[task.id] ? ' done' : '');
    const hasInfo = Boolean(TASK_INFO[task.id]);
    li.innerHTML = `
      <div class="task-check">
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="2.5 6.5 5 9 9.5 3.5"/>
        </svg>
      </div>
      <span class="task-text">${escapeHtml(task.text)}</span>
      ${hasInfo ? `<button class="task-info-btn" aria-label="Task info" data-info>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      </button>` : ''}
      <button class="task-edit-btn" aria-label="Edit task" data-edit>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
        </svg>
      </button>
    `;
    li.addEventListener('click', (e) => {
      if (e.target.closest('[data-info]')) {
        openTaskInfoModal(task.id);
      } else if (e.target.closest('[data-edit]')) {
        openEditModal(section, task);
      } else {
        toggleTask(task.id);
      }
    });
    listEl.appendChild(li);
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function renderAllLists() {
  renderTaskList('morning', document.getElementById('list-morning'));
  renderTaskList('night', document.getElementById('list-night'));
  renderTaskList('habit', document.getElementById('list-habit'));
  updateRing();
  const comfortTag = document.getElementById('comfort-tag');
  if (comfortTag) comfortTag.hidden = !state.comfortMode;
}

function getMissedDays() {
  let missed = 0;
  const d = new Date(todayStr + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  for (let i = 0; i < 7; i++) {
    if (!state.loggedDays.includes(ymd(d))) { missed++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return missed;
}

function getSmartFeedback(pct) {
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

function updateRing() {
  const all = getAllTodayTasks();
  const checks = getTodayChecks();
  const done = all.filter(t => checks[t.id]).length;
  const pct = all.length ? Math.round(done / all.length * 100) : 0;

  const ring = document.getElementById('ring-fg');
  const circumference = 326.7;
  ring.style.strokeDashoffset = circumference - (circumference * pct / 100);

  document.getElementById('ring-pct').textContent = pct;
  document.getElementById('hero-status').textContent = getSmartFeedback(pct);
}

function toggleTask(taskId) {
  const checks = getTodayChecks();
  if (checks[taskId]) {
    delete checks[taskId];
  } else {
    checks[taskId] = true;
  }

  // Track day completion: both sections count as done if empty
  const morning = getMorningTasks();
  const morningDone = morning.length === 0 || morning.every(t => checks[t.id]);
  const nightTasks = getNightTasks();
  const nightDone = nightTasks.length === 0 || nightTasks.every(t => checks[t.id]);
  const dayComplete = morningDone && nightDone;

  if (dayComplete && !state.loggedDays.includes(todayStr)) {
    state.loggedDays.push(todayStr);
    showToast('Day completed — streak +1');
  } else if (!dayComplete && state.loggedDays.includes(todayStr)) {
    state.loggedDays = state.loggedDays.filter(d => d !== todayStr);
  }

  saveState();
  renderAllLists();
  document.getElementById('streak-num').textContent = getStreak();
}

// =============== CYCLE ===============
function renderCycleList() {
  const list = document.getElementById('cycle-list');
  list.innerHTML = '';
  CYCLE_FULL_NAMES.forEach((name, i) => {
    const card = document.createElement('div');
    card.className = 'cycle-card' + (i === state.cycleDay ? ' active' : '');
    card.innerHTML = `
      <div class="cycle-card-top">
        <span class="cycle-day-label">Cycle day ${i + 1}</span>
        ${i === state.cycleDay ? '<span class="cycle-active-badge">Tonight</span>' : ''}
      </div>
      <div class="cycle-name">${name.split('—')[1].trim()}</div>
      <div class="cycle-steps-text">${CYCLE_DESC[i]}</div>
    `;
    card.addEventListener('click', () => {
      state.cycleDay = i;
      state.lastCycleDate = todayStr;
      saveState();
      renderCycleList();
      renderTodayCycle();
      renderAllLists();
      showToast(`Switched to ${CYCLE_NAMES[i]} night`);
    });
    list.appendChild(card);
  });
}

// =============== STREAK & PROGRESS ===============
function getStreak() {
  let streak = 0;
  const d = new Date(todayStr + 'T00:00:00');
  // If today isn't logged yet, start counting from yesterday so the streak
  // doesn't show 0 all morning while an active streak exists
  if (!state.loggedDays.includes(todayStr)) {
    d.setDate(d.getDate() - 1);
  }
  while (true) {
    const s = ymd(d);
    if (state.loggedDays.includes(s)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

// =============== WEEKLY PHOTOS ===============
const PHOTO_DB_NAME = 'skin-photos-v1';
const PHOTO_STORE   = 'photos';

function openPhotoDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(PHOTO_DB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(PHOTO_STORE);
    req.onsuccess  = e => resolve(e.target.result);
    req.onerror    = ()  => reject(req.error);
  });
}

async function savePhotoData(id, dataUrl) {
  const db = await openPhotoDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    tx.objectStore(PHOTO_STORE).put(dataUrl, id);
    tx.oncomplete = resolve;
    tx.onerror    = () => reject(tx.error);
  });
}

async function getPhotoData(id) {
  const db = await openPhotoDb();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(PHOTO_STORE, 'readonly');
    const req = tx.objectStore(PHOTO_STORE).get(id);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror   = () => reject(req.error);
  });
}

async function removePhotoData(id) {
  const db = await openPhotoDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    tx.objectStore(PHOTO_STORE).delete(id);
    tx.oncomplete = resolve;
    tx.onerror    = () => reject(tx.error);
  });
}

async function clearAllPhotoData() {
  if (!('indexedDB' in window)) return;
  const db = await openPhotoDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    tx.objectStore(PHOTO_STORE).clear();
    tx.oncomplete = resolve;
    tx.onerror    = () => reject(tx.error);
  });
}

function compressImage(file, maxDim = 900) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width  * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas unavailable')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image could not be loaded'));
    };
    img.src = url;
  });
}

async function addWeeklyPhoto(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Choose an image file');
    return;
  }
  try {
    showToast('Saving photo…');
    const dataUrl = await compressImage(file);
    const id = 'photo_' + Date.now();
    await savePhotoData(id, dataUrl);

    const weekNum = (state.weeklyPhotos.length + 1);
    state.weeklyPhotos.push({ id, date: todayStr, label: `Week ${weekNum}` });

    // Keep only the 6 most recent
    if (state.weeklyPhotos.length > 6) {
      const removed = state.weeklyPhotos.shift();
      await removePhotoData(removed.id);
    }

    saveState();
    await renderWeeklyPhotos();
    showToast('Photo saved');
  } catch (e) {
    console.warn('Photo save failed', e);
    showToast('Could not save photo');
  }
}

async function deleteWeeklyPhoto(id) {
  if (!confirm('Delete this photo?')) return;
  try {
    await removePhotoData(id);
    state.weeklyPhotos = state.weeklyPhotos.filter(p => p.id !== id);
    saveState();
    await renderWeeklyPhotos();
    showToast('Photo deleted');
  } catch (e) {
    console.warn('Photo delete failed', e);
    showToast('Could not delete photo');
  }
}

function hasPhotoThisWeek() {
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return state.weeklyPhotos.some(p => isYmd(p.date) && new Date(p.date + 'T00:00:00') >= weekStart);
}

async function renderWeeklyPhotos() {
  const grid = document.getElementById('weekly-photos-grid');
  if (!grid) return;
  grid.innerHTML = '';

  if (!state.weeklyPhotos.length) {
    grid.innerHTML = '<p class="empty-photos">No photos yet — tap + to add your first weekly shot.</p>';
    return;
  }

  const photos = [...state.weeklyPhotos].reverse(); // newest first
  let missingPhotos = 0;
  for (const photo of photos) {
    let dataUrl = null;
    try {
      dataUrl = await getPhotoData(photo.id);
    } catch (e) {
      console.warn('Photo read failed', e);
      missingPhotos++;
      continue;
    }
    if (!dataUrl) { missingPhotos++; continue; } // image not on this device (synced from another)

    const date = new Date(photo.date + 'T00:00:00');
    const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    const item = document.createElement('div');
    item.className = 'photo-item';
    item.innerHTML = `
      <img class="photo-img" src="${dataUrl}" alt="${escapeHtml(photo.label)}" />
      <div class="photo-overlay">
        <span class="photo-label-text">${escapeHtml(photo.label)}</span>
        <span class="photo-date-text">${dateStr}</span>
      </div>
      <button class="photo-delete-btn" aria-label="Delete photo">✕</button>
    `;
    item.querySelector('.photo-delete-btn').addEventListener('click', e => {
      e.stopPropagation();
      deleteWeeklyPhoto(photo.id);
    });
    grid.appendChild(item);
  }

  if (!grid.children.length) {
    grid.innerHTML = '<p class="empty-photos">Photo history exists, but images are stored only on the device where they were added.</p>';
  } else if (missingPhotos) {
    const note = document.createElement('p');
    note.className = 'empty-photos';
    note.textContent = `${missingPhotos} synced photo ${missingPhotos === 1 ? 'entry is' : 'entries are'} not stored on this device.`;
    grid.appendChild(note);
  }
}

// =============== PAST DAY EDITING ===============
function getCycleDayForDate(dateStr) {
  const daysAgo = daysBetween(dateStr, todayStr);
  return ((state.cycleDay - daysAgo) % 3 + 3) % 3;
}

function openPastDayModal(dateStr) {
  const isToday = dateStr === todayStr;
  const date = new Date(dateStr + 'T00:00:00');
  const cycleDay = isToday ? state.cycleDay : getCycleDayForDate(dateStr);

  document.getElementById('past-day-title').textContent = isToday
    ? 'Today'
    : date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  renderPastDayBody(dateStr, cycleDay);
  document.getElementById('past-day-modal').hidden = false;
}

function renderPastDayBody(dateStr, cycleDay) {
  const checks = state.checks[dateStr] || {};
  const sections = [
    { label: 'Morning', tasks: getMorningTasksForDate(dateStr) },
    { label: `Night · ${CYCLE_NAMES[cycleDay]}`, tasks: state.tasks.night[cycleDay] || [] },
    { label: 'Habits', tasks: state.tasks.habit },
  ];

  const body = document.getElementById('past-day-body');
  body.innerHTML = sections.map(({ label, tasks }) => {
    if (!tasks.length) return '';
    const items = tasks.map(task => {
      const done = checks[task.id] === true;
      return `<li class="task-item ${done ? 'done' : ''}" data-id="${escapeHtml(task.id)}">
        <div class="task-check">
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="2.5 6.5 5 9 9.5 3.5"/></svg>
        </div>
        <span class="task-text">${escapeHtml(task.text)}</span>
      </li>`;
    }).join('');
    return `<div class="past-day-section">
      <p class="past-day-section-label">${label}</p>
      <ul class="task-list">${items}</ul>
    </div>`;
  }).join('');

  body.querySelectorAll('.task-item').forEach(li => {
    li.addEventListener('click', () => togglePastDayTask(dateStr, li.dataset.id, cycleDay));
  });
}

function togglePastDayTask(dateStr, taskId, cycleDay) {
  if (!state.checks[dateStr]) state.checks[dateStr] = {};
  const checks = state.checks[dateStr];
  if (checks[taskId]) { delete checks[taskId]; } else { checks[taskId] = true; }

  const morningTasks = getMorningTasksForDate(dateStr);
  const morningDone = morningTasks.length === 0 || morningTasks.every(t => checks[t.id]);
  const nightTasks = state.tasks.night[cycleDay] || [];
  const nightDone = nightTasks.length === 0 || nightTasks.every(t => checks[t.id]);
  const dayComplete = morningDone && nightDone;

  if (dayComplete && !state.loggedDays.includes(dateStr)) {
    state.loggedDays.push(dateStr);
  } else if (!dayComplete && state.loggedDays.includes(dateStr)) {
    state.loggedDays = state.loggedDays.filter(d => d !== dateStr);
  }

  saveState();
  renderPastDayBody(dateStr, cycleDay);
  if (dateStr === todayStr) {
    renderAllLists();
    document.getElementById('streak-num').textContent = getStreak();
  }
}

function closePastDayModal() {
  document.getElementById('past-day-modal').hidden = true;
  document.getElementById('streak-num').textContent = getStreak();
  if (document.getElementById('pane-progress').classList.contains('active')) renderProgress();
}

function renderProgress() {
  const streak = getStreak();
  const logged = state.loggedDays.length;

  // This week (Sun-Sat)
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const thisWeek = state.loggedDays.filter(d => new Date(d + 'T00:00:00') >= weekStart).length;

  const goalProgress = Math.min(logged, 21);

  document.getElementById('stat-streak').textContent = streak;
  document.getElementById('stat-logged').textContent = logged;
  document.getElementById('stat-week').textContent = thisWeek;
  document.getElementById('stat-goal').textContent = goalProgress;

  // Calendar — 6 weeks
  const cal = document.getElementById('cal-grid');
  cal.innerHTML = '';
  // Start at the Sunday 5 weeks before this Sunday (6 full weeks visible)
  const calStart = new Date(weekStart);
  calStart.setDate(calStart.getDate() - 35);
  const totalDays = 42;

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(calStart);
    d.setDate(calStart.getDate() + i);
    const ds = ymd(d);
    const isLogged = state.loggedDays.includes(ds);
    const isToday = ds === todayStr;
    const isFuture = d > today;

    const cell = document.createElement('div');
    cell.className = 'cal-day' +
      (isLogged ? ' logged' : '') +
      (isToday ? ' today' : '') +
      (isFuture ? ' future' : '');
    cell.textContent = d.getDate();
    cell.title = ds;
    if (!isFuture) {
      cell.addEventListener('click', () => openPastDayModal(ds));
    }
    cal.appendChild(cell);
  }

  // Milestones
  const daysSinceStart = getDaysSinceStart();
  const currentStage = getMilestoneStage(daysSinceStart);
  const upgradedStage = Number.isInteger(state.milestoneStage) ? state.milestoneStage : 0;
  const ml = document.getElementById('milestone-list');
  ml.innerHTML = '';
  MILESTONES.forEach((m, i) => {
    const done = i < currentStage;
    const active = i === currentStage;
    const routineUpdated = i > 0 && upgradedStage >= i;
    const row = document.createElement('div');
    row.className = 'milestone-row';
    row.innerHTML = `
      <div class="milestone-dot ${done ? 'done' : active ? 'active' : ''}"></div>
      <div class="milestone-info">
        <div class="milestone-week">${m.weeks}</div>
        <div class="milestone-desc">${m.desc}</div>
      </div>
      <div class="milestone-badges">
        ${done ? '<span class="milestone-badge">Completed</span>' : ''}
        ${active ? '<span class="milestone-badge active">Active</span>' : ''}
        ${routineUpdated ? '<span class="milestone-badge updated">Routine updated</span>' : ''}
      </div>
    `;
    ml.appendChild(row);
  });
}

// =============== TASK INFO MODAL ===============
function openTaskInfoModal(taskId) {
  const info = TASK_INFO[taskId];
  if (!info) return;
  document.getElementById('task-info-title').textContent = info.title;
  document.getElementById('task-info-what').textContent = info.what;
  document.getElementById('task-info-how').textContent = info.how;
  document.getElementById('task-info-skip').textContent = info.skip;
  document.getElementById('task-info-modal').hidden = false;
}

function closeTaskInfoModal() {
  document.getElementById('task-info-modal').hidden = true;
}

// =============== EDIT MODAL ===============
let editContext = null; // { mode: 'add'|'edit', section, task, cycleDay }

function openEditModal(section, task) {
  editContext = { mode: 'edit', section, task };
  document.getElementById('modal-title').textContent = 'Edit task';
  document.getElementById('edit-text').value = task.text;
  document.getElementById('edit-section').value = section;
  document.getElementById('section-field').hidden = false;

  // If the task is a night task, show cycle field
  const cycleField = document.getElementById('cycle-field');
  if (section === 'night') {
    cycleField.hidden = false;
    // Find which cycle day the task is in
    let foundDay = state.cycleDay;
    for (let i = 0; i < 3; i++) {
      if (state.tasks.night[i].some(t => t.id === task.id)) { foundDay = i; break; }
    }
    document.getElementById('edit-cycle').value = String(foundDay);
    editContext.cycleDay = foundDay;
  } else {
    cycleField.hidden = true;
  }

  document.getElementById('modal-delete').hidden = false;
  document.getElementById('edit-modal').hidden = false;
  setTimeout(() => document.getElementById('edit-text').focus(), 250);
}

function openAddModal(section) {
  editContext = { mode: 'add', section };
  document.getElementById('modal-title').textContent = 'New task';
  document.getElementById('edit-text').value = '';
  document.getElementById('edit-section').value = section;
  document.getElementById('section-field').hidden = false;

  const cycleField = document.getElementById('cycle-field');
  if (section === 'night') {
    cycleField.hidden = false;
    document.getElementById('edit-cycle').value = String(state.cycleDay);
  } else {
    cycleField.hidden = true;
  }

  document.getElementById('modal-delete').hidden = true;
  document.getElementById('edit-modal').hidden = false;
  setTimeout(() => document.getElementById('edit-text').focus(), 250);
}

function closeModal() {
  document.getElementById('edit-modal').hidden = true;
  editContext = null;
}

function handleSectionChange(newSection) {
  document.getElementById('cycle-field').hidden = (newSection !== 'night');
  if (newSection === 'night') {
    document.getElementById('edit-cycle').value = String(state.cycleDay);
  }
}

function saveTask() {
  if (!editContext) return;
  const text = document.getElementById('edit-text').value.trim();
  if (!text) { showToast('Task name is required'); return; }

  const newSection = document.getElementById('edit-section').value;
  const cycleVal = document.getElementById('edit-cycle').value;
  if (!['morning', 'night', 'habit'].includes(newSection)) {
    showToast('Choose a valid section');
    return;
  }
  if (newSection === 'night' && cycleVal !== 'all' && !['0', '1', '2'].includes(cycleVal)) {
    showToast('Choose a valid cycle day');
    return;
  }

  if (editContext.mode === 'add') {
    const task = { id: uid(), text };
    if (newSection === 'night') {
      if (cycleVal === 'all') {
        for (let i = 0; i < 3; i++) {
          state.tasks.night[i].push({ id: uid(), text });
        }
      } else {
        state.tasks.night[parseInt(cycleVal)].push(task);
      }
    } else {
      state.tasks[newSection].push(task);
    }
    showToast('Task added');
  } else {
    // Edit: remove from old location, place in new
    removeTaskById(editContext.task.id);
    const task = { ...editContext.task, text };
    if (newSection === 'night') {
      if (cycleVal === 'all') {
        for (let i = 0; i < 3; i++) {
          state.tasks.night[i].push({ id: uid(), text });
        }
      } else {
        state.tasks.night[parseInt(cycleVal)].push(task);
      }
    } else {
      state.tasks[newSection].push(task);
    }
    showToast('Task saved');
  }

  saveState();
  renderAllLists();
  closeModal();
}

function removeTaskById(id) {
  state.tasks.morning = state.tasks.morning.filter(t => t.id !== id);
  state.tasks.habit = state.tasks.habit.filter(t => t.id !== id);
  for (let i = 0; i < 3; i++) {
    state.tasks.night[i] = state.tasks.night[i].filter(t => t.id !== id);
  }
}

function deleteTask() {
  if (!editContext || editContext.mode !== 'edit') return;
  if (!confirm('Delete this task?')) return;
  removeTaskById(editContext.task.id);
  saveState();
  renderAllLists();
  closeModal();
  showToast('Task deleted');
}

// =============== NOTIFICATIONS ===============
function updateNotifStatus() {
  const status = document.getElementById('notif-status');
  const toggle = document.getElementById('notif-toggle');
  const hint = document.getElementById('notif-hint');

  if (!('Notification' in window)) {
    status.textContent = 'Not supported on this browser';
    toggle.checked = false;
    toggle.disabled = true;
    return;
  }

  if (Notification.permission === 'denied') {
    status.textContent = 'Blocked — enable in browser settings';
    toggle.checked = false;
    if (state.reminders.enabled) {
      state.reminders.enabled = false;
      saveState();
    }
  } else if (Notification.permission === 'granted' && state.reminders.enabled) {
    status.textContent = 'On';
    toggle.checked = true;
  } else {
    status.textContent = 'Tap to enable';
    toggle.checked = false;
  }

  // iOS-specific hint
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (isIOS && !isStandalone) {
    hint.textContent = 'On iOS, install this to your Home Screen first to enable notifications. Tap Share → Add to Home Screen.';
  }
}

async function toggleNotifications(enable) {
  if (!('Notification' in window)) {
    document.getElementById('notif-toggle').checked = false;
    state.reminders.enabled = false;
    saveState();
    return;
  }

  if (enable) {
    if (Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        document.getElementById('notif-toggle').checked = false;
        showToast('Permission denied');
        return;
      }
    } else if (Notification.permission === 'denied') {
      showToast('Enable in browser settings first');
      document.getElementById('notif-toggle').checked = false;
      return;
    }
    state.reminders.enabled = true;
    showToast('Reminders on');
    saveState();
    scheduleReminders();
    fireNotification('Reminders enabled', 'Your ritual reminders are active.', 'skin-reminders-enabled');
  } else {
    state.reminders.enabled = false;
    clearScheduledReminders();
    showToast('Reminders off');
    saveState();
  }
  updateNotifStatus();
}

let reminderTimers = [];

function clearScheduledReminders() {
  reminderTimers.forEach(t => clearTimeout(t));
  reminderTimers = [];
}

function scheduleReminders() {
  clearScheduledReminders();
  if (!('Notification' in window) || !state.reminders.enabled || Notification.permission !== 'granted') return;

  scheduleNextFor(state.reminders.morningTime, 'Morning ritual', 'Time to wash your face and apply sunscreen ☀', 'skin-morning');
  scheduleNextFor(state.reminders.nightTime, () => `Tonight — ${CYCLE_NAMES[state.cycleDay]}`, () => `Cycle day ${state.cycleDay + 1}: ${CYCLE_DESC[state.cycleDay]}`, 'skin-night');
  scheduleNextFor(state.reminders.checkInTime, 'Daily check-in', 'Did you complete your ritual today? Tap to log.', 'skin-checkin');
}

async function fireNotification(titleStr, bodyStr, tag) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const opts = {
    body: bodyStr,
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag,
    requireInteraction: false,
  };
  try {
    // Prefer Service Worker notifications — more reliable across browsers and iOS PWA
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(titleStr, opts);
    } else {
      new Notification(titleStr, opts);
    }
  } catch (e) {
    console.warn('Notification failed', tag, e);
  }
}

function scheduleNextFor(time24, title, body, tag) {
  if (!isValidReminderTime(time24)) return;
  const [h, m] = time24.split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(h, m, 0, 0);
  if (next <= now) {
    const sameMinute = now.getHours() === h && now.getMinutes() === m;
    if (sameMinute && now.getSeconds() < 55) {
      next.setTime(now.getTime() + 1000);
    } else {
      next.setDate(next.getDate() + 1);
    }
  }

  const delay = next - now;
  if (delay > 86400000) return;

  const t = setTimeout(() => {
    reminderTimers = reminderTimers.filter(id => id !== t);
    const titleStr = typeof title === 'function' ? title() : title;
    const bodyStr = typeof body === 'function' ? body() : body;
    fireNotification(titleStr, bodyStr, tag);
    scheduleNextFor(time24, title, body, tag);
  }, delay);

  reminderTimers.push(t);
}

// =============== TAB SWITCHING ===============
function switchTab(name) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('pane-' + name).classList.add('active');
  document.querySelector(`.tab[data-tab="${name}"]`).classList.add('active');

  if (name === 'progress') { renderProgress(); renderWeeklyPhotos(); }
  if (name === 'cycle') renderCycleList();
  if (name === 'settings') updateSettingsView();
}

// =============== SETTINGS ===============
function updateSettingsView() {
  document.getElementById('morning-time').value = state.reminders.morningTime;
  document.getElementById('night-time').value = state.reminders.nightTime;
  document.getElementById('checkin-time').value = state.reminders.checkInTime;
  document.getElementById('morning-time-label').textContent = formatTime12(state.reminders.morningTime);
  document.getElementById('night-time-label').textContent = formatTime12(state.reminders.nightTime);
  document.getElementById('checkin-time-label').textContent = formatTime12(state.reminders.checkInTime);
  document.getElementById('start-date-label').textContent = new Date((state.startDate || todayStr) + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  document.getElementById('comfort-toggle').checked = state.comfortMode ?? false;
  updateNotifStatus();
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `skincare-data-${todayStr}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
  showToast('Data exported');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!imported.tasks) throw new Error('Invalid file');
      state = migrateState(mergeDefaults(imported, DEFAULT_DATA));
      if (!state.startDate) state.startDate = todayStr;
      advanceCycleIfNeeded();
      updateMilestoneStage();
      saveState();
      flushToSupabase();
      renderHeader();
      renderTodayCycle();
      renderAllLists();
      if (document.getElementById('pane-progress').classList.contains('active')) renderProgress();
      updateSettingsView();
      showToast('Data imported');
    } catch {
      showToast('Could not import file');
    }
  };
  reader.onerror = () => showToast('Could not read file');
  reader.readAsText(file);
}

async function resetAll() {
  if (!confirm('Reset everything? This clears all ritual data, progress, and settings.')) return;
  if (sb && sbUserId) {
    try {
      await sb.from('user_data').upsert({
        user_id: sbUserId,
        data: deepClone(DEFAULT_DATA),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch (e) {
      console.warn('Supabase reset failed', e);
    }
  }
  try {
    await clearAllPhotoData();
  } catch (e) {
    console.warn('Photo reset failed', e);
  }
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

function resetStartDate() {
  if (!confirm('Reset the ritual start date to today.')) return;
  state.startDate = todayStr;
  state.milestoneStage = 0;
  updateMilestoneStage();
  saveState();
  updateSettingsView();
  renderProgress();
  showToast('Start date reset');
}

// =============== INIT ===============
document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
  updateMilestoneStage();

  renderHeader();
  renderTodayCycle();
  renderAllLists();
  renderCycleList();

  // Tab clicks
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Add buttons
  document.querySelectorAll('.add-btn[data-section]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openAddModal(btn.dataset.section);
    });
  });

  // Modal events
  document.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', closeModal);
  });
  document.getElementById('past-day-close').addEventListener('click', closePastDayModal);
  document.getElementById('past-day-backdrop').addEventListener('click', closePastDayModal);

  // Weekly photos
  document.getElementById('add-photo-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    if (hasPhotoThisWeek()) {
      if (!confirm('You already added a photo this week. Add another?')) return;
    }
    document.getElementById('weekly-photo-input').click();
  });
  document.getElementById('weekly-photo-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) addWeeklyPhoto(file);
    e.target.value = '';
  });
  document.getElementById('modal-save').addEventListener('click', saveTask);
  document.getElementById('modal-delete').addEventListener('click', deleteTask);
  document.getElementById('edit-section').addEventListener('change', (e) => handleSectionChange(e.target.value));
  document.getElementById('edit-text').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); saveTask(); }
  });

  // Settings
  document.getElementById('morning-time').addEventListener('change', (e) => {
    if (!isValidReminderTime(e.target.value)) { e.target.value = state.reminders.morningTime; showToast('Choose a valid time'); return; }
    state.reminders.morningTime = e.target.value;
    document.getElementById('morning-time-label').textContent = formatTime12(e.target.value);
    saveState();
    if (state.reminders.enabled) scheduleReminders();
    showToast('Morning reminder updated');
  });
  document.getElementById('night-time').addEventListener('change', (e) => {
    if (!isValidReminderTime(e.target.value)) { e.target.value = state.reminders.nightTime; showToast('Choose a valid time'); return; }
    state.reminders.nightTime = e.target.value;
    document.getElementById('night-time-label').textContent = formatTime12(e.target.value);
    saveState();
    if (state.reminders.enabled) scheduleReminders();
    showToast('Night reminder updated');
  });
  document.getElementById('checkin-time').addEventListener('change', (e) => {
    if (!isValidReminderTime(e.target.value)) { e.target.value = state.reminders.checkInTime; showToast('Choose a valid time'); return; }
    state.reminders.checkInTime = e.target.value;
    document.getElementById('checkin-time-label').textContent = formatTime12(e.target.value);
    saveState();
    if (state.reminders.enabled) scheduleReminders();
    showToast('Check-in reminder updated');
  });
  document.getElementById('notif-toggle').addEventListener('change', (e) => {
    toggleNotifications(e.target.checked);
  });
  document.getElementById('export-btn').addEventListener('click', exportData);
  document.getElementById('import-file').addEventListener('change', (e) => {
    if (e.target.files[0]) importData(e.target.files[0]);
    e.target.value = '';
  });
  document.getElementById('reset-all-btn').addEventListener('click', resetAll);
  document.getElementById('reset-start').addEventListener('click', resetStartDate);
  document.getElementById('comfort-toggle').addEventListener('change', (e) => {
    state.comfortMode = e.target.checked;
    saveState();
    renderAllLists();
    showToast(state.comfortMode ? 'Comfort mode on' : 'Comfort mode off');
  });

  // Auth helpers
  function showAuthError(msg) {
    const el = document.getElementById('auth-error');
    el.textContent = msg;
    el.hidden = false;
  }

  // Sign in
  document.getElementById('signin-btn').addEventListener('click', async () => {
    if (!sb) { showAuthError('Cloud sign-in is unavailable. Try again online.'); return; }
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;
    if (!email) { showAuthError('Enter your email'); return; }
    if (!password) { showAuthError('Enter your password'); return; }
    const btn = document.getElementById('signin-btn');
    btn.textContent = 'Signing in…';
    btn.disabled = true;
    try {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) { showAuthError(error.message); return; }
    } catch (e) {
      showAuthError(e.message || 'Could not sign in');
    } finally {
      btn.textContent = 'Sign in';
      btn.disabled = false;
    }
  });

  document.getElementById('signin-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('signin-btn').click();
  });

  // Sign up
  document.getElementById('signup-btn').addEventListener('click', async () => {
    if (!sb) { showAuthError('Cloud sign-up is unavailable. Try again online.'); return; }
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    if (!email) { showAuthError('Enter your email'); return; }
    if (password.length < 6) { showAuthError('Password must be at least 6 characters'); return; }
    const btn = document.getElementById('signup-btn');
    btn.textContent = 'Creating account…';
    btn.disabled = true;
    try {
      const { error } = await sb.auth.signUp({ email, password });
      if (error) { showAuthError(error.message); return; }
      showAuthView('confirm');
    } catch (e) {
      showAuthError(e.message || 'Could not create account');
    } finally {
      btn.textContent = 'Create account';
      btn.disabled = false;
    }
  });

  document.getElementById('signup-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('signup-btn').click();
  });

  // Forgot password
  document.getElementById('forgot-btn').addEventListener('click', async () => {
    if (!sb) { showAuthError('Password reset is unavailable. Try again online.'); return; }
    const email = document.getElementById('forgot-email').value.trim();
    if (!email) { showAuthError('Enter your email'); return; }
    const btn = document.getElementById('forgot-btn');
    btn.textContent = 'Sending…';
    btn.disabled = true;
    let error = null;
    try {
      ({ error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.href }));
    } catch (e) {
      error = e;
    }
    btn.textContent = 'Send reset link';
    btn.disabled = false;
    if (error) { showAuthError(error.message || 'Could not send reset link'); return; }
    showToast('Reset link sent — check your email');
    showAuthView('signin');
  });

  document.getElementById('forgot-email').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('forgot-btn').click();
  });

  // Reset password (after clicking email link)
  document.getElementById('reset-btn').addEventListener('click', async () => {
    if (!sb) { showAuthError('Password update is unavailable. Try again online.'); return; }
    const password = document.getElementById('reset-password').value;
    if (password.length < 6) { showAuthError('Password must be at least 6 characters'); return; }
    const btn = document.getElementById('reset-btn');
    btn.textContent = 'Updating…';
    btn.disabled = true;
    let error = null;
    try {
      ({ error } = await sb.auth.updateUser({ password }));
    } catch (e) {
      error = e;
    }
    btn.textContent = 'Update password';
    btn.disabled = false;
    if (error) { showAuthError(error.message || 'Could not update password'); return; }
    showToast('Password updated');
    document.getElementById('auth-screen').hidden = true;
  });

  // Navigation between views
  document.getElementById('goto-signup').addEventListener('click', () => showAuthView('signup'));
  document.getElementById('goto-signin').addEventListener('click', () => showAuthView('signin'));
  document.getElementById('goto-forgot').addEventListener('click', () => showAuthView('forgot'));
  document.getElementById('forgot-back').addEventListener('click', () => showAuthView('signin'));
  document.getElementById('confirm-back').addEventListener('click', () => showAuthView('signin'));

  document.getElementById('sign-out-btn').addEventListener('click', async () => {
    if (!confirm('Sign out? Your data is saved to the cloud.')) return;
    clearTimeout(sbSaveTimer);
    clearScheduledReminders();
    localStorage.removeItem(STORAGE_KEY);
    state = deepClone(DEFAULT_DATA);
    sbUserId = null;
    if (sb) try { await sb.auth.signOut(); } catch {}
    document.getElementById('auth-screen').hidden = false;
    showAuthView('signin');
  });

  document.getElementById('streak-pill').addEventListener('click', () => switchTab('progress'));

  // Schedule reminders if enabled
  if (state.reminders.enabled && 'Notification' in window && Notification.permission === 'granted') {
    scheduleReminders();
  }

  // Detect if day changed (when app stays open)
  setInterval(() => {
    const newToday = ymd(new Date());
    if (newToday !== todayStr) location.reload();
  }, 60000);

  // Flush to Supabase immediately when tab is hidden or page unloads
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushToSupabase();
  });
  window.addEventListener('pagehide', () => flushToSupabase());
});
