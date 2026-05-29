import { SUPABASE_URL, SUPABASE_ANON_KEY, DEFAULT_DATA, STORAGE_KEY } from './constants.js';
import { deepClone, isYmd } from './utils.js';
import {
  state, setState, todayStr,
  saveState, migrateState, mergeDefaults,
  advanceCycleIfNeeded,
} from './state.js';

export let sb = null;
export let sbUserId = null;
let sbSaveTimer = null;
let syncInProgress = false;
let bootShellRevealed = false;

// Registered by main.js: called after a successful cloud sync so render modules
// can refresh without sync.js importing any render/ui modules (import direction).
let _postSyncCallback = null;
export function registerPostSyncCallback(fn) { _postSyncCallback = fn; }

// Registered by main.js. Runs once on the reveal frame so tab-pane layout can
// settle after the boot overlay is removed, without sync.js importing UI modules.
let _bootRevealLayoutCallback = null;
export function registerBootRevealLayoutCallback(fn) {
  _bootRevealLayoutCallback = typeof fn === 'function' ? fn : null;
}

export function hideBootShell() {
  const el = document.getElementById('boot-shell');
  if (bootShellRevealed || el?.hidden) return;

  bootShellRevealed = true;
  if (el) el.hidden = true;

  requestAnimationFrame(() => {
    _bootRevealLayoutCallback?.();
  });
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

      const mergedLightEntries = {};
      const lightDates = new Set([
        ...Object.keys(cloud.light?.entries || {}),
        ...Object.keys(state.light?.entries || {}),
      ]);
      for (const date of lightDates) {
        if (!isYmd(date)) continue;
        const cw = cloud.light?.entries?.[date]?.witnesses || [];
        const lw = state.light?.entries?.[date]?.witnesses || [];
        mergedLightEntries[date] = { witnesses: Array.from(new Set([...cw, ...lw])).sort() };
      }

      const mindMap = new Map();
      for (const s of (cloud.mind?.sessions || [])) mindMap.set(s.id, s);
      for (const s of (state.mind?.sessions || [])) mindMap.set(s.id, s);
      const mergedMindSessions = Array.from(mindMap.values());

      const mergedMindArrivals = {};
      const mindArrivalDates = new Set([
        ...Object.keys(cloud.mind?.arrivals || {}),
        ...Object.keys(state.mind?.arrivals || {}),
      ]);
      for (const date of mindArrivalDates) {
        if (!isYmd(date)) continue;
        const ca = cloud.mind?.arrivals?.[date];
        const la = state.mind?.arrivals?.[date];
        const merged = la || ca;
        if (merged?.at) {
          const out = { at: merged.at };
          if (typeof merged.period === 'string') out.period = merged.period;
          mergedMindArrivals[date] = out;
        }
      }

      const mergedBodyArrivals = {};
      const bodyDates = new Set([
        ...Object.keys(cloud.body?.arrivals || {}),
        ...Object.keys(state.body?.arrivals || {}),
      ]);
      for (const date of bodyDates) {
        if (!isYmd(date)) continue;
        const ca = cloud.body?.arrivals?.[date] || [];
        const la = state.body?.arrivals?.[date] || [];
        const seen = new Set();
        mergedBodyArrivals[date] = [...ca, ...la].filter(e => {
          if (!e?.at) return false;
          if (seen.has(e.at)) return false;
          seen.add(e.at);
          return true;
        });
      }

      const mergedWaterHoldings = {};
      const waterDates = new Set([
        ...Object.keys(cloud.water?.holdings || {}),
        ...Object.keys(state.water?.holdings || {}),
      ]);
      for (const date of waterDates) {
        if (!isYmd(date)) continue;
        const ch = cloud.water?.holdings?.[date] || [];
        const lh = state.water?.holdings?.[date] || [];
        const seen = new Set();
        const merged = [...ch, ...lh].filter(e => {
          if (!e?.at) return false;
          if (seen.has(e.at)) return false;
          seen.add(e.at);
          return true;
        }).map(e => ({ at: e.at }));
        if (merged.length) mergedWaterHoldings[date] = merged;
      }

      setState(cloud);
      state.loggedDays = mergedLoggedDays;
      state.checks = mergedChecks;
      state.sleep = { entries: mergedSleepEntries };
      state.light = { entries: mergedLightEntries };
      state.mind = { sessions: mergedMindSessions, arrivals: mergedMindArrivals };
      state.body = { arrivals: mergedBodyArrivals };
      state.water = { holdings: mergedWaterHoldings };
      if (!state.startDate) state.startDate = todayStr;
      migrateState(state);
      advanceCycleIfNeeded();

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
