# Elysium — Project Handoff Guide

This file is the authoritative context document for every Claude session working on this codebase. Read it before inspecting any source file or making any change.

---

## 1 · App overview

Elysium is a quiet ritual operating system — a calm daily companion for keeping personal domains without turning them into productivity dashboards, wellness SaaS, or self-optimization scorecards. It evolved from a vanilla JavaScript skincare tracker PWA, and that origin remains protected as the Care domain. The approach is strictly incremental: each ticket adds one small, reversible layer on top of the existing app. This is never a rewrite. Legacy Care behavior, storage compatibility, and existing user data must continue to work correctly after every change.

---

## 2 · Architecture

- Vanilla JavaScript — no framework, no build step, no bundler
- CDN-loaded Supabase (`@supabase/supabase-js` via `esm.sh`)
- Static deployment on Vercel
- Single-page app: tab-pane navigation managed by `switchTab(name)`
- Dark/light mode via `prefers-color-scheme` media query
- PWA: service worker for offline support and home screen install
- All markup in one file (`index.html`). Styles split into `css/` directory by feature area. JS logic in `js/` module tree (entry: `main.js`).

---

## 3 · Core files

| File | Role |
|---|---|
| `index.html` | All markup — auth screens, tab panes, nav |
| `css/base.css` | CSS custom properties (tokens), reset, `html`/`body` base |
| `css/layout.css` | App shell, header, tab bar, boot shell |
| `css/components.css` | Shared UI components (hero card, task list, info card, toast) + global EA-20/23 overrides |
| `css/settings.css` | Settings tab components + EA-19 polish |
| `css/modal.css` | Modal system, field inputs, buttons, past-day modal |
| `css/cycle.css` | Cycle tab components |
| `css/chronicle.css` | Chronicle tab components |
| `css/progress.css` | Progress tab — stats, calendar, photos, milestones |
| `css/today.css` | Today/Care tab overrides |
| `css/auth.css` | Auth screen — all five views, full EA-25 redesign |
| `css/temple.css` | Temple tab — ritual domain entry screen |
| `sw.js` | Service worker — cache shell, offline fallback, notification click |
| `manifest.json` | PWA manifest — name, icons, display mode |
| `vercel.json` | Vercel deployment configuration |

---

## 4 · State and storage

### localStorage

Key: `skincare_app_v1` — **do not change** (see Hard Constraints).

The entire app state is a single JSON blob written to this key. On load it passes through `mergeDefaults()` then `migrateState()` to inject any new keys and sanitize existing ones.

**`DEFAULT_DATA` shape:** see `js/constants.js` for the authoritative current shape. The original Care/chronicle keys were defined at EA-6; domain keys (`light`, `sleep`, `mind`, `body`, `water`) were added incrementally. When adding new state keys: add to `DEFAULT_DATA` in `js/constants.js` (auto-injected by `mergeDefaults`) and add a sanity check in `migrateState`.

### Supabase

- Table: `user_data`
- Columns: `user_id` (PK), `data` (JSONB), `updated_at`
- **Schema must not change.** The JSONB `data` column accepts arbitrary nested keys — new state fields do not require schema migrations.
- Sync behavior on sign-in (`syncFromSupabase`): `loggedDays` and `checks` are union-merged so no progress is lost. Cloud is source of truth for tasks and settings. After merge, `migrateState` is re-run and renders refresh.
- Writes are debounced via `scheduleSaveToSupabase`; an immediate flush runs on `visibilitychange` (hidden) and `pagehide`.

### IndexedDB

- Database: `skin-photos-v1`
- Used exclusively for weekly skin photo binary data.
- The `weeklyPhotos` array in state holds metadata (`id`, `date`, `label`) only.
- **Do not touch this store.** Photo logic is isolated in `openPhotoDb`, `savePhotoData`, `getPhotoData`, `removePhotoData`, `clearAllPhotoData`.

---

## 5 · Critical functions

