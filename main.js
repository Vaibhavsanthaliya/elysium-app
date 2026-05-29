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
import { getCareRecord, saveCareCheckIn, saveCareReactionNote } from './js/domains/care.js';
import { renderCycleList } from './js/render/cycle.js';
import {
  renderChronicle,
  saveChronicleNote,
  scheduleChronicleAutosave,
  flushPendingChronicleSave,
} from './js/render/chronicle.js';
import { witnessLight, getLightOpeningInvitation } from './js/domains/light.js';
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
  openBodyModal,
  registerBodyModal,
  openWaterModal,
  registerWaterModal,
} from './js/ui/modals.js';
import { showToast } from './js/ui/toast.js';
import { openMorningFlow, registerMorningFlow, openNightFlow, registerNightFlow, openWorkFlow, registerWorkFlow } from './js/ui/flow.js';
import { renderTodayPlan } from './js/render/today-plan.js';
import { addTodayIntention, toggleTodayIntention, deleteIntention, bringForwardIntention, letIntentionPass, getTodayPlan } from './js/domains/today-plan.js';
import { addWeeklyPhoto, hasPhotoThisWeek } from './js/services/photos.js';
import { scheduleReminders, clearScheduledReminders, toggleNotifications } from './js/services/notifications.js';

document.addEventListener('DOMContentLoaded', () => {
  // Prevent browser scroll restoration so first-load matches tab-switch behavior
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  // Core init — must run before any render calls
  initState();
  registerSyncCallback(scheduleSaveToSupabase);

  // Wire post-sync render callback so sync.js never imports render/ui modules
  registerPostSyncCallback(() => {
    renderHeader();
    renderTodayCycle();
    renderAllLists();
    renderCycleList();
    if (document.getElementById('pane-today')?.classList.contains('active')) renderTodayPlan();
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
    // Reset scroll after all post-sync DOM mutations, immediately before hideBootShell()
    // reveals the app. Without this, iOS scroll anchoring can leave scroll at >0 when
    // the boot shell hides, making the page appear to have extra blank space below the nav.
    window.scrollTo(0, 0);
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

  // --- Care check-in ---
  document.getElementById('care-condition-chips')?.addEventListener('click', e => {
    const chip = e.target.closest('.care-checkin-chip');
    if (!chip) return;
    const condition = chip.dataset.condition;
    const newCondition = getCareRecord(todayStr).condition === condition ? '' : condition;
    saveCareCheckIn(todayStr, { condition: newCondition });
    document.querySelectorAll('#care-condition-chips .care-checkin-chip').forEach(c => {
      c.classList.toggle('is-selected', c.dataset.condition === newCondition);
    });
  });
  document.getElementById('care-morning-note')?.addEventListener('blur', e => {
    saveCareCheckIn(todayStr, { morningNote: e.target.value });
  });
  document.getElementById('care-reaction-note')?.addEventListener('blur', e => {
    saveCareReactionNote(todayStr, e.target.value);
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
    let display = msg;
    if (/invalid login credentials/i.test(msg) || /invalid credentials/i.test(msg)) {
      display = 'Email or password did not match.';
    }
    el.textContent = display;
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
  document.getElementById('temple-goto-today').addEventListener('click', () => switchTab('care'));
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
  function renderLightModal() {
    const invitationEl = document.getElementById('light-invitation');
    if (invitationEl) invitationEl.textContent = getLightOpeningInvitation();

    const marksEl = document.getElementById('light-marks');
    if (marksEl) {
      marksEl.querySelectorAll('.light-witness-mark').forEach(el => el.remove());
      const yd = new Date();
      yd.setDate(yd.getDate() - 1);
      const yesterdayStr = `${yd.getFullYear()}-${String(yd.getMonth() + 1).padStart(2, '0')}-${String(yd.getDate()).padStart(2, '0')}`;
      const appendMark = (timeStr, linger) => {
        const [wh, wm] = timeStr.split(':').map(Number);
        if (!Number.isFinite(wh) || !Number.isFinite(wm)) return;
        const mark = document.createElement('div');
        mark.className = linger ? 'light-witness-mark is-linger' : 'light-witness-mark';
        mark.style.left = `${((wh * 60 + wm) / 1440 * 100).toFixed(1)}%`;
        marksEl.appendChild(mark);
      };
      (state.light?.entries?.[yesterdayStr]?.witnesses || []).forEach(t => appendMark(t, true));
      (state.light?.entries?.[todayStr]?.witnesses || []).forEach(t => appendMark(t, false));
    }

    const btn = document.getElementById('light-witness-btn');
    if (btn) btn.classList.remove('is-still');
  }

  let _lightWitnessedThisSession = false;
  let _selectedLightTone = null;

  const LIGHT_TONE_CONFIRMATIONS = {
    Soft: 'A soft morning.',
    Clear: 'A clear morning.',
    Steady: 'A steady morning.',
    Guarded: 'A guarded morning.',
  };

  function openLightModal() {
    _lightWitnessedThisSession = false;
    _selectedLightTone = null;
    document.querySelectorAll('#light-tone-chooser .light-tone-btn').forEach(b => b.classList.remove('is-selected'));
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

  document.getElementById('light-tone-chooser')?.addEventListener('click', e => {
    const btn = e.target.closest('.light-tone-btn');
    if (!btn) return;
    const tone = btn.dataset.tone;
    if (_selectedLightTone === tone) {
      _selectedLightTone = null;
      btn.classList.remove('is-selected');
    } else {
      _selectedLightTone = tone;
      document.querySelectorAll('#light-tone-chooser .light-tone-btn').forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
    }
  });

  document.getElementById('light-witness-btn').addEventListener('click', () => {
    witnessLight(todayStr);
    _lightWitnessedThisSession = true;
    saveState();
    renderTemple();
    renderLightModal();
    const invEl = document.getElementById('light-invitation');
    if (invEl) {
      invEl.textContent = _selectedLightTone
        ? (LIGHT_TONE_CONFIRMATIONS[_selectedLightTone] || invEl.textContent)
        : 'The threshold is crossed.';
    }
    const btn = document.getElementById('light-witness-btn');
    if (btn) btn.classList.add('is-still');
    setTimeout(() => {
      const b = document.getElementById('light-witness-btn');
      if (b) b.classList.remove('is-still');
    }, 3000);
  });

  // --- Mind domain modal ---
  registerMindModal();
  registerConfirmModal();

  // --- Body domain modal ---
  registerBodyModal();
  document.getElementById('temple-goto-body')?.addEventListener('click', openBodyModal);

  // --- Water domain modal ---
  registerWaterModal();
  document.getElementById('temple-goto-water')?.addEventListener('click', openWaterModal);

  // --- Today Plan ---
  document.getElementById('today-plan-intentions')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === 'toggle') { toggleTodayIntention(id); renderTodayPlan(); }
    else if (action === 'delete') { deleteIntention(id); renderTodayPlan(); }
  });

  document.getElementById('today-plan-carryover-list')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === 'bring-forward') {
      if (getTodayPlan().intentions.length >= 3) return;
      bringForwardIntention(id);
      renderTodayPlan();
    } else if (action === 'let-pass') {
      letIntentionPass(id);
      renderTodayPlan();
    }
  });

  document.getElementById('today-plan-add-btn')?.addEventListener('click', () => {
    if (getTodayPlan().intentions.length >= 3) {
      const limitEl = document.getElementById('today-plan-limit');
      if (limitEl) limitEl.hidden = false;
      return;
    }
    document.getElementById('today-plan-add-wrap').hidden = true;
    document.getElementById('today-plan-add-form').hidden = false;
    document.getElementById('today-plan-input')?.focus();
  });

  function _confirmAddIntention() {
    const input = document.getElementById('today-plan-input');
    const text = input ? input.value : '';
    if (text.trim()) {
      const result = addTodayIntention(text);
      if (result.ok) {
        if (input) input.value = '';
        document.getElementById('today-plan-add-form').hidden = true;
        renderTodayPlan();
        return;
      }
    }
    document.getElementById('today-plan-add-form').hidden = true;
    document.getElementById('today-plan-add-wrap').hidden = false;
  }

  document.getElementById('today-plan-input-confirm')?.addEventListener('click', _confirmAddIntention);
  document.getElementById('today-plan-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); _confirmAddIntention(); }
    if (e.key === 'Escape') {
      document.getElementById('today-plan-add-form').hidden = true;
      document.getElementById('today-plan-add-wrap').hidden = false;
    }
  });
  document.getElementById('today-plan-input-cancel')?.addEventListener('click', () => {
    document.getElementById('today-plan-add-form').hidden = true;
    renderTodayPlan();
  });

  document.getElementById('today-plan-open-list')?.addEventListener('click', e => {
    const item = e.target.closest('[data-open-action]');
    if (!item) return;
    const action = item.dataset.openAction;
    if (action === 'care') switchTab('care');
    else if (action === 'chronicle') switchTab('chronicle');
    else if (action === 'sleep') openSleepModal();
    else if (action === 'work') openWorkFlow();
  });

  // --- Morning Flow ---
  registerMorningFlow();
  document.getElementById('temple-morning-flow')?.addEventListener('click', openMorningFlow);

  // --- Work Flow ---
  registerWorkFlow();
  document.getElementById('temple-work-flow')?.addEventListener('click', openWorkFlow);

  // --- Night Flow ---
  registerNightFlow();
  document.getElementById('temple-night-flow')?.addEventListener('click', openNightFlow);

  // Schedule reminders if already enabled
  if (state.reminders.enabled && 'Notification' in window && Notification.permission === 'granted') {
    scheduleReminders();
  }

  if (isClosedForToday()) openSleepModal();

  // Activate the initial Today tab through the same code path as tab switching.
  // Pane starts without 'active' in HTML so this add triggers the same display:none→block
  // transition, layout reflow, and paneEnter animation that switchTab uses, fixing the
  // iOS PWA position:fixed blank-space bug on first launch.
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.tab[data-tab="today"]')?.classList.add('active');
  window.scrollTo(0, 0);
  document.getElementById('pane-today')?.classList.add('active');
  renderTodayPlan();

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
