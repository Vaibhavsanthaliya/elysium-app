import { state, saveState, todayStr } from '../state.js';
import { CARE_PROTOCOL_NOTES } from '../constants.js';
import { witnessLight, getLastWitness, getLightOpeningInvitation } from '../domains/light.js';
import { getChronicleNote, upsertChronicleNote } from '../domains/chronicle.js';
import { getSleepClosureInvitations, getSleepEntry, saveSleepClosure } from '../domains/sleep.js';
import { keepMorningProtocol, keepNightProtocol } from '../render/today.js';
import {
  getMorningCareState,
  getCareTurnState,
  getCareCycleLabel,
  renderTemple,
  queueTempleTrace,
} from '../render/temple.js';
import { arriveMind } from '../domains/mind.js';
import { arriveBody, getBodySomaticInvitations } from '../domains/body.js';
import { holdWater, getWaterResetSteps } from '../domains/water.js';

const FLOW_TONE_CONFIRMATIONS = {
  Soft: 'A soft morning.',
  Clear: 'A clear morning.',
  Steady: 'A steady morning.',
  Guarded: 'A guarded morning.',
};

const MORNING_STEPS = ['light', 'care', 'chronicle', 'complete'];
const NIGHT_STEPS   = ['night-care', 'night-chronicle', 'night-sleep', 'night-complete'];
const WORK_STEPS    = ['work-mind', 'work-body', 'work-water', 'work-complete'];

let _flowActive = false;
let _flowSession = 0;
let _selectedTone = null;
let _lightEnteredThisFlow = false;
let _workBodyStep = 0;
let _workBodyInvitations = [];
let _workWaterStep = 0;
let _workWaterSteps = [];

function beginFlowSession() {
  _flowActive = true;
  _flowSession++;
  return _flowSession;
}

function isCurrentFlowSession(session) {
  return _flowActive && session === _flowSession;
}

function showStep(name) {
  [...MORNING_STEPS, ...NIGHT_STEPS, ...WORK_STEPS].forEach(s => {
    const el = document.getElementById(`flow-step-${s}`);
    if (el) el.hidden = s !== name;
  });
}

function closeFlowModal() {
  _flowActive = false;
  _flowSession++;
  document.getElementById('flow-modal').hidden = true;
  renderTemple();
}

// ── Morning Flow renderers ────────────────────────────────────────────────────

function renderLightStep() {
  _selectedTone = null;
  document.querySelectorAll('#flow-tone-chooser .flow-tone-btn').forEach(b => b.classList.remove('is-selected'));

  const alreadyEntered = !!getLastWitness(todayStr);
  const invEl = document.getElementById('flow-light-invitation');
  const enterBtn = document.getElementById('flow-light-enter');
  const skipBtn = document.getElementById('flow-light-skip');
  const toneChooser = document.getElementById('flow-tone-chooser');

  if (alreadyEntered) {
    if (invEl) invEl.textContent = 'The morning was already named.';
    if (enterBtn) { enterBtn.hidden = true; enterBtn.classList.remove('is-still'); }
    if (toneChooser) toneChooser.hidden = true;
    if (skipBtn) { skipBtn.hidden = false; skipBtn.textContent = 'Continue'; }
  } else {
    if (invEl) invEl.textContent = getLightOpeningInvitation();
    if (enterBtn) { enterBtn.hidden = false; enterBtn.classList.remove('is-still'); }
    if (toneChooser) toneChooser.hidden = false;
    if (skipBtn) { skipBtn.hidden = false; skipBtn.textContent = 'Skip'; }
  }
}

function renderCareStep() {
  const careState = getMorningCareState();
  const statusEl = document.getElementById('flow-care-status');
  const openBtn = document.getElementById('flow-care-open');
  const skipBtn = document.getElementById('flow-care-skip');

  if (statusEl) {
    if (careState === 'kept') statusEl.textContent = 'Morning care is already kept.';
    else if (careState === 'motion') statusEl.textContent = 'Morning care is in motion.';
    else statusEl.textContent = 'Morning awaits.';
  }

  if (openBtn) openBtn.hidden = (careState === 'kept');
  if (skipBtn) skipBtn.textContent = careState === 'kept' ? 'Continue' : 'Skip';
}

