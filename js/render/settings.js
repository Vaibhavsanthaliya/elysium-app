import { DEFAULT_DATA, STORAGE_KEY } from '../constants.js';
import { isValidReminderTime, formatTime12 } from '../utils.js';
import { state, todayStr, saveState, migrateState, mergeDefaults, advanceCycleIfNeeded, updateMilestoneStage } from '../state.js';
import { sb, sbUserId, flushToSupabase } from '../sync.js';
import { deepClone } from '../utils.js';
import { clearAllPhotoData } from '../services/photos.js';
import { updateNotifStatus, scheduleReminders } from '../services/notifications.js';
import { showToast } from '../ui/toast.js';
import { renderHeader, renderTodayCycle } from './common.js';
import { renderAllLists } from './today.js';
import { renderProgress } from './progress.js';

export function updateSettingsView() {
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

export function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `skincare-data-${todayStr}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!imported.tasks) throw new Error('Invalid file');
      const newState = migrateState(mergeDefaults(imported, DEFAULT_DATA));
      if (!newState.startDate) newState.startDate = todayStr;
      // setState not needed here — we mutate state's properties to preserve the live binding
      Object.assign(state, newState);
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

export async function resetAll() {
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

export function resetStartDate() {
  if (!confirm('Reset the ritual start date to today.')) return;
  state.startDate = todayStr;
  state.milestoneStage = 0;
  updateMilestoneStage();
  saveState();
  updateSettingsView();
  renderProgress();
  showToast('Start date reset');
}
