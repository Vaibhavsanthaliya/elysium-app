import { todayStr, saveState } from '../state.js';
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

export function renderChronicle() {
  const note = getChronicleNote(todayStr);
  const textarea = document.getElementById('chronicle-textarea');
  const status = document.getElementById('chronicle-status');
  const promptEl = document.getElementById('chronicle-prompt-q');

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
}

export function saveChronicleNote() {
  const body = document.getElementById('chronicle-textarea').value.trim();
  upsertChronicleNote(todayStr, body);
  saveState();
  renderChronicle();
  showToast(body ? 'Chronicle saved' : 'Entry cleared');
}