function renderMorningChronicleStep() {
  const field = document.getElementById('flow-chronicle-field');
  if (!field) return;
  const existing = getChronicleNote(todayStr);
  field.value = existing ? existing.body : '';
}

export function openMorningFlow() {
  beginFlowSession();
  _lightEnteredThisFlow = false;
  renderLightStep();
  showStep('light');
  document.getElementById('flow-modal').hidden = false;
}

// ── Night Flow renderers ──────────────────────────────────────────────────────

function renderNightCareStep() {
  const turnState = getCareTurnState();
  const labelEl  = document.getElementById('flow-night-care-label');
  const protocolEl = document.getElementById('flow-night-care-protocol');
  const noteEl   = document.getElementById('flow-night-care-note');
  const keepBtn  = document.getElementById('flow-night-care-keep');
  const skipBtn  = document.getElementById('flow-night-care-skip');

  if (turnState.key === 'kept') {
    if (labelEl) labelEl.textContent = 'The night has been kept.';
    if (protocolEl) { protocolEl.textContent = ''; protocolEl.hidden = true; }
    if (noteEl) noteEl.hidden = true;
    if (keepBtn) keepBtn.hidden = true;
    if (skipBtn) { skipBtn.hidden = false; skipBtn.textContent = 'Continue'; }
  } else {
    if (labelEl) labelEl.textContent = 'Care';
    if (protocolEl) { protocolEl.textContent = getCareCycleLabel(); protocolEl.hidden = false; }
    if (noteEl) { noteEl.textContent = CARE_PROTOCOL_NOTES[state.cycleDay] || ''; noteEl.hidden = false; }
    if (keepBtn) keepBtn.hidden = false;
    if (skipBtn) { skipBtn.hidden = false; skipBtn.textContent = 'Skip'; }
  }
}

function renderNightChronicleStep() {
  const field = document.getElementById('flow-night-chronicle-field');
  if (!field) return;
  const existing = getChronicleNote(todayStr);
  field.value = existing ? existing.body : '';
}

function renderNightSleepStep() {
  const invEl    = document.getElementById('flow-night-sleep-invitation');
  const parkingEl = document.getElementById('flow-night-sleep-parking');
  const closeBtn = document.getElementById('flow-night-sleep-close');
  const skipBtn  = document.getElementById('flow-night-sleep-skip');

  if (parkingEl) parkingEl.value = '';

  const alreadyClosed = !!getSleepEntry(todayStr);

  if (alreadyClosed) {
    if (invEl) invEl.textContent = 'The day has already closed.';
    if (parkingEl) parkingEl.hidden = true;
    if (closeBtn) closeBtn.hidden = true;
    if (skipBtn) { skipBtn.hidden = false; skipBtn.textContent = 'Continue'; }
  } else {
    const invitations = getSleepClosureInvitations();
    if (invEl) invEl.textContent = invitations[0] || 'Nothing has to be solved before the room goes quiet.';
    if (parkingEl) parkingEl.hidden = false;
    if (closeBtn) closeBtn.hidden = false;
    if (skipBtn) { skipBtn.hidden = false; skipBtn.textContent = 'Skip'; }
  }
}

export function openNightFlow() {
  beginFlowSession();
  renderNightCareStep();
  showStep('night-care');
  document.getElementById('flow-modal').hidden = false;
}

// ── Registration ──────────────────────────────────────────────────────────────