| Function | Role |
|---|---|
| `loadState()` | Reads localStorage, applies `mergeDefaults` + `migrateState`, returns state |
| `mergeDefaults(obj, defaults)` | Recursive merge — injects missing DEFAULT_DATA keys into saved state without overwriting existing values |
| `migrateState(s)` | Defensive validation and sanitization of every state field; called on load and after Supabase sync |
| `saveState()` | Writes state to localStorage, schedules debounced Supabase flush |
| `syncFromSupabase()` | Fetches cloud state on sign-in; union-merges progress; cloud wins for tasks/settings |
| `flushToSupabase()` | Immediate Supabase write — called on page hide and unload |
| `advanceCycleIfNeeded()` | Auto-advances `cycleDay` based on days elapsed since `lastCycleDate` |
| `getMilestoneStage(daysSinceStart)` | Returns the passive season index for Stars display without mutating state |
| `switchTab(name)` | Activates tab pane, deactivates others, calls tab-specific render function |
| `showToast(msg)` | Displays a brief toast notification overlay |
| `uid()` | Generates a short random ID for new tasks |

---

## 6 · Hard constraints

1. Do not change `STORAGE_KEY` unless there is an explicitly approved migration plan.
2. Do not change the Supabase schema (`user_data` table, column names, or types).
3. Do not touch the IndexedDB store name (`skin-photos-v1`) or its object store structure.
4. Do not change skincare task IDs (`m1`, `m2`, `m3`, `n1`–`n8`, `h1`–`h3`) or the default task text.
5. Do not change the 3-day cycle logic (`cycleDay` 0/1/2, `advanceCycleIfNeeded`).
6. Do not change milestone thresholds (14 → stage 1, 28 → stage 2, 56 → stage 3).
7. Only change `CACHE_NAME` in `sw.js` when HTML/CSS/JS caching freshness requires a deliberate version bump.
8. Do not introduce frameworks, build tooling, or npm runtime dependencies unless explicitly approved. Browser-native ES modules (`import`/`export`, `type="module"`) are approved and in use as of EA-29A.
9. Do not add inline styles. All styling goes in the appropriate `css/` file.
10. JS logic lives in the `js/` module tree established by EA-29A. The entry point is `main.js`. Do not collapse modules back into a monolith. The module tree is: `js/constants.js`, `js/utils.js`, `js/state.js`, `js/sync.js`, `js/domains/`, `js/services/`, `js/render/`, `js/ui/`. No module may exceed ~350–400 lines without explicit architecture approval.
11. CSS is organized under `css/` by feature area. The load order in `index.html` must be preserved exactly: `base → layout → settings → modal → components → cycle → chronicle → progress → today → auth → temple`. Reordering breaks cascade dependencies. Do not create new CSS files without explicit approval.

---

## 7 · Design and tone

### Obsidian Temple design reference — read before any UI ticket

The canonical design reference for all UI and visual work lives in:

```
design/obsidian-temple/README.md          — visual goal, what is allowed, what is forbidden
design/obsidian-temple/design-system.md   — exact tokens, typography, component patterns
design/obsidian-temple/implementation-map.md — current app vs concept, gap table, suggested tickets
```

These files are derived from the interactive prototype at `/Users/macm92/Downloads/elysium-app-concept/`. **Use the concept folder as the design ground truth, not previous EA ticket approximations.** Any ticket that deviates from concept values must justify the deviation explicitly.

Latest ritual philosophy references should also be included in future UI/design prompts when available:

```
Elysium - Ritual Philosophy.html
philosophy-presentation.jsx
philosophy-sketches.jsx
```

### Continuity Constitution — read before any continuity, memory, resurfacing, or temporal-atmosphere ticket

The binding philosophical reference for all work touching continuity, memory, persistence, resurfacing, or temporal atmosphere lives in:

```
docs/continuity-constitution.md  — 27 articles, six binding tests, prohibited directions
```

The constitution is doctrinal, not advisory. Any continuity proposal must pass the **Six Tests** in §27.2 (felt-not-read, no-counter, reversibility, silence, non-actionable, productivity-app). Failing any one is sufficient grounds for rejection. When the constitution and a proposal disagree, the proposal is wrong. The constitution supersedes contradicting instructions in tickets and prompts unless it is itself amended.

### Visual

Apple-like, calm, premium. Follow existing spacing, border-radius, and shadow conventions. System CSS variable values (both modes) are authoritative in `css/base.css`.

**Elysium semantic tokens (aliases over system vars):**

