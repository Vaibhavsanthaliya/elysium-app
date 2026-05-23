import { initState, registerSyncCallback, state, todayStr, saveState } from './js/state.js';
import { deepClone } from './js/utils.js';
import { DEFAULT_DATA, STORAGE_KEY } from './js/constants.js';
import { isValidReminderTime, formatTime12, ymd } from './js/utils.js';
import {
  initSupabase, scheduleSaveToSupabase, flushToSupabase,
  hideBootShell, showAuthView, sb, registerPostSyncCallback,
} from './js/sync.js';
import { renderHeader, renderTodayCycle } from './js/render/common.js';
import { renderTemple, applyTempleTrace } from './js/render/temple.js';
import { keepMorningProtocol, keepNightProtocol, renderAllLists } from './js/render/today.js';
import { renderCycleList } from './js/render/cycle.js';
import {
  renderChronicle,
  saveChronicleNote,
  scheduleChronicleAutosave,
  flushPendingChronicleSave,
} from './js/render/chronicle.js';
import { witnessLight } from './js/domains/light.js';
import { renderProgress, renderWeeklyPhotos, closePastDayModal } from './js/render/progress.js';
import { updateSettingsView, exportData, importData, resetAll, resetStartDate } from './js/render/settings.js';
import { isClosedForToday } from './js/domains/sleep.js';
import { registerClosedDayHandler, switchTab } from './js/ui/tabs.js';
import {
  openAddModal,
  closeModal,
  saveTask,
  deleteTask,
  handleSectionChange,
  openSleepModal,
  closeSleepModal,
  reopenSleepModal,
  saveSleepModal,
  registerMindModal,
  registerConfirmModal,
  openMindModalIfActive,
  openBodyModal,
  registerBodyModal,
} from './js/ui/modals.js';
import { showToast } from './js/ui/toast.js';
import { addWeeklyPhoto, hasPhotoThisWeek } from './js/services/photos.js';
import { scheduleReminders, clearScheduledReminders, toggleNotifications } from './js/services/notifications.js';

