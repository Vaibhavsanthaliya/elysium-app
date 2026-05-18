import { state, todayStr, saveState } from '../state.js';
import { formatTime12 } from '../utils.js';
import { showToast } from '../ui/toast.js';
import { getChronicleNote, upsertChronicleNote } from '../domains/chronicle.js';

const PROMPTS = [
  'What did today ask of you?',
  'A moment worth keeping.',
  'What held your attention?',
  'How did the ritual feel?',
  'What would you tell tomorrow?',
  'Was anything different today?',
  'What deserves to be remembered?',
];

const DAYS  = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function formatDriftDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAYS[dt.getDay()]} ${d} ${MONTHS[m - 1]}`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
    el.innerHTML = '<p class="chronicle-drift-empty">No earlier entries yet.</p>';
    return;
  }

  if (riverHd) riverHd.hidden = false;

  const ago = getYearAgoEntry();
  const MAX = 3;
  let shown = 0;
  let html = '';

  if (ago) {
    html += `<div class="chronicle-drift-ago">
      <div class="chronicle-drift-ago-label">A year ago today</div>
      <div class="chronicle-drift-entry">
        <div class="chronicle-drift-date">${formatDriftDate(ago.dateStr)}</div>
        <div class="chronicle-drift-body">${escapeHtml(ago.note.body)}</div>
      </div>
    </div>`;
    shown++;
  }

  for (const [dateStr, note] of entries) {
    if (shown >= MAX) break;
    if (ago && dateStr === ago.dateStr) continue;
    html += `<div class="chronicle-drift-entry">
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

  textarea.value = note ? note.body : '';
  if (promptEl) promptEl.textContent = PROMPTS[new Date().getDay()];

  if (note && note.updatedAt) {
    const d = new Date(note.updatedAt);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    status.textContent = `Saved · ${formatTime12(`${hh}:${mm}`)}`;
  } else {
    status.textContent = 'No entry yet';
  }

  if (driftEl) renderDrift(driftEl);
}

export function saveChronicleNote() {
  const body = document.getElementById('chronicle-textarea').value.trim();
  upsertChronicleNote(todayStr, body);
  saveState();
  renderChronicle();
  showToast(body ? 'Chronicle saved' : 'Entry cleared');
}