| Token | Meaning |
|---|---|
| `--obsidian` | Deep near-black — strong surfaces, headings |
| `--marble` | Pure white / dark card surface |
| `--ivory` | Warm off-white — subtle fills, input backgrounds |
| `--bronze` | Warm metallic accent — icons, highlights |
| `--ember` | Flame/streak colour — maps to `--orange` |
| `--temple-surface` | Page-level background (alias: `--bg`) |
| `--ritual-surface` | Card/module surface (alias: `--bg-elevated`) |
| `--oracle-text` | Primary body text (alias: `--label`) |
| `--muted-text` | Secondary/supporting text (alias: `--label-secondary`) |
| `--divine-accent` | Interactive accent, links, rings (alias: `--tint`) |

New UI work should reference Elysium tokens where appropriate. Do not reference raw system variables in new component styles.

### Copy and tone

- Use **ritual** not routine, **chronicle** not journal, **temple** not home, **cycle** not schedule.
- Oracle, marble, bronze, ivory vocabulary is appropriate.
- Premium and restrained. One sentence is better than two.
- Do not use fantasy game UI language, dramatic lore, or Zeus/lightning imagery.
- No exclamation points in UI copy.

---

## 8 · Completed EA ticket log

Full implementation notes for every ticket: [`docs/ticket-log.md`](docs/ticket-log.md)

Recent tickets (EA-1 through EA-94 archived in ticket-log.md):

