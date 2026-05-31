import { state } from '../state.js';
import { escapeHtml } from '../utils.js';
import { searchChronicleEntries } from '../domains/chronicle.js';

const ARCHIVE_EXCERPT_LEN = 90;
const SNIPPET_BEFORE = 40;
const SNIPPET_AFTER  = 60;

const DAYS   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

let chronicleMode = 'write';
let archiveEventsInitialized = false;
let searchQuery = '';

export function getChronicleMode() {
  return chronicleMode;
}

function formatArchiveDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAYS[dt.getDay()]} ${d} ${MONTHS[m - 1]} ${y}`;
}

function archiveExcerpt(body) {
  const firstLine = body.split('\n').find(l => l.trim());
  const text = (firstLine || body).trim();
  if (text.length <= ARCHIVE_EXCERPT_LEN) return text;
  return text.slice(0, ARCHIVE_EXCERPT_LEN).trimEnd() + '…';
}

function buildSearchExcerpt(body, query) {
  const lq = query.trim().toLowerCase();
  const lb = body.toLowerCase();
  const matchAt = lb.indexOf(lq);
  if (matchAt === -1) return escapeHtml(archiveExcerpt(body));

  const qLen   = query.trim().length;
  const start  = Math.max(0, matchAt - SNIPPET_BEFORE);
  const end    = Math.min(body.length, matchAt + qLen + SNIPPET_AFTER);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < body.length ? '…' : '';
  const snippet = prefix + body.slice(start, end) + suffix;
  const mIdx   = prefix.length + (matchAt - start);

  const sBefore = escapeHtml(snippet.slice(0, mIdx));
  const sMatch  = escapeHtml(snippet.slice(mIdx, mIdx + qLen));
  const sAfter  = escapeHtml(snippet.slice(mIdx + qLen));
  return `${sBefore}<mark class="chronicle-search-match">${sMatch}</mark>${sAfter}`;
}

function renderArchiveList() {
  const listEl = document.getElementById('chronicle-archive-list');
  if (!listEl) return;
  const entries = searchChronicleEntries(searchQuery);
  if (entries.length === 0) {
    const msg = searchQuery.trim() ? 'Nothing returned.' : 'Nothing has been left yet.';
    listEl.innerHTML = `<p class="chronicle-archive-empty">${escapeHtml(msg)}</p>`;
    return;
  }
  const hasQuery = searchQuery.trim().length > 0;
  listEl.innerHTML = entries.map(([dateStr, note]) =>
    `<button class="chronicle-archive-row" data-date="${escapeHtml(dateStr)}" type="button">
      <div class="chronicle-archive-row-date">${formatArchiveDate(dateStr)}</div>
      <div class="chronicle-archive-row-excerpt">${
        hasQuery
          ? buildSearchExcerpt(note.body, searchQuery)
          : escapeHtml(archiveExcerpt(note.body))
      }</div>
    </button>`
  ).join('');
}

function openArchiveEntry(dateStr) {
  const notes = state.chronicle?.notes || {};
  const note = notes[dateStr];
  if (!note) return;
  const metaEl  = document.getElementById('chronicle-detail-meta');
  const bodyEl  = document.getElementById('chronicle-detail-body');
  const archiveEl = document.getElementById('chronicle-archive');
  const detailEl  = document.getElementById('chronicle-archive-detail');
  if (metaEl)  metaEl.textContent  = formatArchiveDate(dateStr);
  if (bodyEl)  bodyEl.textContent  = note.body;
  if (archiveEl) archiveEl.hidden  = true;
  if (detailEl)  detailEl.hidden   = false;
}

function closeArchiveDetail() {
  const archiveEl = document.getElementById('chronicle-archive');
  const detailEl  = document.getElementById('chronicle-archive-detail');
  if (detailEl)  detailEl.hidden  = true;
  if (archiveEl) archiveEl.hidden = false;
  renderArchiveList();
}

export function setChronicleMode(mode) {
  chronicleMode = mode;
  const writeEl   = document.getElementById('chronicle-write-surface');
  const archiveEl = document.getElementById('chronicle-archive');
  const detailEl  = document.getElementById('chronicle-archive-detail');
  const writeBtnEl = document.getElementById('chronicle-mode-write');
  const readBtnEl  = document.getElementById('chronicle-mode-read');

  if (mode === 'read') {
    if (writeEl)    writeEl.hidden   = true;
    if (archiveEl)  archiveEl.hidden = false;
    if (detailEl)   detailEl.hidden  = true;
    if (writeBtnEl) writeBtnEl.classList.remove('is-active');
    if (readBtnEl)  readBtnEl.classList.add('is-active');
    renderArchiveList();
  } else {
    searchQuery = '';
    const searchEl = document.getElementById('chronicle-search');
    if (searchEl) searchEl.value = '';
    if (writeEl)    writeEl.hidden   = false;
    if (archiveEl)  archiveEl.hidden = true;
    if (detailEl)   detailEl.hidden  = true;
    if (writeBtnEl) writeBtnEl.classList.add('is-active');
    if (readBtnEl)  readBtnEl.classList.remove('is-active');
  }
}

export function renderArchiveListIfActive() {
  const detailEl = document.getElementById('chronicle-archive-detail');
  if (detailEl && !detailEl.hidden) return;
  renderArchiveList();
}

export function initChronicleArchiveEvents() {
  if (archiveEventsInitialized) return;
  archiveEventsInitialized = true;

  document.getElementById('chronicle-mode-write')
    ?.addEventListener('click', () => setChronicleMode('write'));
  document.getElementById('chronicle-mode-read')
    ?.addEventListener('click', () => setChronicleMode('read'));
  document.getElementById('chronicle-detail-back')
    ?.addEventListener('click', closeArchiveDetail);
  document.getElementById('chronicle-archive-list')
    ?.addEventListener('click', e => {
      const row = e.target.closest('[data-date]');
      if (row) openArchiveEntry(row.dataset.date);
    });
  document.getElementById('chronicle-search')
    ?.addEventListener('input', e => {
      searchQuery = e.target.value;
      renderArchiveList();
    });
}
