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

Latest ritual philosophy references should also be included in future UI/design prompts when available:

```
Elysium - Ritual Philosophy.html
philosophy-presentation.jsx
philosophy-sketches.jsx
```

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
6. **Update the ticket log** after each completed ticket: add a one-line summary row to section 8 of this file, and a full implementation-notes row to `docs/ticket-log.md`.