| Ticket | Summary |
|---|---|
| EA-95 | Sleep First-Light Reciprocity — `getDailyLine()` gains first-light branch: yesterday closed + today open + before 11am → `”The night has passed.”` |
| EA-96 | Identity Surface Reset — manifest, README, SW comment/cache, package lock name describe Elysium as quiet ritual OS. |
| EA-97 | Dead Code / Architecture Cleanup — unused JS exports/imports/constants and orphaned CSS rollback selectors removed. |
| EA-98 | Milestone Reframe — automatic milestone progression and task injection removed; passive Stars season framing retained. |
| EA-99 | Cycle / Sleep / Mind Philosophical Fixes — Cycle legend removed; astrolabe breath slowed 2.5s; Sleep reminder surface removed; Mind hides End session until 60s. |
| EA-100 | Mechanical Cleanup — orphaned constants/rules removed; `saveSleepModal()` Temple inconsistency fixed; SW cache → `elysium-v15`. |
| EA-101 | First Continuity Primitive — Light yesterday’s witness linger: `is-linger` marks at opacity 0.18 rendered before today’s marks in `renderLightModal()`. |
| EA-102 | Sedimentary Phase I — Mind reflection on Temple card; yesterday sleep note in Sleep modal; `”The room has waited.”` quiet-stretch branch; Chronicle Drift age-keyed fade. SW → `elysium-v17`. |
| EA-103 | Resonance Infrastructure — coordinate imprinting on chronicle/sleep/mind entries; Well repetition floor; Well age labels; anti-deduction day-rotation; greeting silence-hardening. SW → `elysium-v18`. |
| EA-104 | Cross-Domain Well v1 — deep-time pool unions Chronicle + Sleep + Mind; source-ambiguous; repetition floor keyed `source:date`. SW → `elysium-v19`. |
| EA-105 | Well Resonance Hardening — session-cached candidate; rarity gates; date-phase deep-time selection; stricter Sleep/Mind coordinate gates. SW → `elysium-v20`. |
| EA-107 | Lifetime Warmth Coefficient — render-time decaying warmth coefficient lifts `--temple-grad-alpha` baseline from existing presence days. SW → `elysium-v21`. |
| EA-108 | Phase III Calibration — `TEMPLE_WARMTH_MAX_ALPHA_LIFT` raised `0.0100 → 0.0240`; sub-perceptual at daily scale, barely perceptible after ~12 months. SW → `elysium-v22`. |
| EA-109 | Body Domain Activation — `Returned` CTA; `{at, period}` arrival entries; horizon marks; `state.body.arrivals` union sync; feeds warmth coefficient. SW → `elysium-v23`. |
| EA-110 | Water Domain Activation — `Held` CTA; `state.water.holdings` deduped by minute; surface-line horizon marks; yesterday linger; feeds warmth coefficient. SW → `elysium-v24`. |
| EA-111 | Temple Restraint & Architectural Compression - removed Temple count meta, unified dormant labels, rebuilt Body atmospheric field with yesterday linger circles, and removed the 21-bar Care rhythm ribbon. SW -> `elysium-v25`. |
| EA-112 | Temple Vertical Rhythm Cleanup - tightened Temple home spacing around the featured Care card, secondary path stack, secondary nav, and bottom spacer so Body/Water read as part of one continuous path stack. SW -> `elysium-v26`. |
| EA-113 | Temple Secondary Card Visual Consistency Pass - reduced secondary-card elevation, stabilized muted state labels, tightened text rhythm and Mind inscription. SW -> `elysium-v27`. |
| EA-115 | Care Surface Modernization — removed the "State" KV pair from the care meta-row, removed the "Cycle of three nights" heading from the cycle strip, softened morning state copy, and removed dead `.care-cycle-head` CSS. SW -> `elysium-v28`. |
| EA-116 | Featured Care Card Atmospheric Refinement — removed medallion outer glow (both modes), removed dark-mode featured card bronze halo shadow, reduced featured-status font-size 18px → 16px. Radius confirmed correct at 20px (`--radius-2xl`). SW -> `elysium-v29`. |
| EA-117 | Mind Inscription Calibration — raised `.temple-mind-line` from 11.5px/0.62 opacity to 12px/0.75 opacity so the reflection inscription registers as perceptibly present rather than below threshold. SW -> `elysium-v30`. |
| EA-118 | Stars Day Record Quieting — removed `past-day-state-line` (redundant status label) and `past-day-chronicle-label` ("Chronicle" source label) from Day record modal; removed dead `#star-field-meta` and `#milestone-stage-meta` IDs from HTML and their null-guarded DOM writes from `progress.js`; removed dead CSS rules for both elements. SW -> `elysium-v31`. |
| EA-120 | Body Return Rituals — added `BODY_RITUALS` (28 hardcoded physical-return ritual strings) to `constants.js`; added `getBodyRitual()` to `body.js` (deterministic hourly selection, no state); added `.body-ritual` inscription field to Body modal HTML and CSS (Spectral italic, muted); `openBodyModal()` populates the field at open time. SW → `elysium-v32`. |
| EA-121 | Water Utility Expansion — added `WATER_RITUALS` (28 environmental-contact ritual strings) to `constants.js`; added `getWaterRitual()` to `water.js` (deterministic hourly selection, no state); added `.water-ritual` inscription field to Water modal HTML and CSS (Spectral italic, muted); `openWaterModal()` populates the field at open time. SW → `elysium-v33`. |
| EA-122 | Sleep Closure Rituals — added `SLEEP_RITUALS` (28 permission-giving/release ritual strings) to `constants.js`; added `getSleepRitual()` to `sleep.js` (deterministic hourly selection, no state); added `.sleep-ritual` inscription field to Sleep modal HTML and CSS (Spectral italic, muted, 13px/0.72 opacity — quieter than Body/Water); `openSleepModal()` populates the field at open time (State A only). SW → `elysium-v34`. |
| EA-123 | Mind Gathering Rituals — added `MIND_RITUALS` (28 attention-gathering ritual strings) to `constants.js`; added `getMindRitual()` to `mind.js` (deterministic hourly selection, no state); added `.mind-ritual` inscription field to Mind modal HTML and CSS (Spectral italic, muted, 13px/0.70 opacity, positioned between sub and duration selector); `openMindModal()` populates the field at open time. SW → `elysium-v35`. |
| EA-124 | Meridian Mark — replaced Aperture mark with Meridian (vertical gnomon + pip at top) in boot-shell and auth-screen SVGs; added `favicon.svg` (Meridian, bronze on transparent, dark/light via `prefers-color-scheme`); added CSS reveal animation to auth mark (ring → gnomon → pip, sub-second, reduced-motion safe); updated `ASSETS` list and SW → `elysium-v36`. |
| EA-125 | Chronicle Ritualization Foundation — added `CHRONICLE_PROMPTS` (28 reflective fragments) to `constants.js`; added `.chronicle-prompt` card (dashed bronze border, Spectral italic prompt, JetBrains Mono time-of-day eyebrow, day-of-year rotation) above the textarea; added `.chronicle-continuity` fragment (4 qualitative room-voice cases, no numbers, constitutionally sound) below status; typography refinements (line-height 1.65, placeholder opacity 0.5); Mood row omitted — forbidden by Continuity Constitution §10.1/§20.12. SW → `elysium-v37`. |
| EA-126 | Chronicle Memory Resurfacing — added a small hidden `.chronicle-resurfaced` card that renders one Chronicle-only excerpt selected deterministically by 7/14/30-day anchors, then nearest older note; labels stay qualitative and non-actionable, Drift excludes the surfaced date, no new state or migration was needed. SW → `elysium-v38`. |
| EA-127 | Sleep Closure Ritual — replaced the Sleep note-first modal with passive closure invitations, removed visible bedtime and anti-check copy, new closures save a simple `closed: true` mark while old bedtime/note entries remain valid, and Temple Sleep empty state now reads `Open`. SW → `elysium-v39`. |