export function registerMorningFlow() {
  document.getElementById('flow-modal-backdrop')?.addEventListener('click', closeFlowModal);

  document.getElementById('flow-tone-chooser')?.addEventListener('click', e => {
    const btn = e.target.closest('.flow-tone-btn');
    if (!btn) return;
    const tone = btn.dataset.tone;
    if (_selectedTone === tone) {
      _selectedTone = null;
      btn.classList.remove('is-selected');
    } else {
      _selectedTone = tone;
      document.querySelectorAll('#flow-tone-chooser .flow-tone-btn').forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
    }
  });

  document.getElementById('flow-light-enter')?.addEventListener('click', () => {
    witnessLight(todayStr);
    _lightEnteredThisFlow = true;
    saveState();
    queueTempleTrace('light');

    const invEl = document.getElementById('flow-light-invitation');
    if (invEl) {
      invEl.textContent = _selectedTone
        ? (FLOW_TONE_CONFIRMATIONS[_selectedTone] || invEl.textContent)
        : 'The threshold is crossed.';
    }

    const enterBtn = document.getElementById('flow-light-enter');
    const skipBtn = document.getElementById('flow-light-skip');
    if (enterBtn) enterBtn.classList.add('is-still');
    if (skipBtn) skipBtn.hidden = true;

    const session = _flowSession;
    setTimeout(() => {
      if (!isCurrentFlowSession(session)) return;
      renderCareStep();
      showStep('care');
    }, 700);
  });

  document.getElementById('flow-light-skip')?.addEventListener('click', () => {
    renderCareStep();
    showStep('care');
  });

  document.getElementById('flow-care-open')?.addEventListener('click', () => {
    keepMorningProtocol();
    renderMorningChronicleStep();
    showStep('chronicle');
  });

  document.getElementById('flow-care-skip')?.addEventListener('click', () => {
    renderMorningChronicleStep();
    showStep('chronicle');
  });

  document.getElementById('flow-chronicle-save')?.addEventListener('click', () => {
    const field = document.getElementById('flow-chronicle-field');
    const body = field ? field.value.trim() : '';
    if (body) {
      upsertChronicleNote(todayStr, body);
      saveState();
    }
    showStep('complete');
  });

  document.getElementById('flow-chronicle-skip')?.addEventListener('click', () => {
    showStep('complete');
  });

  document.getElementById('flow-close')?.addEventListener('click', closeFlowModal);
}

export function registerNightFlow() {
  document.getElementById('flow-night-care-keep')?.addEventListener('click', () => {
    keepNightProtocol();
    renderNightChronicleStep();
    showStep('night-chronicle');
  });

  document.getElementById('flow-night-care-skip')?.addEventListener('click', () => {
    renderNightChronicleStep();
    showStep('night-chronicle');
  });

  document.getElementById('flow-night-chronicle-save')?.addEventListener('click', () => {
    const field = document.getElementById('flow-night-chronicle-field');
    const body = field ? field.value.trim() : '';
    if (body) {
      upsertChronicleNote(todayStr, body);
      saveState();
    }
    renderNightSleepStep();
    showStep('night-sleep');
  });

  document.getElementById('flow-night-chronicle-skip')?.addEventListener('click', () => {
    renderNightSleepStep();
    showStep('night-sleep');
  });

  document.getElementById('flow-night-sleep-close')?.addEventListener('click', () => {
    const parkingEl = document.getElementById('flow-night-sleep-parking');
    const noteText = parkingEl ? parkingEl.value.trim() : '';
    saveSleepClosure(todayStr, noteText);
    saveState();
    queueTempleTrace('sleep');
    showStep('night-complete');
  });

  document.getElementById('flow-night-sleep-skip')?.addEventListener('click', () => {
    showStep('night-complete');
  });

  document.getElementById('flow-night-close')?.addEventListener('click', closeFlowModal);
}

// ── Work Flow renderers ───────────────────────────────────────────────────────

function renderWorkBodyStep() {
  _workBodyInvitations = getBodySomaticInvitations();
  _workBodyStep = 0;
  const stepEl = document.getElementById('flow-work-body-step');
  const continueBtn = document.getElementById('flow-work-body-continue');
  const arriveBtn = document.getElementById('flow-work-body-arrive');
  const skipBtn = document.getElementById('flow-work-body-skip');
  if (stepEl) stepEl.textContent = _workBodyInvitations[0] || '';
  if (continueBtn) continueBtn.hidden = _workBodyInvitations.length <= 1;
  if (arriveBtn) {
    arriveBtn.hidden = _workBodyInvitations.length > 1;
    arriveBtn.classList.remove('is-still');
  }
  if (skipBtn) skipBtn.hidden = false;
}

