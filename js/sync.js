import { SUPABASE_URL, SUPABASE_ANON_KEY, DEFAULT_DATA, STORAGE_KEY } from './constants.js';
import { deepClone, isYmd } from './utils.js';
import {
  state, setState, todayStr,
  saveState, migrateState, mergeDefaults,
  advanceCycleIfNeeded, updateMilestoneStage,
} from './state.js';

export let sb = null;
export let sbUserId = null;
let sbSaveTimer = null;
let syncInProgress = false;

// Registered by main.js: called after a successful cloud sync so render modules
// can refresh without sync.js importing any render/ui modules (import direction).
let _postSyncCallback = null;
export function registerPostSyncCallback(fn) { _postSyncCallback = fn; }

export function hideBootShell() {
  const el = document.getElementById('boot-shell');
  if (el) el.hidden = true;
}

export function showAuthView(view) {
  ['signin', 'signup', 'forgot', 'confirm', 'reset'].forEach(v => {
    document.getElementById(`auth-${v}`).hidden = (v !== view);
  });
  document.getElementById('auth-error').hidden = true;
}

export function initSupabase() {
  const authScreen = document.getElementById('auth-screen');
  if (!window.supabase) {
    console.warn('Supabase unavailable — running in offline/local mode');
    hideBootShell();
    return;
  }
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  showAuthView('signin');
  let initialSessionChecked = false;

  async function applyAuthSession(event, session) {
    sbUserId = session?.user?.id ?? null;
    if (event === 'PASSWORD_RECOVERY') {
      authScreen.hidden = false;
      showAuthView('reset');
      hideBootShell();
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
      hideBootShell();
    } else {
      authScreen.hidden = false;
      showAuthView('signin');
      hideBootShell();
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
    hideBootShell();
  });

  // Safety net in case onAuthStateChange never fires (stale SW, CDN issue, etc.)
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
      hideBootShell();
    }
  }, 1500);
}

export async function syncFromSupabase() {
  if (!sb || !sbUserId) return;
  if (syncInProgress) return;
  syncInProgress = true;
  const syncUserId = sbUserId;
  try {
    const { data, error } = await sb.from('user_data').select('data').eq('user_id', syncUserId).single();
    if (sbUserId !== syncUserId) return;
    if (error?.code === 'PGRST116') {
      await sb.from('user_data').upsert(
        { user_id: syncUserId, data: deepClone(state), updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
      return;
    }
    if (error) throw error;
    if (data?.data) {
      const cloud = migrateState(mergeDefaults(data.data, DEFAULT_DATA));

      const mergedLoggedDays = Array.from(new Set([
        ...(Array.isArray(state.loggedDays) ? state.loggedDays : []),
        ...(Array.isArray(cloud.loggedDays) ? cloud.loggedDays : []),
      ])).filter(isYmd);

      const mergedChecks = {};
      const allDates = new Set([
        ...Object.keys(state.checks || {}),
        ...Object.keys(cloud.checks || {}),
      ]);
      for (const date of allDates) {
        if (!isYmd(date)) continue;
        const merged = { ...(state.checks?.[date] || {}), ...(cloud.checks?.[date] || {}) };
        mergedChecks[date] = Object.fromEntries(Object.entries(merged).filter(([, v]) => v === true));
      }

      const mergedSleepEntries = {
        ...(cloud.sleep?.entries || {}),
        ...(state.sleep?.entries || {}),
      };

      const mergedLightEntries = {
        ...(cloud.light?.entries || {}),
        ...(state.light?.entries || {}),
      };

      const mindMap = new Map();
      for (const s of (cloud.mind?.sessions || [])) mindMap.set(s.id, s);
      for (const s of (state.mind?.sessions || [])) mindMap.set(s.id, s);
      const mergedMindSessions = Array.from(mindMap.values());

      setState(cloud);
      state.loggedDays = mergedLoggedDays;
      state.checks = mergedChecks;
      state.sleep = { entries: mergedSleepEntries };
      state.light = { entries: mergedLightEntries };
      state.mind = { sessions: mergedMindSessions };
      if (!state.startDate) state.startDate = todayStr;
      migrateState(state);
      advanceCycleIfNeeded();
      updateMilestoneStage();

      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      _postSyncCallback?.();
    }
  } catch (e) {
    console.warn('Supabase sync failed', e);
  } finally {
    syncInProgress = false;
  }
}

export async function flushToSupabase() {
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

export function scheduleSaveToSupabase() {
  if (!sb || !sbUserId) return;
  clearTimeout(sbSaveTimer);
  sbSaveTimer = setTimeout(() => flushToSupabase(), 300);
}

export function updateAccountView() {
  if (!sb) return;
  sb.auth.getUser().then(({ data: { user } }) => {
    const el = document.getElementById('account-email');
    if (el) el.textContent = user?.email ?? '—';
  }).catch(() => {});
}
