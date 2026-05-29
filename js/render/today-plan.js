import { state, todayStr } from '../state.js';
import { escapeHtml } from '../utils.js';
import {
  normalizeTodayPlanIfNeeded,
  getTodayPlan,
  getCarryoverCandidates,
} from '../domains/today-plan.js';
import { getCareTurnState, getCareCycleLabel, getMorningCareState, getPeriodKey } from './temple.js';
import { getSleepEntry } from '../domains/sleep.js';
import { hasMindArrival } from '../domains/mind.js';
import { hasArrivedToday } from '../domains/body.js';
import { hasHeldToday } from '../domains/water.js';

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
      <div class="today-plan-intention${i.kept ? ' is-kept' : ''}">
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

  list.innerHTML = items.map(item => `
    <div class="today-plan-open-item${item.kept ? ' is-kept' : ''}" data-open-action="${item.action}">
      <span class="today-plan-open-text">${escapeHtml(item.text)}</span>
      <svg class="today-plan-open-chevron" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="5 3 11 8 5 13"/>
      </svg>
    </div>
  `).join('');
}

export function renderTodayPlan() {
  normalizeTodayPlanIfNeeded();
  renderIntentions();
  renderCarryover();
  renderOpenItems();
}
