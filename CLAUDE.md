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

**`DEFAULT_DATA` shape (as of EA-6):**

```js
{
  startDate: null,          // 'YYYY-MM-DD' or null
  cycleDay: 0,              // 0 = niacinamide, 1 = salicylic, 2 = rest
  lastCycleDate: null,      // 'YYYY-MM-DD' — used to detect day changes for auto-advance
  milestoneStage: 0,        // 0 = foundation, 1 = acne control, 2 = marks/texture, 3 = maintenance
  loggedDays: [],           // ['YYYY-MM-DD', ...] — days where morning+night tasks were completed
  checks: {},               // { 'YYYY-MM-DD': { taskId: true } }
  comfortMode: false,       // hides tasks not marked comfortSafe when true
  tasks: {
    morning: [...],         // [{ id, text, comfortSafe? }]
    night: {
      0: [...],             // niacinamide night tasks
      1: [...],             // salicylic night tasks
      2: [...],             // rest night tasks
    },
    habit: [...],           // [{ id, text }] — daily rituals, not cycle-dependent
  },
  reminders: {
    enabled: false,
    morningTime: '08:00',
    nightTime: '22:00',
    checkInTime: '21:00',
  },
  weeklyPhotos: [],         // [{ id, date, label }] — binary image data lives in IndexedDB
  chronicle: {
    notes: {},              // { 'YYYY-MM-DD': { body: string, updatedAt: ISO string } }
  },
}
```

When adding new state keys in future tickets: add to `DEFAULT_DATA` (auto-injected by `mergeDefaults` for existing users) and add a sanity check in `migrateState`.

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
| `renderHeader()` | Updates streak pill and header display |
| `renderTodayCycle()` | Updates the cycle indicator on the Today tab |
| `renderAllLists()` | Re-renders all today task lists (morning, night, habit) |
| `renderCycleList()` | Renders the cycle card list on the Cycle tab |
| `renderTemple()` | Renders the Temple tab read-only summary (ring, status, quick actions) |
| `renderChronicle()` | Renders the Chronicle tab — loads today's note, updates status line |
| `saveChronicleNote()` | Saves or deletes today's note entry, calls `saveState`, shows toast |
| `renderProgress()` | Renders stats grid, calendar, milestones on the Progress tab |
| `renderWeeklyPhotos()` | Loads photo binaries from IndexedDB and renders the photo grid |
| `updateSettingsView()` | Populates Settings tab with current state values |
| `formatTime12(t24)` | Converts `HH:MM` 24h string to `H:MM AM/PM` display string |
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

Apple-like, calm, premium. Follow existing spacing, border-radius, and shadow conventions.

**System CSS variables (both modes):**

| Variable | Light | Dark |
|---|---|---|
| `--bg` | `#f2f2f7` | `#000000` |
| `--bg-elevated` | `#ffffff` | `#1c1c1e` |
| `--label` | `#000000` | `#ffffff` |
| `--label-secondary` | `rgba(60,60,67,.6)` | `rgba(235,235,245,.6)` |
| `--tint` | `#007aff` | `#0a84ff` |
| `--separator` | `rgba(60,60,67,.18)` | `rgba(84,84,88,.6)` |

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

