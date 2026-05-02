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
  loggedDays: [],
  checks: {}, // { 'YYYY-MM-DD': { taskId: true } }
  tasks: {
    morning: [
      { id: 'm1', text: 'Salicylic acid face wash' },
      { id: 'm2', text: 'Re\'equil Ultra Matte SPF 50 sunscreen' },
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
  },
};

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

// =============== STATE ===============
let state = loadState();
const today = new Date();
const todayStr = ymd(today);

if (!state.startDate) {
  state.startDate = todayStr;
  saveState();
}

// =============== STORAGE ===============
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_DATA));
    const parsed = JSON.parse(raw);
    return mergeDefaults(parsed, DEFAULT_DATA);
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

function mergeDefaults(obj, defaults) {
  if (typeof defaults !== 'object' || defaults === null) return obj ?? defaults;
  if (Array.isArray(defaults)) return Array.isArray(obj) ? obj : defaults;
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

// =============== SUPABASE ===============
let sb = null;
let sbUserId = null;
let sbSaveTimer = null;

function initSupabase() {
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  sb.auth.onAuthStateChange(async (event, session) => {
    sbUserId = session?.user?.id ?? null;
    const authScreen = document.getElementById('auth-screen');
    if (event === 'PASSWORD_RECOVERY') {
      authScreen.hidden = false;
      showAuthView('reset');
      return;
    }
    if (session) {
      authScreen.hidden = true;
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        await syncFromSupabase();
        updateAccountView();
      }
    } else {
      authScreen.hidden = false;
      showAuthView('signin');
    }
  });
}

async function syncFromSupabase() {
  if (!sb || !sbUserId) return;
  try {
    const { data, error } = await sb.from('user_data').select('data').single();
    if (error?.code === 'PGRST116') {
      state = JSON.parse(JSON.stringify(DEFAULT_DATA));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      await sb.from('user_data').insert({ user_id: sbUserId, data: state });
      renderHeader();
      renderTodayCycle();
      renderAllLists();
      return;
    }
    if (error) throw error;
    if (data?.data) {
      state = mergeDefaults(data.data, DEFAULT_DATA);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      renderHeader();
      renderTodayCycle();
      renderAllLists();
    }
  } catch (e) {
    console.warn('Supabase sync failed', e);
  }
}

function scheduleSaveToSupabase() {
  if (!sb || !sbUserId) return;
  clearTimeout(sbSaveTimer);
  sbSaveTimer = setTimeout(async () => {
    try {
      await sb.from('user_data').upsert(
        { user_id: sbUserId, data: state, updated_at: new Date().toISOString() }
      );
    } catch (e) {
      console.warn('Supabase save failed', e);
    }
  }, 800);
}

function updateAccountView() {
  if (!sb) return;
  sb.auth.getUser().then(({ data: { user } }) => {
    const el = document.getElementById('account-email');
    if (el) el.textContent = user?.email ?? '—';
  });
}

// =============== UTILS ===============
function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

function getAllTodayTasks() {
  return [
    ...state.tasks.morning,
    ...getNightTasks(),
    ...state.tasks.habit,
  ];
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.hidden = true, 2200);
}