function renderWorkWaterStep() {
  _workWaterSteps = getWaterResetSteps();
  _workWaterStep = 0;
  const stepEl = document.getElementById('flow-work-water-step');
  const continueBtn = document.getElementById('flow-work-water-continue');
  const holdBtn = document.getElementById('flow-work-water-hold');
  const skipBtn = document.getElementById('flow-work-water-skip');
  if (stepEl) stepEl.textContent = _workWaterSteps[0] || '';
  if (continueBtn) continueBtn.hidden = _workWaterSteps.length <= 1;
  if (holdBtn) {
    holdBtn.hidden = _workWaterSteps.length > 1;
    holdBtn.classList.remove('is-still');
  }
  if (skipBtn) skipBtn.hidden = false;
}

export function openWorkFlow() {
  beginFlowSession();
  const threadEl = document.getElementById('flow-work-thread');
  if (threadEl) threadEl.value = '';
  showStep('work-mind');
  document.getElementById('flow-modal').hidden = false;
}

export function registerWorkFlow() {
  document.getElementById('flow-work-mind-hold')?.addEventListener('click', () => {
    arriveMind(todayStr);
    saveState();
    queueTempleTrace('mind');
    renderWorkBodyStep();
    showStep('work-body');
  });

  document.getElementById('flow-work-mind-skip')?.addEventListener('click', () => {
    renderWorkBodyStep();
    showStep('work-body');
  });

  document.getElementById('flow-work-body-continue')?.addEventListener('click', () => {
    _workBodyStep++;
    const stepEl = document.getElementById('flow-work-body-step');
    const continueBtn = document.getElementById('flow-work-body-continue');
    const arriveBtn = document.getElementById('flow-work-body-arrive');
    if (_workBodyStep >= _workBodyInvitations.length) {
      if (continueBtn) continueBtn.hidden = true;
      if (arriveBtn) arriveBtn.hidden = false;
    } else {
      if (stepEl) stepEl.textContent = _workBodyInvitations[_workBodyStep];
    }
  });

  document.getElementById('flow-work-body-arrive')?.addEventListener('click', () => {
    arriveBody(todayStr);
    saveState();
    queueTempleTrace('body');
    const stepEl = document.getElementById('flow-work-body-step');
    if (stepEl) stepEl.textContent = 'The body has returned.';
    const arriveBtn = document.getElementById('flow-work-body-arrive');
    if (arriveBtn) arriveBtn.hidden = true;
    const skipBtn = document.getElementById('flow-work-body-skip');
    if (skipBtn) skipBtn.hidden = true;
    const session = _flowSession;
    setTimeout(() => {
      if (!isCurrentFlowSession(session)) return;
      renderWorkWaterStep();
      showStep('work-water');
    }, 700);
  });

  document.getElementById('flow-work-body-skip')?.addEventListener('click', () => {
    renderWorkWaterStep();
    showStep('work-water');
  });

  document.getElementById('flow-work-water-continue')?.addEventListener('click', () => {
    _workWaterStep++;
    const stepEl = document.getElementById('flow-work-water-step');
    const continueBtn = document.getElementById('flow-work-water-continue');
    const holdBtn = document.getElementById('flow-work-water-hold');
    if (_workWaterStep >= _workWaterSteps.length) {
      if (continueBtn) continueBtn.hidden = true;
      if (holdBtn) holdBtn.hidden = false;
    } else {
      if (stepEl) stepEl.textContent = _workWaterSteps[_workWaterStep];
    }
  });

  document.getElementById('flow-work-water-hold')?.addEventListener('click', () => {
    holdWater(todayStr);
    queueTempleTrace('water');
    const stepEl = document.getElementById('flow-work-water-step');
    if (stepEl) stepEl.textContent = 'The pause has been held.';
    const holdBtn = document.getElementById('flow-work-water-hold');
    if (holdBtn) holdBtn.hidden = true;
    const skipBtn = document.getElementById('flow-work-water-skip');
    if (skipBtn) skipBtn.hidden = true;
    const session = _flowSession;
    setTimeout(() => {
      if (!isCurrentFlowSession(session)) return;
      showStep('work-complete');
    }, 700);
  });

  document.getElementById('flow-work-water-skip')?.addEventListener('click', () => {
    showStep('work-complete');
  });

  document.getElementById('flow-work-close')?.addEventListener('click', closeFlowModal);
}