| EA-128 | Mind Gathering Ritual - replaced timer/duration-first Mind UX with Gathering/Holding/Inscribing ritual states; new typed ritual content is ephemeral, while a simple `mind.arrivals` mark records presence for Temple continuity. SW -> `elysium-v40`. |
| EA-129 | Water Contact Ritual — added `WATER_CONTACT_INVITATIONS` (5 strings) to `constants.js`; added `getWaterContactInvitation()` to `water.js` (deterministic day-of-year selection, no state); replaced static `water-sub` paragraph with dynamic `.water-invitation` (ID: `water-invitation`) in HTML; styled `.water-invitation` as Spectral italic 16px center-aligned in `temple.css`; increased `water-surface-wrap` bottom margin 28px → 32px; `openWaterModal()` now populates invitation at open time. SW → `elysium-v41`. |
| EA-130 | Body Return Ritual — added `BODY_SOMATIC_INVITATIONS` (7 sets of 3–5 short imperative somatic phrases) to `constants.js`; added `getBodySomaticInvitations()` to `body.js` (deterministic day-of-year set selection, no state); added `div#body-somatic-list` to Body modal HTML between `.body-sub` and `.body-ritual`; styled somatic list with separator-warm borders, mono index glyph (bronze), and sans-serif invitation text in `temple.css`; added `renderBodySomaticInvitations()` to `modals.js` called on `openBodyModal()`. SW → `elysium-v42`. |
| EA-131 | Ritual Domain Review & Convergence — removed orphaned `SLEEP_RITUALS` + `getSleepRitual()` (stranded when EA-127 rebuilt Sleep modal) and `MIND_RITUALS` + `getMindRitual()` (stranded when EA-128 rebuilt Mind modal); removed 5 dead Mind session functions (`getTodaySession`, `getSessionHeldMs`, `formatHeldMs`, `beginMindSession`, `endMindSession`) left over from the pre-EA-128 timer model; removed verbatim duplicate entry from `WATER_RITUALS` that was identical to a `BODY_RITUALS` entry. SW → `elysium-v43`. |
| EA-133 | Light Opening Ritual — replaced sky-gradient/sun/cursor scene with airy threshold surface; added `LIGHT_OPENING_INVITATIONS` (7 strings) and `getLightOpeningInvitation()` (deterministic day-of-year); modal rebuilt with static `LIGHT / OPENING` eyebrow, Spectral italic invitation, thin bronze threshold line, and witness marks; button changed "I'm here" → "Entered"; Temple card state "Unseen"/"period label" → "Open"/"Entered"; domain sub "witness" → "open"; click handler simplified to Body/Water pattern. SW → `elysium-v44`. |
| EA-136 | Sleep Closure Rotation — expanded `SLEEP_CLOSURE_INVITATIONS` 5 → 16 entries; `getSleepClosureInvitations()` now selects 4 items deterministically by day-of-year offset (same date = same set, next day shifts by 1). No state/HTML/CSS changes. SW → `elysium-v46`. |
| EA-135 | Temple Morning Orientation Line — added `TEMPLE_PERIOD_ORIENTATION` map (7 period-keyed fallback phrases) to `js/render/temple.js`; `getDailyLine()` now accepts `periodKey` and returns the period-keyed phrase when no earned daily line is active; call site in `renderTemple()` passes `period.key`; all earned-state priority preserved. SW → `elysium-v45`. |
| EA-137 | Temple Daily Rhythm — domain section heading becomes period-keyed ("This morning", "The day is moving", "As the day turns", etc.); each domain card receives `data-rhythm="now|kept|later"` derived from current period + domain completion state; CSS `order` floats `now` cards to top, `kept` to middle, `later` to bottom; `now` cards get a slightly warmer bronze border; Care hero copy switches to morning status ("Morning awaits." / "Morning in motion." / "Morning kept.") during first-light and morning periods. No new state, no migration, Care cycle logic untouched. SW → `elysium-v47`. |
| EA-138 | Ritual Utility Refinement Batch — preserved Sleep's deterministic 4-line nightly closure rotation with an optional date parameter for verification; added modal-only repeated-contact rhythm lines for Water/Body from existing same-day arrays; clarified Body Temple copy to `jaw · shoulders · breath`; confirmed EA-131 cleanup already removed orphaned Sleep/Mind ritual infrastructure and duplicate Water copy. No new state or migration, Care logic untouched. SW → `elysium-v48`. |
| EA-139 | Mind Reflection Readability — `saveMindReflection()` now saves inscriptions to `state.mind.sessions` (durationMinutes: 1, completed: true) when mind-complete is clicked; "Threads kept nearby" section renders last 3 entries in State A using existing `getMindReflectionEntries()`; `temple-mind-line` updates immediately after save; overflow-y: auto on mind-modal-sheet; Spectral italic thread bodies clamped to 2 lines; mono date meta labels. No new state keys, no DEFAULT_DATA change, no migrateState change, Care untouched. SW → `elysium-v49`. |
| EA-140 | Daily Closing Summary — `div.temple-closing` added to Temple HTML between the domain list and secondary-nav; `renderTempleClosing(periodKey)` in `temple.js` shows only during `dusk`/`night` when Sleep is not yet closed; renders qualitative room-state phrases ("Care still waits.", "Chronicle is still open.", "Sleep has not closed.", "Light was entered.", "The thread was gathered.", "Body returned.", "Water was held.") drawn from existing domain state with no new state or imports; two CSS classes (--open oracle-text 0.80, --kept muted-text 0.65) provide gentle hierarchy; section silently hides when Sleep closes or period shifts to morning. SW → `elysium-v50`. |
| EA-141 | Day Thread — `div.temple-day-thread` added between domain list and Closing Summary; `deriveTodayTraces()` + `renderDayThread()` in `temple.js` collect up to 8 completed ritual trace strings from today's state (Light, Care morning, Water×count, Body×count, Mind, Chronicle, Night Care, Sleep) and render as Spectral italic lines; `renderTempleClosing()` stripped of its "kept" items (now covered by Day Thread), leaving Closing Summary focused on open evening items only. SW → `elysium-v51`. |

