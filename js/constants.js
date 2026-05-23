export const STORAGE_KEY = 'skincare_app_v1';
export const SUPABASE_URL = 'https://rqkxxqweqijyiaktjylc.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxa3h4cXdlcWlqeWlha3RqeWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2ODg4MTYsImV4cCI6MjA5MzI2NDgxNn0.okMqlpfHqGqp2OJg-4hWwg5dAVDmrIJsXrPyNNh6q7M';

export const DEFAULT_DATA = {
  startDate: null,
  cycleDay: 0,
  lastCycleDate: null,
  milestoneStage: 0,
  loggedDays: [],
  checks: {},
  comfortMode: false,
  tasks: {
    morning: [
      { id: 'm1', text: 'Salicylic acid face wash', comfortSafe: true },
      { id: 'm2', text: 'Re\'equil Ultra Matte SPF 50 sunscreen', comfortSafe: true },
      { id: 'm3', text: 'Wait 5–10 min, dab excess with tissue' },
    ],
    night: {
      0: [
        { id: 'n1', text: 'Face wash' },
        { id: 'n2', text: 'Niacinamide serum (pea-sized)' },
        { id: 'n3', text: 'Light moisturizer' },
      ],
      1: [
        { id: 'n4', text: 'Face wash' },
        { id: 'n5', text: 'Salicylic acid serum (pea-sized)' },
        { id: 'n6', text: 'Light moisturizer' },
      ],
      2: [
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
    checkInTime: '21:00',
  },
  weeklyPhotos: [],
  chronicle: {
    notes: {},
  },
  light: {
    entries: {},
  },
  sleep: {
    entries: {},
  },
  mind: {
    sessions: [],
  },
};

export const CYCLE_NAMES = ['Niacinamide', 'Salicylic', 'Rest night'];
export const TASK_INFO = {
  m1: {
    title: 'Salicylic acid face wash',
    what: 'BHA cleanser that dissolves inside pores, removes excess oil, and keeps breakouts from forming.',
    how: 'Pea-sized amount. Lather for 30–60 seconds, then rinse fully.',
    skip: 'Your skin feels tight or dry after using it — start with once daily.',
  },
  m2: {
    title: 'SPF 50 sunscreen',
    what: 'UV rays worsen post-acne marks and slow healing. SPF is the single most impactful daytime step.',
    how: 'Two finger-lengths for face and neck. Apply last, after all other steps.',
    skip: 'Never skip it — even indoors, UV comes through windows.',
  },
  m3: {
    title: 'Wait after sunscreen',
    what: 'Chemical sunscreens need time to bind with skin before they protect you.',
    how: 'Wait 5–10 minutes before stepping out. Dab excess gently with a tissue — don\'t rub.',
    skip: 'Never skip the wait on sunny days.',
  },
  n1: {
    title: 'Face wash (evening)',
    what: 'Removes sunscreen residue, oil, and pollution from the day.',
    how: 'Use the same salicylic face wash. 30–60 seconds, then rinse.',
    skip: 'Rarely — always cleanse when you\'ve worn sunscreen.',
  },
  n2: {
    title: 'Niacinamide serum',
    what: 'Controls oil and fades post-acne marks (PIH). One of the safest actives for daily use.',
    how: 'Pea-sized amount. Press gently into skin — don\'t rub. Apply before moisturizer.',
    skip: 'If stinging persists after a week, try every other night instead.',
  },
  n3: {
    title: 'Light moisturizer',
    what: 'Keeps your skin barrier intact so actives penetrate better and irritation stays low.',
    how: 'Thin layer after serums. Light gel or lotion formulas work best with this routine.',
    skip: 'Skin is actively broken out — use the lightest formula you have.',
  },
  n4: {
    title: 'Face wash (evening)',
    what: 'Removes sunscreen residue, oil, and pollution from the day.',
    how: 'Use the same salicylic face wash. 30–60 seconds, then rinse.',
    skip: 'Rarely — always cleanse when you\'ve worn sunscreen.',
  },
  n5: {
    title: 'Salicylic acid serum',
    what: 'Exfoliates inside pores and targets active breakouts. More concentrated than the face wash.',
    how: 'Pea-sized, on affected areas or T-zone only. Not all over the face.',
    skip: 'Skin feels dry or red — skip to a rest night and come back to it.',
  },
  n6: {
    title: 'Light moisturizer',
    what: 'Keeps your skin barrier intact so actives penetrate better and irritation stays low.',
    how: 'Thin layer after serums. Light gel or lotion formulas work best with this routine.',
    skip: 'Skin is actively broken out — use the lightest formula you have.',
  },
  n7: {
    title: 'Face wash (rest night)',
    what: 'Even on rest nights, cleansing removes the day\'s buildup before it sits on skin overnight.',
    how: 'Gentle rinse, 30 seconds. No actives tonight.',
    skip: 'Rarely — only if you already washed your face within the last hour or two.',
  },
  n8: {
    title: 'Moisturizer only',
    what: 'Rest night lets your skin recover from the week\'s actives without piling on more.',
    how: 'Slightly more moisturizer than usual is fine tonight.',
    skip: 'Never — this rest is intentional. Skipping actives is the point.',
  },
  h1: {
    title: 'Water intake',
    what: 'Dehydration makes skin produce more oil to compensate, worsening breakouts.',
    how: '2.5–3L spread through the day. Starting with a large glass each morning helps.',
    skip: 'Heavy exercise or heat — drink even more.',
  },
  h2: {
    title: 'No touching or picking',
    what: 'Hands carry bacteria. Picking spreads infection and causes scarring that takes months to fade.',
    how: 'If you must touch your face, wash hands first. The urge passes — the scar doesn\'t.',
    skip: 'There is no exception here.',
  },
  h3: {
    title: 'Pillowcase hygiene',
    what: 'A used pillowcase reapplies oils, bacteria, and product residue to your face for 7–8 hours.',
    how: 'Flip after night 1, replace after night 2. A clean towel on top works too.',
    skip: 'You\'ve had a completely clean face, clean hair, and no sweating.',
  },
};

export const PHOTO_DB_NAME = 'skin-photos-v1';
export const PHOTO_STORE   = 'photos';
