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
  body: {
    arrivals: {},
  },
  water: {
    holdings: {},
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

export const BODY_RITUALS = [
  'Rest your hands. Let your next exhale be a full one. Stay there for a moment.',
  'Feel the weight of your feet on the floor. They have been there the whole time.',
  'Find the farthest point you can see. Look there for a little while.',
  'Unclench your jaw. Let your tongue rest on the floor of your mouth.',
  'Before returning to the screen — one breath in, then a slower breath out.',
  'Notice where you are holding tension. You don\'t need to release it — just locate it.',
  'Close your eyes. Feel the absence of the screen. This is also real.',
  'Open your hands. Spread your fingers flat. Let them rest.',
  'Put both palms flat on the surface in front of you. Feel its temperature. Breathe once.',
  'Let your shoulders drop. They have been up.',
  'Soften your gaze. Look at nothing in particular.',
  'Roll your head gently to one side, then the other. No further than it wants to go.',
  'You don\'t have to do anything right now. Just notice that you are breathing.',
  'Sit back for a moment. The work will be there.',
  'Look away from everything you need to read. Just look.',
  'Take your wrists off the edge of the desk. Let your arms hang for a moment.',
  'Let a breath go that you have been holding without knowing it.',
  'Notice how your weight rests. The chair is holding you.',
  'Let your eyes go soft. Nothing needs to be sharp right now.',
  'Notice if your brow is furrowed. Let it soften.',
  'Breathe out first. The rest follows.',
  'Find one part of your body that is not tense. Start there.',
  'Look at something that is not a screen. Stay with it.',
  'Press your feet into the floor. Feel the ground push back.',
  'Drop your shoulders on the exhale. They do not need to carry anything right now.',
  'Your body is not where your mind has been. Take a moment to return.',
  'Close your eyes. What remains is still here.',
  'Clench your hands once, fully. Then open them.',
];

export const WATER_RITUALS = [
  'Notice the temperature of what you are holding. Stay with it for a moment.',
  'Your mouth. When did you last drink something? That is also useful to know.',
  'The surface in front of you — feel its texture for a moment. You have been somewhere else entirely.',
  'Something in front of you reflects the light. You may not have noticed.',
  'Your hands have been at work. Rest them on the surface for a moment.',
  'Notice if the room feels dry. Your body already knew.',
  'A drink, taken slowly. The temperature of it is the point.',
  'Before returning to what you were doing, feel the weight of where you are.',
  'Notice if you have been holding your breath. You probably have.',
  'What sound is closest right now? Let it be the only thing for a moment.',
  'The light from the nearest window is different from the screen. Notice it.',
  'Notice how dry or wet your lips feel. Something is always trying to say something.',
  'The nearest cold surface. Put your hand on it.',
  'Something in this room is not a task. Find it.',
  'Notice where your hands are resting right now.',
  'Drink, or don\'t — but notice first. That is the pause.',
  'The desk, the cup, the light — these are also where you are.',
  'Something cooler than your hands. Notice it.',
  'The air. What temperature is it? You have not thought about it in a while.',
  'Your eyes have been near. Let them look at something far.',
  'What is at the edge of your space? Something is always there.',
  'Water, when you touch it, has a temperature. That is all.',
  'The quality of the silence — or the noise — you were not listening to it before.',
  'Let your eyes go soft. Nothing needs to be sharp right now.',
  'Notice the weight of your arms where they rest.',
  'The cup or glass nearest you. When did it last move?',
  'Feel the temperature of the air above your screen. It is different.',
  'Before continuing — notice what is still. The room does not hurry.',
];

export const SLEEP_RITUALS = [
  'The day is done. What is unfinished will wait until morning.',
  'Set down what you were carrying. It will be there when you return.',
  'Nothing more is required of you tonight.',
  'The last thought is not a summary. It is just a thought.',
  'You are allowed to be absent for a few hours.',
  'Whatever is unresolved — it belongs to tomorrow now.',
  'The screen can wait. It is good at waiting.',
  'Close the tab that has been open in your mind.',
  'The day has been what it has been. Nothing changes that now.',
  'What you did not finish is not lost. It is just unfinished.',
  'Let the body become heavy. It knows what this means.',
  'The problem will look different in daylight.',
  'You are not required to resolve anything before sleeping.',
  'One breath out. Then another. Then the night.',
  'The room is quiet enough. You can be quiet, too.',
  'Something tomorrow will matter. But not yet.',
  'What you carry into sleep, you will still carry when you wake. Leave it here instead.',
  'The night needs nothing from you.',
  'A last exhale, for the day.',
  'You were here today. That is enough.',
  'Whatever was left unsaid — it can wait.',
  'The morning will come regardless. Let this be the last thought.',
  'The work does not end; you only step away from it.',
  'Slow the pace of the last thing. Let it be the last.',
  'Whatever you are still holding — open your hands.',
  'The account of the day is closed. What remains is the night.',
  'Let the next thought come and go without answering it.',
  'This is where the day is set down.',
];