document.addEventListener('DOMContentLoaded', () => {
  // Core init — must run before any render calls
  initState();
  registerSyncCallback(scheduleSaveToSupabase);

  // Wire post-sync render callback so sync.js never imports render/ui modules
  registerPostSyncCallback(() => {
    renderHeader();
    renderTodayCycle();
    renderAllLists();
    renderCycleList();
    if (document.getElementById('pane-temple').classList.contains('active')) renderTemple();
    if (document.getElementById('pane-chronicle').classList.contains('active')) renderChronicle();
    if (document.getElementById('pane-progress').classList.contains('active')) renderProgress();
    if (document.getElementById('pane-settings').classList.contains('active')) updateSettingsView();
    if (isClosedForToday()) openSleepModal();
    if (state.reminders?.enabled && 'Notification' in window && Notification.permission === 'granted') {
      scheduleReminders();
    } else {
      clearScheduledReminders();
    }
  });

  initSupabase();

  // Safety net: auto-clear boot shell if normal paths fail (fires only on exception)
  setTimeout(hideBootShell, 4000);

  renderHeader();
  renderTodayCycle();
  renderAllLists();
  renderCycleList();
  renderTemple();
  registerClosedDayHandler(openSleepModal);

  // --- Tab clicks ---
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // --- Add task buttons ---
  document.querySelectorAll('.add-btn[data-section]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openAddModal(btn.dataset.section);
    });
  });
  document.getElementById('care-morning-action')?.addEventListener('click', keepMorningProtocol);
  document.getElementById('care-night-action')?.addEventListener('click', keepNightProtocol);

  // --- Edit modal ---
  document.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', closeModal);
  });
  document.getElementById('modal-save').addEventListener('click', saveTask);
  document.getElementById('modal-delete').addEventListener('click', deleteTask);
  document.getElementById('edit-section').addEventListener('change', (e) => handleSectionChange(e.target.value));
  document.getElementById('edit-text').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); saveTask(); }
  });

  // --- Past day modal ---
  document.getElementById('past-day-close').addEventListener('click', closePastDayModal);
  document.getElementById('past-day-backdrop').addEventListener('click', closePastDayModal);

  // --- Weekly photos ---
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

  // --- Settings ---
  document.getElementById('morning-time').addEventListener('change', (e) => {
    if (!isValidReminderTime(e.target.value)) { e.target.value = state.reminders.morningTime; showToast('Choose a valid time'); return; }
    state.reminders.morningTime = e.target.value;
    document.getElementById('morning-time-label').textContent = formatTime12(e.target.value);
    saveState();
    if (state.reminders.enabled) scheduleReminders();
    showToast('Morning cue updated');
  });
  document.getElementById('night-time').addEventListener('change', (e) => {
    if (!isValidReminderTime(e.target.value)) { e.target.value = state.reminders.nightTime; showToast('Choose a valid time'); return; }
    state.reminders.nightTime = e.target.value;
    document.getElementById('night-time-label').textContent = formatTime12(e.target.value);
    saveState();
    if (state.reminders.enabled) scheduleReminders();
    showToast('Night cue updated');
  });
  document.getElementById('checkin-time').addEventListener('change', (e) => {
    if (!isValidReminderTime(e.target.value)) { e.target.value = state.reminders.checkInTime; showToast('Choose a valid time'); return; }
    state.reminders.checkInTime = e.target.value;
    document.getElementById('checkin-time-label').textContent = formatTime12(e.target.value);
    saveState();
    if (state.reminders.enabled) scheduleReminders();
    showToast('Evening cue updated');
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

  // --- Auth helpers ---
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

  // Auth view navigation
  document.getElementById('goto-signup').addEventListener('click', () => showAuthView('signup'));
  document.getElementById('goto-signin').addEventListener('click', () => showAuthView('signin'));
  document.getElementById('goto-forgot').addEventListener('click', () => showAuthView('forgot'));
  document.getElementById('forgot-back').addEventListener('click', () => showAuthView('signin'));
  document.getElementById('confirm-back').addEventListener('click', () => showAuthView('signin'));

  // Sign out
  document.getElementById('sign-out-btn').addEventListener('click', async () => {
    if (!confirm('Sign out? Your data is saved to the cloud.')) return;
    clearScheduledReminders();
    localStorage.removeItem(STORAGE_KEY);
    Object.assign(state, deepClone(DEFAULT_DATA));
    if (sb) try { await sb.auth.signOut(); } catch {}
    switchTab('temple');
    document.getElementById('auth-screen').hidden = false;
    showAuthView('signin');
  });

  // Global nav shortcuts
  document.getElementById('temple-goto-today').addEventListener('click', () => switchTab('today'));
  document.getElementById('temple-goto-chronicle').addEventListener('click', () => switchTab('chronicle'));
  document.getElementById('temple-goto-cycle').addEventListener('click', () => switchTab('cycle'));
  document.getElementById('temple-goto-progress').addEventListener('click', () => switchTab('progress'));
  const chronicleTextarea = document.getElementById('chronicle-textarea');
  chronicleTextarea.addEventListener('input', scheduleChronicleAutosave);
  chronicleTextarea.addEventListener('blur', saveChronicleNote);
  document.getElementById('temple-goto-sleep').addEventListener('click', openSleepModal);
  document.getElementById('sleep-modal-backdrop').addEventListener('click', closeSleepModal);
  document.getElementById('sleep-reopen').addEventListener('click', () => {
    if (reopenSleepModal()) flushToSupabase();
  });
  document.getElementById('sleep-save').addEventListener('click', saveSleepModal);

  // --- Light domain modal ---
  const LIGHT_PERIODS = [
    { start: 0,  end: 4,  label: 'Night',       top: '#0E0E12', mid: '#131318', bot: '#1A1A21' },
    { start: 4,  end: 6,  label: 'First light', top: '#1A0E18', mid: '#6B2820', bot: '#C9734A' },
    { start: 6,  end: 10, label: 'Morning',     top: '#C9734A', mid: '#D49A5C', bot: '#E8C07A' },
    { start: 10, end: 15, label: 'Midday',      top: '#C9A56B', mid: '#D4B87A', bot: '#E8C07A' },
    { start: 15, end: 18, label: 'Afternoon',   top: '#C9A56B', mid: '#C47840', bot: '#D49A5C' },
    { start: 18, end: 20, label: 'Golden hour', top: '#8B3A20', mid: '#C9734A', bot: '#C9A56B' },
    { start: 20, end: 22, label: 'Dusk',        top: '#2A1228', mid: '#6B2820', bot: '#8B5A3A' },
    { start: 22, end: 24, label: 'Night',       top: '#0E0E12', mid: '#131318', bot: '#1A1A21' },
  ];

  function getCurrentLightPeriod() {
    const h = new Date().getHours();
    return LIGHT_PERIODS.find(p => h >= p.start && h < p.end) || LIGHT_PERIODS[0];
  }

  function renderLightModal() {
    const now = new Date();
    const period = getCurrentLightPeriod();

    const sky = document.getElementById('light-sky');
    if (sky) {
      sky.style.setProperty('--light-sky-top', period.top);
      sky.style.setProperty('--light-sky-mid', period.mid);
      sky.style.setProperty('--light-sky-bot', period.bot);
    }

    const eyebrow = document.getElementById('light-eyebrow');
    if (eyebrow) eyebrow.textContent = `APOLLO · ${period.label.toUpperCase()}`;

    const btn = document.getElementById('light-witness-btn');
    if (btn) {
      btn.textContent = "I'm here";
      btn.classList.remove('is-still');
    }

    const pct = ((now.getHours() * 60 + now.getMinutes()) / 1440 * 100).toFixed(1);
    const cursor = document.getElementById('light-cursor');
    if (cursor) cursor.style.left = `${pct}%`;

    const hh = now.getHours();
    const mm = String(now.getMinutes()).padStart(2, '0');
    const displayH = hh % 12 || 12;
    const timeEl = document.getElementById('light-cursor-time');
    if (timeEl) timeEl.textContent = `${displayH}:${mm}`;

    const skyEl = document.getElementById('light-sky');
    if (skyEl) {
      skyEl.querySelectorAll('.light-witness-mark').forEach(el => el.remove());
      const yd = new Date();
      yd.setDate(yd.getDate() - 1);
      const yesterdayStr = `${yd.getFullYear()}-${String(yd.getMonth() + 1).padStart(2, '0')}-${String(yd.getDate()).padStart(2, '0')}`;
      const lingerWitnesses = state.light?.entries?.[yesterdayStr]?.witnesses || [];
      for (const t of lingerWitnesses) {
        const [wh, wm] = t.split(':').map(Number);
        if (!Number.isFinite(wh) || !Number.isFinite(wm)) continue;
        const markPct = ((wh * 60 + wm) / 1440 * 100).toFixed(1);
        const mark = document.createElement('div');
        mark.className = 'light-witness-mark is-linger';
        mark.style.left = `${markPct}%`;
        skyEl.appendChild(mark);
      }
      const witnesses = state.light?.entries?.[todayStr]?.witnesses || [];
      for (const t of witnesses) {
        const [wh, wm] = t.split(':').map(Number);
        if (!Number.isFinite(wh) || !Number.isFinite(wm)) continue;
        const markPct = ((wh * 60 + wm) / 1440 * 100).toFixed(1);
        const mark = document.createElement('div');
        mark.className = 'light-witness-mark';
        mark.style.left = `${markPct}%`;
        skyEl.appendChild(mark);
      }
    }
  }

  let _lightWitnessedThisSession = false;

  function openLightModal() {
    _lightWitnessedThisSession = false;
    renderLightModal();
    document.getElementById('light-modal').hidden = false;
  }

  function closeLightModal() {
    document.getElementById('light-modal').hidden = true;
    if (_lightWitnessedThisSession) {
      _lightWitnessedThisSession = false;
      applyTempleTrace('light');
    }
  }

  document.getElementById('temple-goto-light').addEventListener('click', openLightModal);
  document.getElementById('light-modal-backdrop').addEventListener('click', closeLightModal);
  document.getElementById('light-modal-close').addEventListener('click', closeLightModal);
  document.getElementById('light-witness-btn').addEventListener('click', () => {
    witnessLight(todayStr);
    _lightWitnessedThisSession = true;
    saveState();
    renderTemple();
    const btn = document.getElementById('light-witness-btn');
    const closeBtn = document.getElementById('light-modal-close');
    if (btn) { btn.textContent = '·'; btn.classList.add('is-still'); }
    if (closeBtn) closeBtn.style.visibility = 'hidden';
    setTimeout(() => {
      renderLightModal();
      if (closeBtn) closeBtn.style.visibility = '';
      const b = document.getElementById('light-witness-btn');
      if (b) b.textContent = 'Witnessed ·';
      setTimeout(renderLightModal, 1500);
    }, 3000);
  });

  // --- Mind domain modal ---
  registerMindModal();
  registerConfirmModal();
  openMindModalIfActive();

  // --- Body domain modal ---
  registerBodyModal();
  document.getElementById('temple-goto-body')?.addEventListener('click', openBodyModal);

  // Schedule reminders if already enabled
  if (state.reminders.enabled && 'Notification' in window && Notification.permission === 'granted') {
    scheduleReminders();
  }

  if (isClosedForToday()) openSleepModal();

  // Reload when calendar day rolls over (app left open overnight)
  setInterval(() => {
    if (ymd(new Date()) !== todayStr) location.reload();
  }, 60000);

  // Flush to Supabase when tab is hidden or page unloads
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushPendingChronicleSave();
      flushToSupabase();
    }
  });
  window.addEventListener('pagehide', () => {
    flushPendingChronicleSave();
    flushToSupabase();
  });
});