---

## 9 · Ticket workflow

Every future Claude session working on an EA ticket must follow these steps in order:

1. **Read this file first.** Do not inspect source files or propose changes before reading `CLAUDE.md`.
2. **For any UI/design ticket, read the Obsidian Temple design reference before proposing changes:**
   - `design/obsidian-temple/README.md`
   - `design/obsidian-temple/design-system.md`
   - `design/obsidian-temple/implementation-map.md`
3. **For any continuity, memory, resurfacing, or temporal-atmosphere ticket, read the Continuity Constitution before proposing changes:**
   - `docs/continuity-constitution.md`
   - The proposal must pass the Six Tests in §27.2 (felt-not-read, no-counter, reversibility, silence, non-actionable, productivity-app). Failing any one is grounds for rejection.
4. **Read relevant source files.** Inspect only the files and sections relevant to the ticket scope.
3. **Propose before editing.** List exact changes (copy strings, function signatures, HTML structure) and wait for explicit user approval. Do not apply any edit before approval is given.
4. **Keep changes small and reversible.** One concern per ticket. Do not refactor surrounding code, add speculative features, or clean up unrelated sections.
5. **After implementation, provide:**
   - Changed files table
   - Exact diff summary per file
   - Confirmation checklist (state shape, constraints, no regressions)
   - Manual smoke test checklist
6. **Update the ticket log** after each completed ticket: add a one-line summary row to section 8 of this file, and a full implementation-notes row to `docs/ticket-log.md`.
