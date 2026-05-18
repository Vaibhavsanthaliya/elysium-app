import { initState, registerSyncCallback, updateMilestoneStage, state, todayStr, saveState } from './js/state.js';
import { deepClone } from './js/utils.js';
import { DEFAULT_DATA, STORAGE_KEY } from './js/constants.js';
import { isValidReminderTime, formatTime12, ymd } from './js/utils.js';
import {
  initSupabase, scheduleSaveToSupabase, flushToSupabase,
  hideBootShell, showAuthView, sb, registerPostSyncCallback,
} from './js/sync.js';
import { renderHeader, renderTodayCycle } from './js/render/common.js';
import { renderTemple } from './js/render/temple.js';
import { renderAllLists } from './js/render/today.js';
import { renderCycleList } from './js/render/cycle.js';
import { renderChronicle, saveChronicleNote } from './js/render/chronicle.js';
import { renderProgress, renderWeeklyPhotos, closePastDayModal } from './js/render/progress.js';
import { updateSettingsView, exportData, importData, resetAll, resetStartDate } from './js/render/settings.js';
import { switchTab } from './js/ui/tabs.js';
import { openAddModal, closeModal, saveTask, deleteTask, handleSectionChange } from './js/ui/modals.js';
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
    if (state.reminders?.enabled && 'Notification' in window && Notification.permission === 'granted') {
      scheduleReminders();
    } else {
      clearScheduledReminders();
    }
  });

  initSupabase();

  // Safety net: auto-clear boot shell if normal paths fail (fires only on exception)
  setTimeout(hideBootShell, 4000);

  updateMilestoneStage();

  renderHeader();
  renderTodayCycle();
  renderAllLists();
  renderCycleList();
  renderTemple();

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
  document.getElementById('streak-pill').addEventListener('click', () => switchTab('progress'));
  document.getElementById('temple-goto-today').addEventListener('click', () => switchTab('today'));
  document.getElementById('temple-goto-chronicle').addEventListener('click', () => switchTab('chronicle'));
  document.getElementById('temple-goto-cycle').addEventListener('click', () => switchTab('cycle'));
  document.getElementById('temple-goto-progress').addEventListener('click', () => switchTab('progress'));
  document.getElementById('chronicle-save-btn').addEventListener('click', saveChronicleNote);

  // Schedule reminders if already enabled
  if (state.reminders.enabled && 'Notification' in window && Notification.permission === 'granted') {
    scheduleReminders();
  }

  // Reload when calendar day rolls over (app left open overnight)
  setInterval(() => {
    if (ymd(new Date()) !== todayStr) location.reload();
  }, 60000);

  // Flush to Supabase when tab is hidden or page unloads
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushToSupabase();
  });
  window.addEventListener('pagehide', () => flushToSupabase());
});
