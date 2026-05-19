import { state, todayStr, saveState } from '../state.js';
import { formatTime12 } from '../utils.js';
import { getChronicleNote, upsertChronicleNote } from '../domains/chronicle.js';

const CHRONICLE_PROMPT = 'What asked something of you today?';
const CHRONICLE_AUTOSAVE_DELAY = 800;
const DRIFT_MAX = 12;

const DAYS  = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
let chronicleSaveTimer = null;
let chronicleDirty = false;

function formatDriftDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAYS[dt.getDay()]} ${d} ${MONTHS[m - 1]}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function quietClass(index) {
  if (index >= 9) return ' is-faint';
  if (index >= 6) return ' is-quieter';
  if (index >= 3) return ' is-quiet';
  return '';
}

function getPastEntries() {
  const notes = state.chronicle?.notes || {};
  return Object.entries(notes)
    .filter(([d]) => d !== todayStr)
    .sort((a, b) => b[0].localeCompare(a[0]));
}

function getYearAgoEntry() {
  const notes = state.chronicle?.notes || {};
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return notes[key] ? { dateStr: key, note: notes[key] } : null;
}

function renderDrift(el) {
  const riverHd = document.getElementById('chronicle-river-hd');
  const entries = getPastEntries();

  if (entries.length === 0) {
    if (riverHd) riverHd.hidden = true;
    el.innerHTML = '';
    return;
  }

  if (riverHd) riverHd.hidden = false;

  const ago = getYearAgoEntry();
  let shown = 0;
  let html = '';

  if (ago) {
    html += `<div class="chronicle-drift-ago">
      <div class="chronicle-drift-ago-label">A year ago today</div>
      <div class="chronicle-drift-entry${quietClass(shown)}">
        <div class="chronicle-drift-date">${formatDriftDate(ago.dateStr)}</div>
        <div class="chronicle-drift-body">${escapeHtml(ago.note.body)}</div>
      </div>
    </div>`;
    shown++;
  }

  for (const [dateStr, note] of entries) {
    if (shown >= DRIFT_MAX) break;
    if (ago && dateStr === ago.dateStr) continue;
    html += `<div class="chronicle-drift-entry${quietClass(shown)}">
      <div class="chronicle-drift-date">${formatDriftDate(dateStr)}</div>
      <div class="chronicle-drift-body">${escapeHtml(note.body)}</div>
    </div>`;
    shown++;
  }

  el.innerHTML = html;
}

export function renderChronicle() {
  const note = getChronicleNote(todayStr);
  const textarea = document.getElementById('chronicle-textarea');
  const status = document.getElementById('chronicle-status');
  const promptEl = document.getElementById('chronicle-prompt-q');
  const driftEl = document.getElementById('chronicle-drift');

  if (textarea && !chronicleDirty) textarea.value = note ? note.body : '';
  if (promptEl) promptEl.textContent = CHRONICLE_PROMPT;

  if (status) {
    if (chronicleDirty) {
      status.textContent = '';
      status.hidden = true;
    } else if (note && note.updatedAt) {
      const d = new Date(note.updatedAt);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      status.textContent = `Saved · ${formatTime12(`${hh}:${mm}`)}`;
      status.hidden = false;
    } else {
      status.textContent = '';
      status.hidden = true;
    }
  }

  if (driftEl) renderDrift(driftEl);
}

export function saveChronicleNote(fromBlur = false) {
  if (!chronicleDirty) return false;
  clearTimeout(chronicleSaveTimer);
  chronicleSaveTimer = null;

  const textarea = document.getElementById('chronicle-textarea');
  if (!textarea) return false;
  const body = fromBlur ? textarea.value.trim() : textarea.value;
  const note = getChronicleNote(todayStr);
  const existingBody = note ? note.body : '';

  chronicleDirty = false;
  if (body === existingBody) {
    if (fromBlur) renderChronicle();
    return false;
  }

  upsertChronicleNote(todayStr, body);
  saveState();

  if (fromBlur) {
    renderChronicle();
  } else {
    const status = document.getElementById('chronicle-status');
    if (status) {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      status.textContent = `Saved · ${formatTime12(`${hh}:${mm}`)}`;
      status.hidden = false;
    }
  }
  return true;
}

export function scheduleChronicleAutosave() {
  chronicleDirty = true;
  const status = document.getElementById('chronicle-status');
  if (status) {
    status.textContent = '';
    status.hidden = true;
  }
  clearTimeout(chronicleSaveTimer);
  chronicleSaveTimer = setTimeout(() => saveChronicleNote(), CHRONICLE_AUTOSAVE_DELAY);
}

export function flushPendingChronicleSave() {
  if (!chronicleDirty) return false;
  return saveChronicleNote(true);
}
