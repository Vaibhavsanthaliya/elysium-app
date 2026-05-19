import { CYCLE_NAMES, CYCLE_DESC } from '../constants.js';
import { isValidReminderTime } from '../utils.js';
import { state, saveState } from '../state.js';
import { showToast } from '../ui/toast.js';

let reminderTimers = [];

export function clearScheduledReminders() {
  reminderTimers.forEach(t => clearTimeout(t));
  reminderTimers = [];
}

export function updateNotifStatus() {
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

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (isIOS && !isStandalone) {
    hint.textContent = 'On iOS, install this to your Home Screen first to enable notifications. Tap Share → Add to Home Screen.';
  }
}

export async function toggleNotifications(enable) {
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
    showToast('Practice cues on');
    saveState();
    scheduleReminders();
    fireNotification('Practice cues on', 'Your ritual cues are active.', 'skin-reminders-enabled');
  } else {
    state.reminders.enabled = false;
    clearScheduledReminders();
    showToast('Practice cues off');
    saveState();
  }
  updateNotifStatus();
}

export function scheduleReminders() {
  clearScheduledReminders();
  if (!('Notification' in window) || !state.reminders.enabled || Notification.permission !== 'granted') return;

  scheduleNextFor(state.reminders.morningTime, 'Morning care ritual', 'Time to wash your face and apply sunscreen ☀', 'skin-morning');
  scheduleNextFor(state.reminders.nightTime, () => `Tonight — ${CYCLE_NAMES[state.cycleDay]}`, () => `Cycle day ${state.cycleDay + 1}: ${CYCLE_DESC[state.cycleDay]}`, 'skin-night');
  scheduleNextFor(state.reminders.checkInTime, 'Evening cue', 'Did you complete your ritual today? Tap to log.', 'skin-checkin');
}

export async function fireNotification(titleStr, bodyStr, tag) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const opts = {
    body: bodyStr,
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag,
    requireInteraction: false,
  };
  try {
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
