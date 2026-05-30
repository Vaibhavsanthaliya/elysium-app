import { state, today, todayStr } from '../state.js';
import { escapeHtml } from '../utils.js';
import {
  normalizeTodayPlanIfNeeded,
  getTodayPlan,
  getCarryoverCandidates,
  getMorningSleepHandoff,
  dismissSleepHandoff,
} from '../domains/today-plan.js';
import { getCareTurnState, getCareCycleLabel, getMorningCareState, getPeriodKey } from './temple.js';
import { getSleepEntry } from '../domains/sleep.js';
import { hasMindArrival, getMindOffload, clearMindOffload } from '../domains/mind.js';
import { hasArrivedToday } from '../domains/body.js';
import { hasHeldToday } from '../domains/water.js';

const _MASTHEAD_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const _MASTHEAD_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const _PERIOD_WORDS = {
  'first-light': 'Morning', 'morning': 'Morning',
  'midday': 'Midday', 'afternoon': 'Midday',
  'golden-hour': 'Evening', 'dusk': 'Evening',
  'night': 'Night',
};

function renderMasthead() {
  const el = document.getElementById('today-plan-date');
  if (!el) return;
  el.textContent = `${_MASTHEAD_DAYS[today.getDay()]} · ${today.getDate()} ${_MASTHEAD_MONTHS[today.getMonth()]}`;
}

