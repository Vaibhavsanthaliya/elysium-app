# Elysium — Project Handoff Guide

This file is the authoritative context document for every Claude session working on this codebase. Read it before inspecting any source file or making any change.

---

## 1 · App overview

Elysium is an evolutionary refactor of a vanilla JavaScript skincare tracker PWA. The goal is a premium, Greek-mythology-inspired personal ritual OS — a calm daily companion for maintaining skincare and wellness habits. The approach is strictly incremental: each ticket adds one small, reversible layer on top of the existing app. This is never a rewrite. All existing skincare behavior is permanently protected and must continue to work correctly after every change.

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
| `updateMilestoneStage()` | Checks `daysSinceStart`, advances `milestoneStage`, injects milestone task upgrades |
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

| Ticket | Description |
|---|---|
| EA-1 | Product and technical blueprint. Analysis only — no code changes. Confirmed evolutionary refactor direction. |
| EA-2 | Identity pass. App renamed to Elysium in manifest, title, auth screen, footer, and service worker cache name. |
| EA-3 | Elysium design tokens added to `styles.css` (both light and dark) without any visual redesign. |
| EA-4 | Restrained copy pass. "Routine" language lightly shifted to "ritual" across visible UI text and notifications. |
| EA-5 | Temple tab added as read-only home summary. Made default active tab. Renders ring, status, cycle name, streak, and quick-action rows. |
| EA-6 | Chronicle tab added between Cycle and Progress. One note per day stored in `chronicle.notes` via existing state/save/sync flow. |
| EA-8 | Care module language introduced. Four copy-only changes: Today tab hero label, Temple "Care cycle" quick action, Settings "Care ritual" section heading, and morning push notification title. |
| EA-9 | Renamed project identity across GitHub and Vercel to elysium-app; local origin remote updated and external tooling verified. |
| EA-10 | Temple visual polish. Six `#pane-temple`-scoped CSS rules: larger hero card (padding, radius, shadow, gap), 100px ring, `--divine-accent` ring stroke, `--bronze` eyebrow label and chevrons, `--oracle-text` quick-action names. No HTML or JS changes. |
| EA-11 | Chronicle visual polish. CSS-only, Chronicle-scoped: upgraded card (16px radius, `--ritual-surface`, `--shadow-md`, separator border), focus-within ring via `--divine-accent`, textarea breathing room (padding, line-height, `--oracle-text`), placeholder via `--muted-text`, status margin, full-width `--divine-accent` save button. No HTML or JS changes. |
| EA-13 | Obsidian Temple foundation tokens. CSS-only, additive-only: 21 new custom properties added to `:root` and dark-mode block — obsidian depth layers, alabaster surface, bronze-soft fill, ink text material, warm separator, temple gradient, bronze glow, card shadow, radius scale (sm–2xl), spacing scale (xs–xl). No existing variables changed, no selectors changed, no HTML or JS changes. |
| EA-14 | Stacked Medallion layout for Temple tab. CSS-only, appended `#pane-temple`-scoped EA-14 block: hero card converted to column/centered layout, `--alabaster` surface in light mode / `--temple-gradient` in dark, `--shadow-card` + `--shadow-bronze`, `--separator-warm` card border and ring track, 120px ring, `--bronze` ring stroke, centered hero text, quick-action card radius/shadow/separator upgraded. No HTML or JS changes. |
| EA-15 | Bottom tab bar active state bronze. CSS-only, one-property change: `.tab.active` color swapped from `var(--tint)` (iOS system blue) to `var(--bronze)` (warm metallic). No layout, icon, animation, HTML, or JS changes. |
| EA-16 | Today/Care Obsidian Temple polish. CSS-only, `#pane-today`-scoped block appended: hero card `--alabaster` surface (light mode) + `--separator-warm` border + `--shadow-card`; dark-mode hero card override restores `--bg-elevated`; ring track `--separator-warm`; hero label `--bronze`; task list cards `--radius-lg` + `--shadow-card`. No HTML or JS changes. |
| EA-17 | Chronicle Obsidian Temple polish. CSS-only, `#pane-chronicle`-scoped block appended: chronicle card `--alabaster` surface (light mode) + `--separator-warm` border + `--shadow-card`; dark-mode card override restores `--bg-elevated`; focus ring changed to `--bronze`; save button `--radius-lg`. No HTML or JS changes. |
| EA-18 | Progress / Stars Obsidian Temple polish. CSS-only, `#pane-progress`-scoped block appended: stat cards and calendar card `--alabaster` (light) + `--separator-warm` border + `--shadow-card`; dark-mode overrides restore `--bg-elevated`; today calendar ring `--bronze` (logged-today white ring preserved); milestone list `--radius-lg` + `--shadow-card` + `--separator-warm` rows; active milestone dot `--bronze` + `--bronze-soft` glow; photo items `--radius-lg`. No HTML or JS changes. |
| EA-19 | Settings Obsidian Temple polish. CSS-only, `#pane-settings`-scoped block appended: setting and install cards `--alabaster` (light) + `--separator-warm` border + `--shadow-card` + `--radius-lg`; dark-mode override restores `--bg-elevated`; row separators `--separator-warm`; action rows `--oracle-text` (removes iOS blue); danger rows explicitly re-declared `--red`; chevrons `--bronze`; danger chevrons `--red`; Reset text button `--bronze`. No HTML or JS changes. |
| EA-20 | Global atmosphere pass. CSS-only. Token-level (light mode only): `--bg` `#f2f2f7` → `#ede8df` (warm stone canvas); `--separator` → bronze-warm `rgba(95,70,28,.13)`; `--bg-input` → warm `rgba(100,75,30,.10)`. Global override block appended: header + tab bar warm glass + `--separator-warm` borders (light mode); `.task-list` + `.cycle-card:not(.active)` + `.info-card` → `--alabaster` with dark-mode restore to `--bg-elevated`; `.btn-row` → `--oracle-text`; `.text-btn` + `.task-info-btn` → `--bronze`; `.field-input:focus` → bronze ring; `.btn-primary` → `--obsidian` (light mode); `.app` ambient warm radial glow (light mode). No dark-mode token changes. No HTML or JS changes. |
| EA-21 | Obsidian Temple typography identity pass. Added Google Fonts loading for DM Sans, Spectral, and JetBrains Mono in `index.html`; added `--font-sans`, `--font-display`, and `--font-mono` variables; applied DM Sans to base UI, JetBrains Mono to meta labels/version, Spectral italic bronze treatment to ring numbers/stat values, Spectral italic Chronicle textarea, and lighter 500-weight headings. Updated `CLAUDE.md` only for handoff. No app.js, service worker, state, storage, sync, schema, layout, or feature changes. |
| EA-22 | Temple home concept-card rebuild. Replaced Temple-only hero/quick-action markup with a featured Care ritual card, medallion/seal progress ring, ritual-card quick-action buttons, mono state labels, and restrained bronze hairlines/glow. Preserved all `renderTemple()` IDs and quick-action button IDs. Added only `#pane-temple` scoped CSS plus this handoff log. No app.js, state, storage, sync, schema, service worker, dependency, or other-tab changes. |
| EA-23 | Bronze state pass. CSS-only, single appended block: Today `#pane-today .ring-fg` stroke → `--bronze`; `.task-item.done .task-check` fill+border → `--bronze`; `.task-check svg` color → `var(--bg)` for mode-adaptive checkmark contrast; `.task-item.done .task-text` strikethrough → `rgba(201,165,107,0.3)`; `.cycle-card.active` border → `--bronze`, fill → `--bronze-soft`; `.cycle-active-badge` background → `--bronze`, label color → `var(--bg)`; `.cal-day.logged` background → `--bronze`, day numeral color → `var(--bg)` (EA-18 today-and-logged white inset ring preserved); `.streak-pill` background → `--bronze-soft`, color → `--bronze`; `.task-info-btn` color → `--bronze`. No HTML, no app.js, no service worker, no manifest, no global token changes, no EA-22 Temple block changes. |
| EA-24 | Dark mode token correction. CSS-only. Dark `@media :root` block: 18 token corrections — `--bg` → `#0E0E12` (obsidian floor, not pure black); `--bg-elevated`/`--bg-grouped` → `#1A1A21` (removes iOS cool cast); `--bg-input` → warm `rgba(236,230,217,0.10)`; `--label` → `#ECE6D9` (warm ink, not cold white); `--label-secondary`/`--label-tertiary` → warm `rgba(236,230,217,...)` basis; `--separator` → `rgba(236,230,217,0.08)` (7.5× reduction, warm hairline); `--bronze` → `#C9A56B` (champagne gold, not orange-amber); `--obsidian`/`--obsidian-bg` → `#0E0E12`; `--obsidian-elevated` → `#131318`; `--marble` → `#1A1A21`; `--bronze-soft` → champagne RGB basis; `--ink`/`--ink-secondary` → concept warm values; `--separator-warm` → `rgba(236,230,217,0.10)` (warm-white hairlines replace orange-tinted borders); `--shadow-bronze` → champagne basis with `-4px` spread. Header/tab bar dark glass updated from `rgba(0,0,0,...)` to `rgba(14,14,18,0.88)`. Dark ambient temple glow added to `.app`. No light mode changes, no HTML, no app.js, no service worker, no manifest. |
| EA-25 | Sign-in / sign-up Obsidian Temple redesign + Aperture logo. `index.html`: replaced inner markup of `#auth-screen` with new `.auth-shell` structure — inline Aperture SVG mark (circle + golden-ratio horizon hairline + bronze dot) inside a bronzed medallion, "OBSIDIAN TEMPLE" mono eyebrow, `Elys` DM Sans 500 + italic `ium` Spectral bronze wordmark, italic tagline, underline hairline fields (`.auth-field` / `.auth-field-input`), bronze pill CTA (`.auth-cta`, mono uppercase "Continue" / "Begin" / "Send reset link" / "Go to sign in" / "Update password"), quiet mono links, mono reassurance footer. All five `auth-view` sub-views preserved; every existing element ID (`signin-email`, `signin-password`, `signin-btn`, `signup-email`, `signup-password`, `signup-btn`, `forgot-email`, `forgot-btn`, `forgot-back`, `confirm-back`, `reset-password`, `reset-btn`, `goto-signup`, `goto-signin`, `goto-forgot`, `auth-error`, `auth-screen`, `auth-signin`, `auth-signup`, `auth-forgot`, `auth-confirm`, `auth-reset`) preserved verbatim. `styles.css`: appended single EA-25 block — `.auth-screen` / `.auth-shell` / `.auth-glow` (radial bronze top glow, light + dark variants) / `.auth-identity` / `.auth-medallion` (alabaster light, obsidian-elevated dark, bronze hairline border + shadow-bronze glow) / `.auth-mark` / `.auth-eyebrow` / `.auth-wordmark` + `.ital` / `.auth-tagline` / `.auth-sub` / `.auth-view` / `.auth-field` (`:focus-within` → bronze underline, 200ms) / `.auth-field-label` (mono bronze on focus) / `.auth-field-input` (transparent, ink text, warm placeholder, autofill override) / `.auth-cta` (bronze pill, gradient fill, shadow-bronze, scale(0.99) press; dark-mode gradient stop override) / `.auth-quiet-row` + `.centered` / `.auth-quiet-link` (mono, hover/focus bronze) / `.auth-error` / `.auth-reassurance` / short-viewport (`max-height: 640px`) compaction / `prefers-reduced-motion` opt-out. Old `.auth-card`/`.auth-glyph`/`.auth-title`/`.auth-switch`/`.btn-link`/`.field`/`.field-input` rules retained (inert — no markup matches them) for easy rollback. No app.js, service worker, manifest, favicon, app-icon, Supabase, storage, IndexedDB, skincare task, cycle, or milestone changes. |
| EA-26 | Mobile polish — boot shell, scroll reset, auth keyboard fix, scrollbar hiding, tab bar stabilisation, sign-out tab reset. `index.html`: added `#boot-shell` (Aperture mark + Elys*ium* wordmark, first child of body) as first-paint startup cover; `#auth-screen` retains `hidden` and is never the loading state; updated `theme-color` metas to `#0E0E12`/`#ede8df`. `styles.css`: EA-26 block appended — `.boot-shell` (fixed, z-index 400, `--bg` background, hides via `[hidden]`); `.boot-mark` (72px medallion, `--alabaster`/`--obsidian-elevated` dark); `.boot-wordmark` (DM Sans 500 + `.ital` Spectral bronze); `html/body/.auth-screen/.past-day-body { scrollbar-width: none }` + `::-webkit-scrollbar { display: none }`; `.tabs { transform: translateZ(0) }` compositor hint; `.auth-shell` min-height overridden from `dvh` → `vh` with `@supports` upgrade to `svh`. `app.js`: added `hideBootShell()` top-level function (idempotent, null-guarded); restructured `initSupabase()` — `authScreen` lookup moved before early return, `hideBootShell()` added to offline branch and removed `authScreen.hidden = false` eager show; `hideBootShell()` called at all 6 exit paths of `applyAuthSession` + `getSession().catch` + 1500ms fallback catch; 4s safety-net `setTimeout(hideBootShell, 4000)` in DOMContentLoaded (fallback only — normal path resolves under 1s); `window.scrollTo(0, 0)` added at top of `switchTab()`; `switchTab('temple')` added in sign-out handler before auth screen appears. No state keys, task IDs, cycle logic, milestone thresholds, Supabase schema, IndexedDB, service worker, or DEFAULT_DATA changed. |
| EA-27 | Modal Obsidian Temple alignment. CSS-only, single block appended to `styles.css`, all selectors scoped to `.modal` context. Seven properties corrected: `.modal-handle` background → `--separator-warm` (was cold `--label-tertiary`); `.modal-title` weight → 500 / tracking → -0.02em (was 700); `.modal .field-label` → JetBrains Mono 9.5px 0.22em `--bronze` (was DM Sans secondary-label); `.modal .field-input` → underline-only style, transparent bg, `--separator-warm` bottom border, radius 0 (was iOS filled rounded-rect); `.modal .field-input:focus` → bronze underline, no outline ring; `select.field-input` background-image arrow → bronze `#A07A4A` light / `#C9A56B` dark (was iOS gray `#8E8E93`); `.modal .btn-primary` dark mode → `--bronze` bg / `--bg` text 9.3:1 contrast (light mode already obsidian via EA-20); `.modal .btn-secondary` → rust `rgba(217,122,94,0.12)` bg / `#d97a5e` text (was pink-soft/red); `.modal .btn-text` → `--muted-text` (was `--tint` iOS blue). No HTML, app.js, state, cycle, milestone, storage, sync, or schema changes. |
| EA-29A | JS modularization with browser-native ES modules. Monolithic `app.js` (~1842 lines) split into 18 ES modules + `main.js` entry point under `js/` tree: `constants.js`, `utils.js`, `state.js`, `sync.js`, `domains/care.js`, `domains/chronicle.js`, `services/photos.js`, `services/notifications.js`, `render/common.js`, `render/temple.js`, `render/today.js`, `render/cycle.js`, `render/chronicle.js`, `render/progress.js`, `render/settings.js`, `ui/tabs.js`, `ui/modals.js`, `ui/toast.js`. Key patterns: callback injection (`registerSyncCallback`, `registerPostSyncCallback`) breaks state→sync and sync→render circular deps; `initState()` wraps module-level init; `Object.assign(state, newState)` preserves live ESM binding in importData; `window.closeTaskInfoModal` temporary global for inline onclick in index.html. `index.html`: `<script src="app.js">` → `<script type="module" src="main.js">`. `sw.js`: CACHE_NAME `elysium-v1` → `elysium-v2`, all 18 module paths added to ASSETS, shellPath updated to match `/js/`. `app.js` deleted. No CSS, state keys, task IDs, cycle logic, milestone thresholds, Supabase schema, IndexedDB, DEFAULT_DATA, or behavior changes. |
| EA-28 | Temple ritual-domain entry screen. `index.html`: replaced inner content of `#pane-temple` with featured Care card (bronzed 60px glyph medallion, care SVG glyph, 28px mini progress arc, mono eyebrow "CARE · HYGIEIA", Spectral italic cycle blurb), 6 domain cards (Chronicle with real note state + 5 dormant: Light, Body, Mind, Water, Sleep each with abstract SVG glyph + Spectral italic subtitle), and secondary mono nav row for Cycle / Progress. `styles.css`: replaced EA-22 block entirely with scoped EA-28 block — `.temple-featured` (bronze gradient border, bronzed medallion, mini arc, transition), `.temple-domain-card` (surface card, separator border, bronze state label, `:disabled` at 0.38 opacity), `.temple-secondary-nav` + `.temple-nav-link` (mono text, muted, hover → bronze). `app.js`: `renderTemple()` — circumference 326.7 → 69.12 (mini arc r=11), short cycle blurbs inline array, chronicle note state "Written"/"Quiet" via `#temple-chronicle-state`, removed stale `#temple-cycle-name` and `#temple-streak-sub` refs; `initEventListeners()` — added `#temple-goto-chronicle` → `switchTab('chronicle')`. No state keys, task IDs, cycle logic, milestone thresholds, Supabase schema, IndexedDB, service worker, or DEFAULT_DATA changed. |
| EA-29B | CSS modularization. Monolithic `styles.css` (2,796 lines) split into 11 feature-based files under `css/`: `base.css`, `layout.css`, `settings.css`, `modal.css`, `components.css`, `cycle.css`, `chronicle.css`, `progress.css`, `today.css`, `auth.css`, `temple.css`. `index.html` updated to load all 11 files in the documented cascade order. `sw.js` ASSETS updated, `styles.css` path replaced with `css/*.css` entries, `shellPath` check updated to match `/css/`. CACHE_NAME bumped `elysium-v2` → `elysium-v3`. `styles.css` deleted. No visual changes, no new tokens, no JS logic changes. |
| EA-30 | Progress tab Stars/Constellation foundation. `index.html`: added "The *stars*" page heading (JetBrains Mono eyebrow + DM Sans 500 + Spectral italic accent); replaced `<h2>` section headings for Constellation and Milestones with `.section-hd` pattern (Spectral italic left label + JetBrains Mono right meta); added `star-field-card` class to `.cal-card`; added `id="star-field-meta"` and `id="milestone-stage-meta"` spans. `css/progress.css`: EA-30 block appended — page heading styles; section-hd pattern; 4-column stats grid with responsive 2-column fallback at ≤360px; stat-value reduced to 26px / stat-label to 8.5px; star-field-card `--obsidian-elevated` dark / warm off-white light surface; `.cal-day` circular star dots with 3 states (logged=bronze fill+glow, partial=faint bronze ring, empty=separator ring); `.constellation-svg` + `line` styles (bronze, strokeWidth 0.5, opacity 0.35); milestone `.done` row bronze gradient; `.milestone-index` Spectral italic roman numeral. `js/render/progress.js`: added `ROMAN` constant; added `isPartial` detection per calendar cell; star-field-meta updated to "X RECORDED"; `renderConstellationLines()` added — proximity-threshold SVG lines (maxDist = cellUnit × 2.5, skips long diagonal jumps); milestone rows use roman numeral index and `.done`/`.active` row classes; `milestone-stage-meta` shows "X OF IV". No state keys, task IDs, cycle logic, milestone thresholds, Supabase schema, IndexedDB, service worker, or DEFAULT_DATA changed. |
| EA-33 | Today/Care task surface refinement. CSS-only, single EA-33 block appended to `css/today.css`, all selectors scoped to `#pane-today`. Seven overrides: (1) `.task-list` — `background: transparent`, `border-radius: 0`, `overflow: visible`, `box-shadow: none` — strips card wrapper so tasks sit directly on page floor; (2) `.task-item` → `padding: 14px 4px`, `border-bottom: 1px solid var(--separator-warm)` — separator-led rows; `:first-child` adds top border, `:last-child` restores bottom border (overrides global `none`); (3) `.task-text` → `font-size: 15px`, `letter-spacing: -0.005em`; (4) `.task-check` → `20px × 20px` (from 22px); (5) `.section-icon` → `background: transparent`, `border-radius: 0`, `width/height: auto`, `opacity: 0.45` — removes colored iOS pill, renders as quiet dim glyph; (6) `.section-title h2` → Spectral italic 17px weight 400; (7) `.cycle-tag` + `.comfort-tag` → `background: transparent`, JetBrains Mono 9.5px bronze 0.18em, no pill. No HTML, JS, state, task IDs, cycle logic, milestone, storage, sync, or IndexedDB changes. |
| EA-32 | Chronicle prompt card and writing atmosphere. `index.html`: replaced `#pane-chronicle` inner content — removed `.section` wrapper and old `<h2>`, added `.chronicle-heading` (JetBrains Mono bronze eyebrow "CHRONICLE" + DM Sans 500 h1 with Spectral italic *chronicle*), `.chronicle-prompt` card (dashed bronze border, warm bronze-tinted bg, mono label "A quiet record of the day", Spectral italic `#chronicle-prompt-q` question text), cleaned up `.chronicle-card` wrapper (rows 8→7, placeholder updated to "Write here. One note per day."), button text "Save note"→"Save"; all three IDs `#chronicle-textarea`, `#chronicle-status`, `#chronicle-save-btn` preserved. `css/chronicle.css`: EA-32 block appended — `.chronicle-heading`/`.chronicle-eyebrow`/`.chronicle-title`/`.ital` heading pattern; `.chronicle-prompt` dashed card (light: `rgba(160,122,74,0.05)` bg / `rgba(160,122,74,0.30)` border, dark: `rgba(201,165,107,0.04)` bg / `rgba(201,165,107,0.25)` border); `.chronicle-prompt-label` mono 9.5px bronze; `.chronicle-prompt-q` Spectral italic 18px 1.35 line-height; `.chronicle-status` JetBrains Mono 10px uppercase; `#pane-chronicle .btn-primary` → obsidian/marble (light) + bronze/bg (dark), overriding previous iOS-blue `--divine-accent`; softer `:focus-within` glow (3px rgba bronze, replaces hard 2.5px ring). `js/render/chronicle.js`: added `PROMPTS` array (7 restrained questions); `renderChronicle()` updates `#chronicle-prompt-q` by `new Date().getDay()` — purely display, zero state. No state keys, task IDs, cycle logic, milestone thresholds, Supabase schema, IndexedDB, service worker, DEFAULT_DATA, or save/sync logic changed. |
| EA-31 | Cycle tab Astrolabe foundation. `index.html`: replaced `#pane-cycle` inner content — removed vertical 3-card stack, added `.cycle-heading` (JetBrains Mono eyebrow `#cycle-eyebrow`, DM Sans 500 h1 with Spectral italic "wheel", muted sub), `.astrolabe-wrap#cycle-astrolabe` (4 concentric ring layers: `al-glow`/`al-outer`/`al-mid`/`al-inner` + `.al-center` disc with `#al-numeral` Spectral italic roman + `#al-lbl` mono treatment name), `.al-legend` row (2 states: Tonight/Upcoming); Sweat management and Active rules info sections preserved below. `css/cycle.css`: EA-31 block appended — `.cycle-heading`/`.cycle-eyebrow`/`.cycle-title`/`.cycle-sub` heading styles; `.astrolabe-wrap` 300px relative container; `.al-ring` base + 4 variant rings (glow=radial-gradient, outer=248px solid, mid=192px dashed 0.55 opacity, inner=108px bg fill); `.al-center` 108px centered disc; `.al-numeral` Spectral italic 32px bronze; `.al-lbl` mono 7.5px muted; `.al-node` 52px absolute circular button with 180ms transitions; `.al-node.active` bronze fill + shadow-bronze glow; `.al-node-numeral` Spectral italic 18px; `.al-node-name` absolute mono 8px label 22px below node; `.al-legend` + `.al-dot-active`/`.al-dot-pending`. `js/render/cycle.js`: replaced card rendering with astrolabe node rendering — 3 `.al-node` buttons JS-positioned at -90°/30°/150° on 102px radius (`calc(50% + x − 26px)` positioning); each node contains Spectral roman numeral + mono name label; click handler unchanged (state.cycleDay, saveState, re-renders); center + eyebrow updated on every render; unused `CYCLE_FULL_NAMES`/`CYCLE_DESC` imports removed. No state keys, task IDs, cycle logic, milestone thresholds, Supabase schema, IndexedDB, service worker, or DEFAULT_DATA changed. |

---

## 9 · Ticket workflow

Every future Claude session working on an EA ticket must follow these steps in order:

1. **Read this file first.** Do not inspect source files or propose changes before reading `CLAUDE.md`.
2. **For any UI/design ticket, read the Obsidian Temple design reference before proposing changes:**
   - `design/obsidian-temple/README.md`
   - `design/obsidian-temple/design-system.md`
   - `design/obsidian-temple/implementation-map.md`
3. **Read relevant source files.** Inspect only the files and sections relevant to the ticket scope.
3. **Propose before editing.** List exact changes (copy strings, function signatures, HTML structure) and wait for explicit user approval. Do not apply any edit before approval is given.
4. **Keep changes small and reversible.** One concern per ticket. Do not refactor surrounding code, add speculative features, or clean up unrelated sections.
5. **After implementation, provide:**
   - Changed files table
   - Exact diff summary per file
   - Confirmation checklist (state shape, constraints, no regressions)
   - Manual smoke test checklist
6. **Update this file's ticket log** (section 8) after each completed ticket, adding a one-line entry for the new ticket.