| Ticket | Summary |
|---|---|
| EA-1 | Product blueprint. Analysis only, no code. |
| EA-2 | App renamed to Elysium across manifest, title, auth, footer, SW cache. |
| EA-3 | Elysium design tokens added to `styles.css`. |
| EA-4 | Copy pass: “routine” → “ritual” across visible UI. |
| EA-5 | Temple tab added as read-only home summary. Default active tab. |
| EA-6 | Chronicle tab added. One note/day in `chronicle.notes`. |
| EA-8 | Care module language — 4 copy-only changes. |
| EA-9 | Project renamed to elysium-app on GitHub and Vercel. |
| EA-10 | Temple CSS polish — hero card, ring, bronze accents. |
| EA-11 | Chronicle CSS polish — card, focus ring, textarea, save button. |
| EA-13 | Obsidian Temple foundation tokens — 21 new CSS custom properties. |
| EA-14 | Stacked Medallion layout for Temple tab. CSS-only. |
| EA-15 | Tab bar active state → `--bronze`. CSS-only, one property. |
| EA-16 | Today/Care Obsidian Temple polish. CSS-only. |
| EA-17 | Chronicle Obsidian Temple polish. CSS-only. |
| EA-18 | Progress / Stars Obsidian Temple polish. CSS-only. |
| EA-19 | Settings Obsidian Temple polish. CSS-only. |
| EA-20 | Global atmosphere pass — warm canvas, header glass, task surfaces. CSS-only. |
| EA-21 | Typography identity — DM Sans, Spectral, JetBrains Mono loaded and applied. |
| EA-22 | Temple home concept-card rebuild — featured Care card, medallion ring. |
| EA-23 | Bronze state pass — checkmarks, cycle badge, streak pill, calendar. CSS-only. |
| EA-24 | Dark mode token correction — 18 warm obsidian values. CSS-only. |
| EA-25 | Auth screen Obsidian Temple redesign + Aperture logo. |
| EA-26 | Mobile polish — boot shell, scroll reset, scrollbar hiding, tab bar fix. |
| EA-27 | Modal Obsidian Temple alignment. CSS-only. |
| EA-29A | JS modularization — `app.js` split into 18 ES modules under `js/`. |
| EA-28 | Temple ritual-domain entry screen — 6 domain cards, featured Care card. |
| EA-29B | CSS modularization — `styles.css` split into 11 files under `css/`. |
| EA-30 | Progress Stars/Constellation foundation — star dots, SVG lines, roman milestones. |
| EA-34 | Stars/Progress refinement — all-pairs constellation, stronger glow. |
| EA-33 | Today/Care task surface refinement — separator rows, Spectral headings. CSS-only. |
| EA-32 | Chronicle prompt card — `.chronicle-prompt` dashed card, 7 daily questions. |
| EA-31 | Cycle Astrolabe — 4 concentric rings, 3 node buttons at -90°/30°/150°. |
| EA-35 | Ritual philosophy pass — domain verbs, archetype labels, Chronicle → Drift layout. |
| EA-37 | Global header → compact daily-status rail. CSS + minimal HTML. |
| EA-39 | Progress Photos heading aligned to `.section-hd` pattern. |
| EA-41 | Settings page heading added — mono eyebrow + Spectral italic title. |
| EA-43 | Sleep domain — `sleep.entries` state, `#sleep-modal`, union sync. |
| EA-44 | Light Witness domain — `light.entries` state, `#light-modal`, union sync. |
| EA-46 | Today/Care emoji section icons removed. |
| EA-47 | Today/Care ritual detail — `.care-heading`, mini ring, `.care-cycle-strip`. |
| EA-48 | Sleep + Light modal philosophy redesign — closure ritual, sky gradient. |
| EA-51 | Global streak pill removed from header; Stars streak stat preserved. |
| EA-52 | Stars reframe — KPI grid removed; constellation remains primary; milestones render as one quiet stage line. |
| EA-53 | Care smart-feedback rewrite — Temple/Today status now leads with cycle turn language, not chain-count or productivity copy. |
| EA-54 | Sleep closure enforcement — today’s Sleep entry now closes tab navigation until reopened. |
| EA-55 | Light Witness honesty pass — fake duration figure and placeholder sun footer removed. |
| EA-56 | Chronicle subtractive pass — no visible save button, dirty-guarded autosave on idle/blur, fixed prompt, quieter 12-entry Drift. |
| EA-57 | Care De-Checklist — cycle strip now leads Today/Care; Night is the primary protocol surface; Morning is secondary; Habit tasks are folded into Supporting rituals. |
| EA-58 | Reminders into domains — Settings section renamed to "Practice cues"; row labels use cue language; Sleep modal TONIGHT row relabeled "Night cue"; notification toasts and push title updated. |
| EA-59 | Tab bar consolidation — bottom nav reduced to Temple, Today, Settings; Cycle/Chronicle/Stars removed from bar but remain reachable via Temple cards and secondary nav; Temple stays active as parent tab when hidden panes are open. |
| EA-60 | Mind domain — Session primitive: `mind.sessions` state with migration; `js/domains/mind.js`; Mind Temple card activated; `#mind-modal` three-state (Begin/Holding/Reflection); manual end-session; union sync; Temple card shows `Held · Xm`. |
| EA-62 | Doc sync + dead cleanup: `AGENTS.md` replaced with a short pointer to `CLAUDE.md`; dead `getStreak` and `getMissedDays` exports removed from `js/domains/care.js`; incomplete past Mind sessions pruned in `migrateState`. |
| EA-63 | Decommissioned numeric Care completion: Today and Temple Care surfaces now use three-night cycle-state indicators and protocol/state copy. |
| EA-64 | Past-day Stars modal kept-turn rewrite: historical dates now open a read-only day record with cycle/status context, not task checkboxes. |
| EA-65 | Mind Hold-the-Time: State B now visibly holds elapsed time, end-session is locked for 60 seconds, reflections surface quietly in State A, and Temple Mind uses actual held duration from timestamps. |
| EA-68 | Light Witness Deepening — Temporal Sky: sky gradient dynamically reflects time of day via CSS custom props set from JS; eyebrow changes to `APOLLO · [PERIOD]` (8 light periods); repeat witnessing allowed — button never disabled; Temple Light state shows qualitative period label instead of raw timestamp. |
| EA-69 | Stars Stop Counting — removed `X RECORDED` count and `CURRENT` status indicator; renamed "Ritual stage" section to "Season"; simplified stage line to Spectral italic season title only (no "Stage I of IV" fraction). CSS-only dead rules for `.stage-line-meta`/`.stage-line-separator` removed. |
| EA-70 | Edit/Utility Modal Obsidian Pass — task-info modal: `.task-info-label` → mono bronze eyebrow, `.task-info-text` → Spectral italic `--muted-text`; edit modal: copy pass on field labels, cycle select options, delete button; confirm modal: "Are you sure?" → "Confirm"; JS: "Edit task"/"New task" → "Edit step"/"New step". CSS + copy only, no behavior change. |
| EA-71 | Chronicle Silent-Night Atmosphere — removed `.chronicle-prompt` card block from HTML (question and label gone); textarea `rows="7"` → `rows="2"`; added `field-sizing: content` + `min-height` to `.chronicle-textarea` for natural auto-grow; removed dead `.chronicle-prompt` CSS. Autosave, drift, state, sync untouched. |
| EA-72 | Past-Cycle Chronicle Surfacing — Care night protocol now quietly surfaces the newest prior Chronicle line from the same 3-night protocol, derived at render time with no new state. |
| EA-73 | Past Day Read-Only by Default — Day Record hides correction buttons behind a quiet "correct record" text link; tapping reveals qualifying copy and subdued mark/clear actions. No state, sync, or logic changes. |
| EA-74 | Toast tone pass — 6 CRUD confirmation toasts removed (task added/saved/deleted, photo saved/deleted, data exported); 3 toasts reworded: "Task name is required" → "Name your step", milestone toast → "A new season begins", cycle override → cycle name only. JS-only, no CSS/state/sync changes. |
| EA-75 | Light Witness Deepening II — `light.entries` migrated from `{ witnessedAt }` to `{ witnesses: [] }`; each tap pushes to the array (deduped by minute); sky renders small bronze horizon marks at each witness position; 3-second stillness pause after tap; sync union-merges arrays per date; Temple still shows qualitative period label from last witness. |
| EA-76 | Care De-Checklist II — Night protocol now has one primary `Keep tonight` action that marks current Night steps checked through existing `checks[todayStr][taskId]`; individual steps live behind a quiet Steps reveal with inspect/edit/add/toggle preserved; partial Night auto-opens Steps. No state shape, sync, task IDs/text, cycle logic, or schema changes. |
| EA-77 | Cycle Tab Quieting — removed "Sweat management" and "Active rules" info-card blocks from `#pane-cycle`; replaced both with a single Spectral italic prose line: "One active per night. Pea-sized. Nothing layered." HTML + 5-line CSS only, no JS or state changes. |
| EA-78 | Regression Fix Pass — 6 targeted fixes: `--bronze-dim` token added to light/dark roots; duplicate `has-care-memory` border rule removed from `today.css`; morning notification title → "Morning cue", night body → cycle name; export filename → `elysium-data-*.json`; delete confirm → "Remove this step?"; dead `CHRONICLE_PROMPT` constant and `promptEl` lookups removed from `chronicle.js`. |
| EA-79 | Dead Code Cleanup — confirmed-unused exports `getLightEntry`, `getRecentSleepHistory`, `saveSleepBedtime` removed; orphaned `ymd` import removed from `sleep.js`; `CYCLE_FULL_NAMES` removed from `constants.js`; dead Today hero/ring CSS selectors removed from `today.css`; dead `.info-card`/`.info-row` CSS blocks removed from `components.css`; fallback modal title "Edit task" → "Edit step" in `index.html`. |
| EA-80 | Settings/System Surface Polish — 9 HTML copy edits in `#pane-settings` (section headings, row labels, sub-copy, hint, install text); 5 CSS changes in `settings.css`: setting-name 16→14.5px, setting-sub 13→11.5px, toggle checked green→bronze, danger rows/chevrons iOS-red→`#d97a5e`, section headings overridden to 10px JetBrains Mono bronze-dim eyebrows. No JS, state, sync, or behavior changes. |
| EA-81 | Temple Card State Deepening — four domain-card state-label changes in `js/render/temple.js`: Chronicle `Written` → `A line`; Light unwitnessed `—` → `Unseen`; Sleep replaced `getLastSleepEntry()` + formatted bedtime with `getSleepEntry(todayStr)` + `Closed` / `—` (fixes stale-yesterday bug); Mind unset `—` → `Unheld`; removed unused `formatTime12` and `getLastSleepEntry` imports. JS-only, no state/sync/CSS/HTML/behavior changes. |
| EA-82 | Dormant Domain Restraint — "IN STUDY" label span removed from `.temple-dormant-head` (separator line kept); Body and Water dormant card state changed from `—` to `Still`; disabled card opacity `0.38` → `0.45`; dead `.temple-dormant-label` CSS block removed. HTML + CSS only, no JS/state/sync/activation changes. |
| EA-83 | Light Witness Stillness — immediate `showToast('Witnessed')` removed; native `disabled` replaced with soft `.is-still` class (`opacity: 0.4; pointer-events: none`) in `temple.css`; `renderLightModal` clears class instead of clearing `disabled`; `b.disabled = false` from post-stillness callback removed. JS + CSS only, no state/sync/witness array/Temple label changes. |
| EA-84 | Temple Daily Opening State — one Spectral italic line above the Care card, derived from existing state in priority order (Sleep closed → Care kept → Care in motion → Chronicle → Mind → Light → silence). `getDailyLine()` private helper in `temple.js`; `#temple-daily-line` paragraph in `index.html`; `.temple-greeting` + `.temple-greeting-line` CSS in `temple.css`. No state/sync/schema/behavior changes. |
| EA-85 | Temple Temporal Breath — module-scope `TEMPLE_PERIOD_BUCKETS` in `temple.js`; `renderTemple()` sets `data-period` on `#pane-temple` from current hour; `--temple-grad-alpha` token in `base.css`; featured Care card gradient parameterized to use it; 7 period attribute-selector rules in `temple.css` shift alpha 0.06 (night) → 0.14 (golden hour). No state/sync/schema/DOM/label/animation changes. |
| EA-86 | Inter-Screen Continuity — sequential pane transition. `css/layout.css`: replaced `fadeIn`-based `.tab-pane.active` rule with `paneEnter` (240ms, `cubic-bezier(0.25, 0.6, 0.25, 1)`, opacity + `translateY(6px → 0)`) and `paneLeave` (120ms, `ease-out`, opacity-only) keyframes; auth screen `fadeIn` keyframe preserved; `prefers-reduced-motion` removes animation entirely. `js/ui/tabs.js`: `switchTab()` adds `.is-leaving` to outgoing pane, schedules a 120ms timer, then swaps `.active`, scrolls to top, and calls the pane render fn; rapid retap clears the pending timer and force-cleans residual classes; same-pane retap re-renders without animating. No DOM restructuring, no domain/state/sync/Supabase/IndexedDB/modal/Sleep/Light/Mind behavior changes. |
| EA-87 | Chronicle From the Well — single resurfaced memory surface above Drift. Replaces the year-ago wrapper inside Drift with a standalone `#chronicle-well` block carrying a mono `From the well` divider and one entry. Selector priority: exact same-date one year ago → ±3-day window same week last year → oldest entry ≥ 60d old and ≥ 14d older than newest non-today entry → silence. No new state, no `chronicle.notes` shape change, no autosave/sync/schema change. |
| EA-88 | Care rhythm bars. 21 thin positional bars added inside `.care-cycle-strip` on the Today/Care tab, below the 3-card cycle grid. Bars represent 7 weeks of the 3-night cycle pattern — 14 past turns, tonight, 6 upcoming turns. Derived from `state.cycleDay` only: never reads `loggedDays`, `checks`, or `startDate`. Past active bars: `--bronze` 0.82 opacity; past rest bars: `--bronze` 0.22 opacity; tonight active: bronze + subtle glow; tonight rest: bronze 0.40; upcoming active: `--separator-strong`; upcoming rest: `--separator`. JetBrains Mono label "3-night rhythm" below. `index.html`: 3-line `.care-rhythm` block. `css/today.css`: EA-88 block — `.care-rhythm`, `.care-rhythm-bars` (21-column grid, 28px), 6 `.care-bar` variants, `.care-rhythm-l`. `js/render/common.js`: `renderCareRhythm(cycleDay)` function called at end of `renderTodayCycle()`. No state shape changes, no STORAGE_KEY change, no Supabase schema change, no sync path change, no IndexedDB change, no Care task IDs/text change, no Night protocol change, no cycle logic change, no milestone threshold change, no new dependencies. |
| EA-89 | Astrolabe commit gesture — two-step arm/commit replaces immediate single-tap cycle switch. First tap arms a node quietly (`.is-armed` bronze-soft fill, center disc previews at 0.6 opacity with a 1.5s breath animation); 1.5s silence commits silently; second tap on the armed node commits immediately. Tapping a different node re-arms. Leaving the Wheel tab dissolves armed state with zero side effects via `cancelCycleArm()`. No toast on commit. `js/render/cycle.js`: removed `showToast` import; added `_armTimer`/`_armedIndex` module state; `commitCycle(i)`, `armNode(i, nodeEl)`, exported `cancelCycleArm()`; `renderCycleList()` clears arm state at the top. `js/ui/tabs.js`: added `cancelCycleArm` to import; calls it when leaving `pane-cycle`. `css/cycle.css`: EA-89 block — `.al-node.is-armed`, `.al-node.is-armed .al-node-name`, `@keyframes alBreath`, `.al-center.is-preview`, `prefers-reduced-motion` override. No state shape change, no `state.cycleDay`/`lastCycleDate` logic change, no sync/schema/IndexedDB change, no Care task change, no cycle advancement logic change, no milestone change. |
| EA-90 | Temple state-carry on return — transient bronze shadow bloom on the relevant Temple card after a meaningful domain action. Four triggers: Light witnessed (on modal close, only if witness occurred this session), Sleep closed (on save), Mind completed (on complete + modal close), Care night kept (queued, applied on next Temple render). `js/render/temple.js`: added `applyTempleTrace(domain)` (direct DOM apply — removes/re-adds `.just-touched`, clears via `animationend`), `queueTempleTrace(domain)` (sets `_pendingTrace` + `_pendingTraceAt`), and a 90-second TTL pending-trace check at the top of `renderTemple()`. `js/ui/modals.js`: added `applyTempleTrace` to import; calls `applyTempleTrace('sleep')` after Sleep save; calls `applyTempleTrace('mind')` after Mind complete. `main.js`: added `applyTempleTrace` to import; added `_lightWitnessedThisSession` flag reset in `openLightModal()`, set in witness handler; `closeLightModal()` calls `applyTempleTrace('light')` and clears flag if set. `js/render/today.js`: added `queueTempleTrace` to import; calls `queueTempleTrace('care')` after `renderAllLists()` in `keepNightProtocol()`. `css/temple.css`: `--bronze-trace-glow` token (light/dark), `@keyframes templeTrace` (shadow bloom at 20%, fade by 100%), `.just-touched` animation rule, `prefers-reduced-motion` override. No new state, no localStorage keys, no sync changes, no schema changes, no domain behavior changes, no modal behavior changes, no Sleep/Light/Mind/Care logic changes, no badges/counts/toasts/copy. |
| EA-91 | Morning De-Checklist — Morning now has one secondary `Open the day` action that marks current visible Morning steps checked through existing `checks[todayStr][taskId]`; individual Morning steps live behind a quiet Steps reveal with inspect/edit/add/toggle preserved; partial Morning auto-opens Steps. No state shape, sync, task IDs/text, comfort mode, loggedDays reconciliation, or Night protocol changes. |
| EA-92 | Supporting Rituals Fold / Retire — Today/Care supporting `tasks.habit` section reframed as a quieter `Additional` reveal with `Kept aside` meta and step-language empty/info/edit copy; existing `data-section="habit"`, `#list-habit`, task data, add/edit/delete/toggle behavior, checks, loggedDays, sync, storage, Night, and Morning protocols preserved. |
| EA-93 | Stars Grid Recede — Stars keeps the 42-day, 7-column constellation/tap structure but hides weekday/date calendar cues, renders star marks through pseudo-elements, quiets Day Record missed/partial copy, and renames photos to Skin memory. No state, sync, storage, future-date, Day Record, or photo behavior changes. |
| EA-95 | Sleep First-Light Reciprocity — `getDailyLine()` in `temple.js` gains a first-light branch: when yesterday was closed and today is open and the hour is before 11am, surfaces `"The night has passed."` in the Temple greeting line. JS-only, one function, no new state. |
| EA-94 | Settings Workshop Reframe — Settings visible heading becomes `The workshop`; the pane is reduced from seven small iOS-style sections into three larger surfaces: Threshold, Cues, and an Archive disclosure for install/beginning/export/import/reset. Existing IDs/classes and all auth, cue, export/import/reset behavior preserved. |
| EA-96 | Identity Surface Reset — public/project identity surfaces now describe Elysium as a quiet ritual operating system, not a skincare tracker/productivity/wellness app; manifest metadata, README, SW comment/cache, package lock name, and QA checklist title updated. No state, sync, Supabase, IndexedDB, task IDs/text, or runtime behavior changes. |
| EA-97 | Dead Code / Architecture Cleanup — removed confirmed-unused JS exports/imports/constants and orphaned CSS rollback selectors from old Care/Temple/Auth/Cycle surfaces. Compatibility state names, storage keys, sync, IndexedDB, service worker behavior, visible copy, and dormant Body/Water domains untouched. |
| EA-98 | Milestone Reframe — removed automatic milestone progression and task injection while retaining passive Stars season framing, dormant milestone metadata, existing task data, storage compatibility, and sync behavior. |
| EA-99 | Cycle / Sleep / Mind Philosophical Fixes — Cycle legend and extra instruction copy removed; astrolabe arm-to-commit breath slowed to 2.5s; Sleep Tonight reminder surface removed; Mind now uses qualitative `Held` state and hides `End session` until the 60-second minimum. No new state, sync, schema, IndexedDB, Body/Water activation, or Care behavior changes. |
| EA-100 | Mechanical Cleanup — removed orphaned `MILESTONES` export from `constants.js`; removed dead green `.task-item.done .task-check` rule and dead `color: white` svg line from `components.css`; fixed `saveSleepModal()` Temple state inconsistency (writes `'Closed'` not a time string); removed now-unused `formatTime12` import from `modals.js`; softened comfort mode sub-copy from skincare product language to Care-neutral; bumped SW cache to `elysium-v15`. |
| EA-101 | First Continuity Primitive — Light Yesterday's Witness Linger. `renderLightModal()` in `main.js` now renders yesterday's witnesses as 3px `is-linger` marks at opacity 0.18 (DOM-ordered before today's 4px 0.55 marks so today paints on top). One CSS rule added to `temple.css` beside the existing `.light-witness-mark` rule. Yesterday is computed inline via the same date arithmetic pattern used in `getDailyLine()`. No state shape, sync, schema, IndexedDB, helper, animation, or other-domain changes. |
| EA-102 | Sedimentary Phase I — Presence & Residue. Four small continuity gestures across Mind / Sleep / Temple / Chronicle, derived entirely from existing state. Mind: most recent reflection surfaces as a single Spectral italic sub-line on the Temple Mind card (`#temple-mind-line`, line-clamped, hidden when none). Sleep: yesterday's sleep note surfaces once as a faint italic line above tonight's textarea inside Sleep modal State A (`#sleep-recent`). Temple: `getDailyLine()` gains a final branch — `"The room has waited."` when today has no signal AND the last 7 days have no signal AND any history exists; derived via private `hasSignalOn` / `hasAnyHistory` / `isQuietStretch` helpers reading `chronicle.notes`, `sleep.entries`, `light.entries`, `mind.sessions`. Chronicle: Drift `quietClass()` now keys by age (`daysApart`) instead of list index — `≤14d` vivid, `15–60d` quiet, `61–180d` quieter, `181d+` faint. Light's yesterday-witness linger (EA-101) untouched. No new top-level state, no new tab/modal, no count/summary/AI/notification change, no Supabase/IndexedDB/STORAGE_KEY/schema change, no Body/Water activation, no Care reshape. SW cache bumped `elysium-v16` → `elysium-v17`. |
| EA-103 | Resonance Infrastructure Phase. Five invisible infrastructure changes deepening future atmospheric resonance capability. (1) Coordinate imprinting: Chronicle notes gain `period`/`cycleDay` fields at first save; Sleep entries gain `period`; Mind sessions gain `period`/`cycleDay` at completion — all via `getPeriodKey()` helper added to `utils.js`; never visible, never editable. (2) Well repetition floor: module-level `_wellExcluded` Set in `chronicle.js` — after an entry is shown, its dateStr is excluded from subsequent renders this session; never persisted; Well goes silent (not forced repeat) when all candidates excluded. (3) Well label age-graduation: deep-time fallback now uses two qualitative labels — `'From an earlier season'` (60–364 days) and `'From the beginning'` (≥365 days), replacing `'From an earlier turn'`. (4) Anti-deduction safeguards: anniversary ±3 window now iterates offsets in day-of-year-rotated order (not fixed nearest-first), varying day-to-day without randomness. (5) Silence hardening: `getDailyLine()` empty result now hides the `.temple-greeting` wrapper via `greetingEl.hidden = !line` in `renderTemple()`; `<div class="temple-greeting">` gains `hidden` attribute in HTML for pre-JS paint. Migration in `migrateState()`: validates and strips invalid `period`/`cycleDay` fields from chronicle notes and sleep entries; mind session map now preserves valid coordinate fields. SW cache bumped `elysium-v17` → `elysium-v18`. No new state keys, no DEFAULT_DATA change, no STORAGE_KEY change, no Supabase schema change, no IndexedDB change, no new DOM elements, no new CSS, no visible copy, no Body/Water activation. |
| EA-104 | Cross-Domain Well v1. Deep-time branch of the Chronicle Well now pools from Chronicle notes, Sleep closure notes, and Mind reflections into a single source-ambiguous rotation; anniversary exact and ±3-day window branches stay Chronicle-only. `getSleepNoteEntries()` added to `sleep.js`; `getMindReflectionEntries()` added to `mind.js` (collapses to one most-recent completed reflection per date). `getWellEntry()` in `chronicle.js` rewritten: deep-time pool unions all three sources, requires `age ≥ 60d` AND `≥ 14d older than newestNonTodayInUnion`, sorts ascending with Chronicle > Mind > Sleep tie-break, returns oldest with the existing `From the beginning` / `From an earlier season` label. Repetition floor keys changed from `dateStr` to `${source}:${dateStr}` so identical dates from different sources do not collide. `renderWell()` reads `candidate.body` and returns the dateStr to Drift only when source is chronicle (else null). No source labels, icons, chips, or visible metadata — source-ambiguity is the gesture (Constitution §13.4, §17.6, §18.5). SW cache bumped `elysium-v18` → `elysium-v19`. No new state keys, no DEFAULT_DATA change, no STORAGE_KEY change, no Supabase schema change, no IndexedDB change, no new DOM elements, no new CSS, no visible copy. |
| EA-105 | Well Resonance Hardening. Chronicle Well selection now holds one computed candidate/silence per session, adds deterministic rarity gates for anniversary-window and deep-time resurfacing, replaces oldest-first deep-time selection with date-phase selection, and applies stricter Sleep/Mind coordinate gates while preserving source ambiguity. SW cache bumped `elysium-v19` -> `elysium-v20`. No UI, copy, state shape, sync, schema, storage, CSS, Body/Water, AI, summaries, counters, source labels, or archive behavior changed. |
| EA-107 | Lifetime Warmth Coefficient Infrastructure. Temple now derives a capped, decaying, render-time warmth coefficient from existing date-keyed presence only and applies it as a tiny lift to the existing `--temple-grad-alpha` period baseline. No stored value, UI, copy, CSS, state shape, sync, schema, storage key, IndexedDB, Supabase, or additional atmospheric organ changed. SW cache bumped `elysium-v20` -> `elysium-v21`. |
| EA-108 | Phase III Calibration Audit. `TEMPLE_WARMTH_MAX_ALPHA_LIFT` raised `0.0100 → 0.0240` in `js/render/temple.js` — original constant produced a sub-perceptual peak lift (~0.008 after a year of daily use), failing §26.3; at 0.024 steady-state lift is ~0.020 (~14–17% gradient alpha change), barely side-by-side perceptible after ~12 months and definitively sub-articulable day-to-day. Comment added to CSS period rules in `temple.css` noting they are overridden by JS inline style at runtime. SW cache bumped `elysium-v21` → `elysium-v22`. No HTML, new CSS rules, state, sync, schema, or behavior changes. |
| EA-109 | Body Domain Activation — Atlas's Standing. Body activated as a real ritual domain. Single gesture: `Returned` CTA opens a modal with earth-gradient surface and horizon line; tap imprints an `{at, period}` arrival entry with 3-second stillness (EA-83 pattern); marks appear on the horizon x-positioned by minute-of-day. No note, no text, no duration, no count. Temple card state: `—` / `Stood`. Temple trace wired (EA-90). Body presence days feed warmth coefficient (EA-107). `state.body.arrivals` keyed by date; union sync mirrors Light witnesses. Migration validates and strips invalid entries. `js/domains/body.js` (new); `constants.js` DEFAULT_DATA; `state.js` migrateState; `sync.js` mergedBodyArrivals; `index.html` card activation + `#body-modal`; `css/temple.css` EA-109 block; `js/render/temple.js` import + TRACE_CARD_IDS + presence-day + state label; `js/ui/modals.js` Body modal functions; `main.js` wiring; SW cache `elysium-v22` → `elysium-v23`. |
| EA-110 | Water Domain Activation — Hydros's Holding. Water activated as a real ritual domain with one gesture: tap `Held` in `#water-modal` to store `state.water.holdings[YYYY-MM-DD] = [{ at: 'HH:MM' }]`, deduped by minute. Temple card state is `Unstirred` / `Stilled`; Water trace applies on modal close after a held session; today marks and yesterday linger marks render below a soft surface line. Water presence days feed the lifetime warmth coefficient. No period, cycleDay, note, duration, quality, count, goal, reminder, quantity tracking, Chronicle Well, daily line, Stars/loggedDays, or dashboard participation. SW cache `elysium-v23` → `elysium-v24`. |

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