function formatTime12(t24) {
  if (!t24) return '';
  const [h, m] = t24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
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
  const tasks = section === 'night' ? getNightTasks() : state.tasks[section];
  const checks = getTodayChecks();

  if (!tasks.length) {
    listEl.innerHTML = `<li class="empty-list">No tasks. Tap ＋ to add one.</li>`;
    return;
  }

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item' + (checks[task.id] ? ' done' : '');
    li.innerHTML = `
      <div class="task-check">
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="2.5 6.5 5 9 9.5 3.5"/>
        </svg>
      </div>
      <span class="task-text">${escapeHtml(task.text)}</span>
      <button class="task-edit-btn" aria-label="Edit task" data-edit>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
        </svg>
      </button>
    `;
    li.addEventListener('click', (e) => {
      if (e.target.closest('[data-edit]')) {
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

  let status = 'Let\'s get started';
  if (pct === 100) status = 'All done — well done';
  else if (pct >= 67) status = 'Almost there';
  else if (pct >= 34) status = 'Halfway through';
  else if (pct > 0) status = 'Off to a good start';
  document.getElementById('hero-status').textContent = status;
}

function toggleTask(taskId) {
  const checks = getTodayChecks();
  checks[taskId] = !checks[taskId];

  // Track day completion (morning + night both done)
  const morningDone = state.tasks.morning.length > 0 && state.tasks.morning.every(t => checks[t.id]);
  const nightDone = getNightTasks().length > 0 && getNightTasks().every(t => checks[t.id]);
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
        <span class="cycle-active-badge">Tonight</span>
      </div>
      <div class="cycle-name">${name.split('—')[1].trim()}</div>
      <div class="cycle-steps-text">${CYCLE_DESC[i]}</div>
    `;
    card.addEventListener('click', () => {
      state.cycleDay = i;
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
  while (true) {
    const s = ymd(d);
    if (state.loggedDays.includes(s)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

function renderProgress() {
  const streak = getStreak();
  const logged = state.loggedDays.length;

  // This week (Sun-Sat)
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const thisWeek = state.loggedDays.filter(d => new Date(d + 'T00:00:00') >= weekStart).length;

  const goalProgress = Math.min(streak, 21);

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
    cal.appendChild(cell);
  }

  // Milestones
  const startDate = new Date(state.startDate + 'T00:00:00');
  const daysSinceStart = Math.floor((today - startDate) / 86400000);
  const ml = document.getElementById('milestone-list');
  ml.innerHTML = '';
  MILESTONES.forEach((m, i) => {
    const prevDays = i === 0 ? 0 : MILESTONES[i - 1].days;
    const done = daysSinceStart >= m.days;
    const active = !done && daysSinceStart >= prevDays;
    const row = document.createElement('div');
    row.className = 'milestone-row';
    row.innerHTML = `
      <div class="milestone-dot ${done ? 'done' : active ? 'active' : ''}"></div>
      <div class="milestone-info">
        <div class="milestone-week">${m.weeks}</div>
        <div class="milestone-desc">${m.desc}</div>
      </div>
      ${done ? '<span class="milestone-badge">Reached</span>' : ''}
    `;
    ml.appendChild(row);
  });
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
}

function saveTask() {
  if (!editContext) return;
  const text = document.getElementById('edit-text').value.trim();
  if (!text) { showToast('Task name is required'); return; }

  const newSection = document.getElementById('edit-section').value;
  const cycleVal = document.getElementById('edit-cycle').value;

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
    const task = { id: editContext.task.id, text };
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
    toggle.disabled = true;
    return;
  }

  if (Notification.permission === 'denied') {
    status.textContent = 'Blocked — enable in browser settings';
    toggle.checked = false;
    state.reminders.enabled = false;
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
  if (!('Notification' in window)) return;

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
    scheduleReminders();
  } else {
    state.reminders.enabled = false;
    clearScheduledReminders();
    showToast('Reminders off');
  }
  saveState();
  updateNotifStatus();
}

let reminderTimers = [];

function clearScheduledReminders() {
  reminderTimers.forEach(t => clearTimeout(t));
  reminderTimers = [];
}

function scheduleReminders() {
  clearScheduledReminders();
  if (!state.reminders.enabled || Notification.permission !== 'granted') return;

  scheduleNextFor(state.reminders.morningTime, 'Morning routine', 'Time to wash your face and apply sunscreen ☀');
  scheduleNextFor(state.reminders.nightTime, () => `Tonight — ${CYCLE_NAMES[state.cycleDay]}`, () => `Cycle day ${state.cycleDay + 1}: ${CYCLE_DESC[state.cycleDay]}`);
}

function scheduleNextFor(time24, title, body) {
  const [h, m] = time24.split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(h, m, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);

  const delay = next - now;
  // Cap at 24h to be safe
  if (delay > 86400000) return;

  const t = setTimeout(() => {
    const titleStr = typeof title === 'function' ? title() : title;
    const bodyStr = typeof body === 'function' ? body() : body;
    try {
      new Notification(titleStr, {
        body: bodyStr,
        icon: 'icon-192.png',
        badge: 'icon-192.png',
        tag: 'skin-routine',
        requireInteraction: false,
      });
    } catch {}
    // Reschedule for next day
    scheduleNextFor(time24, title, body);
  }, delay);

  reminderTimers.push(t);
}

// =============== TAB SWITCHING ===============
function switchTab(name) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('pane-' + name).classList.add('active');
  document.querySelector(`.tab[data-tab="${name}"]`).classList.add('active');

  if (name === 'progress') renderProgress();
  if (name === 'cycle') renderCycleList();
  if (name === 'settings') updateSettingsView();
}

// =============== SETTINGS ===============
function updateSettingsView() {
  document.getElementById('morning-time').value = state.reminders.morningTime;
  document.getElementById('night-time').value = state.reminders.nightTime;
  document.getElementById('morning-time-label').textContent = formatTime12(state.reminders.morningTime);
  document.getElementById('night-time-label').textContent = formatTime12(state.reminders.nightTime);
  document.getElementById('start-date-label').textContent = new Date(state.startDate + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
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
      state = mergeDefaults(imported, DEFAULT_DATA);
      saveState();
      renderHeader();
      renderTodayCycle();
      renderAllLists();
      updateSettingsView();
      showToast('Data imported');
    } catch {
      showToast('Could not import file');
    }
  };
  reader.readAsText(file);
}

function resetAll() {
  if (!confirm('Reset everything? This deletes all tasks, progress, and settings.')) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

function resetStartDate() {
  if (!confirm('Reset the routine start date to today?')) return;
  state.startDate = todayStr;
  saveState();
  updateSettingsView();
  renderProgress();
  showToast('Start date reset');
}

// =============== INIT ===============
document.addEventListener('DOMContentLoaded', () => {
  initSupabase();

  renderHeader();
  renderTodayCycle();
  renderAllLists();
  renderCycleList();

  // Tab clicks
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Add buttons
  document.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openAddModal(btn.dataset.section);
    });
  });

  // Modal events
  document.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', closeModal);
  });
  document.getElementById('modal-save').addEventListener('click', saveTask);
  document.getElementById('modal-delete').addEventListener('click', deleteTask);
  document.getElementById('edit-section').addEventListener('change', (e) => handleSectionChange(e.target.value));
  document.getElementById('edit-text').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); saveTask(); }
  });

  // Settings
  document.getElementById('morning-time').addEventListener('change', (e) => {
    state.reminders.morningTime = e.target.value;
    document.getElementById('morning-time-label').textContent = formatTime12(e.target.value);
    saveState();
    if (state.reminders.enabled) scheduleReminders();
    showToast('Morning reminder updated');
  });
  document.getElementById('night-time').addEventListener('change', (e) => {
    state.reminders.nightTime = e.target.value;
    document.getElementById('night-time-label').textContent = formatTime12(e.target.value);
    saveState();
    if (state.reminders.enabled) scheduleReminders();
    showToast('Night reminder updated');
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

  // Auth helpers
  function showAuthView(view) {
    ['signin', 'signup', 'forgot', 'confirm', 'reset'].forEach(v => {
      document.getElementById(`auth-${v}`).hidden = (v !== view);
    });
    document.getElementById('auth-error').hidden = true;
  }

  function showAuthError(msg) {
    const el = document.getElementById('auth-error');
    el.textContent = msg;
    el.hidden = false;
  }

  // Sign in
  document.getElementById('signin-btn').addEventListener('click', async () => {
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;
    if (!email) { showAuthError('Enter your email'); return; }
    if (!password) { showAuthError('Enter your password'); return; }
    const btn = document.getElementById('signin-btn');
    btn.textContent = 'Signing in…';
    btn.disabled = true;
    const { error } = await sb.auth.signInWithPassword({ email, password });
    btn.textContent = 'Sign in';
    btn.disabled = false;
    if (error) { showAuthError(error.message); return; }
  });

  document.getElementById('signin-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('signin-btn').click();
  });

  // Sign up
  document.getElementById('signup-btn').addEventListener('click', async () => {
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    if (!email) { showAuthError('Enter your email'); return; }
    if (password.length < 6) { showAuthError('Password must be at least 6 characters'); return; }
    const btn = document.getElementById('signup-btn');
    btn.textContent = 'Creating account…';
    btn.disabled = true;
    const { error } = await sb.auth.signUp({ email, password });
    btn.textContent = 'Create account';
    btn.disabled = false;
    if (error) { showAuthError(error.message); return; }
    showAuthView('confirm');
  });

  document.getElementById('signup-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('signup-btn').click();
  });

  // Forgot password
  document.getElementById('forgot-btn').addEventListener('click', async () => {
    const email = document.getElementById('forgot-email').value.trim();
    if (!email) { showAuthError('Enter your email'); return; }
    const btn = document.getElementById('forgot-btn');
    btn.textContent = 'Sending…';
    btn.disabled = true;
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.href });
    btn.textContent = 'Send reset link';
    btn.disabled = false;
    if (error) { showAuthError(error.message); return; }
    showToast('Reset link sent — check your email');
    showAuthView('signin');
  });

  document.getElementById('forgot-email').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('forgot-btn').click();
  });

  // Reset password (after clicking email link)
  document.getElementById('reset-btn').addEventListener('click', async () => {
    const password = document.getElementById('reset-password').value;
    if (password.length < 6) { showAuthError('Password must be at least 6 characters'); return; }
    const btn = document.getElementById('reset-btn');
    btn.textContent = 'Updating…';
    btn.disabled = true;
    const { error } = await sb.auth.updateUser({ password });
    btn.textContent = 'Update password';
    btn.disabled = false;
    if (error) { showAuthError(error.message); return; }
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
    await sb.auth.signOut();
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
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
});