function renderIntentions() {
  const list = document.getElementById('today-plan-intentions');
  const addWrap = document.getElementById('today-plan-add-wrap');
  const addForm = document.getElementById('today-plan-add-form');
  const limitMsg = document.getElementById('today-plan-limit');
  if (!list) return;

  const { intentions } = getTodayPlan();
  const full = intentions.length >= 3;

  if (!intentions.length) {
    list.innerHTML = '<p class="today-plan-empty">Place one thing here.</p>';
  } else {
    list.innerHTML = intentions.map(i => `
      <div class="today-plan-intention${i.kept ? ' is-kept' : ''}" data-id="${escapeHtml(i.id)}">
        <button class="today-plan-mark" data-action="toggle" data-id="${escapeHtml(i.id)}" aria-label="${i.kept ? 'Unmark' : 'Mark kept'}">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
            ${i.kept
              ? `<circle cx="8" cy="8" r="6" fill="currentColor"/>
                 <polyline points="5 8 7 10 11 6" stroke="var(--bg)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`
              : `<circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.5"/>`
            }
          </svg>
        </button>
        <span class="today-plan-text">${escapeHtml(i.text)}</span>
        <button class="today-plan-release" data-action="delete" data-id="${escapeHtml(i.id)}" aria-label="Release">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/>
          </svg>
        </button>
      </div>
    `).join('');
  }

  if (addWrap) addWrap.hidden = full;
  if (addForm && full) { addForm.hidden = true; }
  if (limitMsg) limitMsg.hidden = !full;
}

function renderCarryover() {
  const section = document.getElementById('today-plan-carryover');
  const list = document.getElementById('today-plan-carryover-list');
  if (!section || !list) return;

  const candidates = getCarryoverCandidates();
  if (!candidates.length) {
    section.hidden = true;
    return;
  }

  list.innerHTML = candidates.map(item => `
    <div class="today-plan-carryover-item">
      <span class="today-plan-carryover-text">${escapeHtml(item.text)}</span>
      <div class="today-plan-carryover-actions">
        <button class="today-plan-forward-btn" data-action="bring-forward" data-id="${escapeHtml(item.id)}">Bring forward</button>
        <button class="today-plan-pass-btn" data-action="let-pass" data-id="${escapeHtml(item.id)}">Let it pass</button>
      </div>
    </div>
  `).join('');

  section.hidden = false;
}

function renderOpenItems() {
  const list = document.getElementById('today-plan-open-list');
  if (!list) return;

  const periodKey = getPeriodKey();
  const isMorning = periodKey === 'first-light' || periodKey === 'morning';
  const isMidday  = periodKey === 'midday' || periodKey === 'afternoon';

  const hasChronicle = !!(state.chronicle?.notes?.[todayStr]?.body);
  const hasSleep = !!getSleepEntry(todayStr);

  let items;

  if (isMorning) {
    const morningState = getMorningCareState();
    const morningKept   = morningState === 'kept';
    const morningMotion = morningState === 'motion';
    items = [
      {
        action: 'care',
        kept: morningKept,
        text: morningKept   ? 'Care · morning kept'
            : morningMotion ? 'Care · morning in motion'
                            : 'Care · morning open',
      },
      {
        action: 'chronicle',
        kept: hasChronicle,
        text: hasChronicle ? 'Chronicle · held today' : 'Chronicle · still open',
      },
    ];
  } else if (isMidday) {
    const workKept = hasMindArrival(todayStr) && hasArrivedToday() && hasHeldToday();
    items = [
      {
        action: 'work',
        kept: workKept,
        text: workKept ? 'Focus · held' : 'Focus · return to focus',
      },
      {
        action: 'chronicle',
        kept: hasChronicle,
        text: hasChronicle ? 'Chronicle · held today' : 'Chronicle · still open',
      },
    ];
  } else {
    // evening / night / golden-hour — closing items
    const careState = getCareTurnState();
    const careKept   = careState.key === 'kept';
    const careMotion = careState.key === 'motion';
    const careLabel  = getCareCycleLabel();
    items = [
      {
        action: 'care',
        kept: careKept,
        text: careKept   ? `Care · ${careLabel} kept`
            : careMotion ? `Care · ${careLabel} in motion`
                         : `Care · ${careLabel}`,
      },
      {
        action: 'chronicle',
        kept: hasChronicle,
        text: hasChronicle ? 'Chronicle · held today' : 'Chronicle · still open',
      },
      {
        action: 'sleep',
        kept: hasSleep,
        text: hasSleep ? 'Sleep · closed' : 'Sleep · not closed',
      },
    ];
  }

  const periodEl = document.getElementById('today-plan-open-period');
  if (periodEl) periodEl.textContent = _PERIOD_WORDS[periodKey] || '';

  list.innerHTML = items.map(item => `
    <div class="today-plan-open-item${item.kept ? ' is-kept' : ''}" data-open-action="${item.action}" title="${escapeHtml(item.text)}" aria-label="${escapeHtml(item.text)}">
      <span class="today-plan-open-text">${escapeHtml(item.text)}</span>
      <svg class="today-plan-open-chevron" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="5 3 11 8 5 13"/>
      </svg>
    </div>
  `).join('');
}

function renderMindThread() {
  const section = document.getElementById('today-mind-thread');
  const textEl = document.getElementById('today-mind-thread-text');
  if (!section || !textEl) return;

  const offload = getMindOffload(todayStr);
  if (!offload) {
    section.hidden = true;
    return;
  }

  textEl.textContent = offload.text;
  section.hidden = false;

  const releaseBtn = document.getElementById('today-mind-thread-release');
  if (releaseBtn) {
    releaseBtn.onclick = () => {
      clearMindOffload();
      section.hidden = true;
    };
  }
}

function renderSleepHandoff() {
  const section = document.getElementById('today-sleep-handoff');
  const textEl = document.getElementById('today-sleep-handoff-text');
  const dismissBtn = document.getElementById('today-sleep-handoff-dismiss');
  if (!section || !textEl) return;

  const note = getMorningSleepHandoff();
  if (!note) {
    section.hidden = true;
    return;
  }

  textEl.textContent = note;
  section.hidden = false;

  if (dismissBtn) {
    dismissBtn.onclick = () => {
      dismissSleepHandoff();
      section.hidden = true;
    };
  }
}

export function renderTodayPlan() {
  normalizeTodayPlanIfNeeded();
  renderMasthead();
  renderMindThread();
  renderSleepHandoff();
  renderIntentions();
  renderCarryover();
  renderOpenItems();
}
