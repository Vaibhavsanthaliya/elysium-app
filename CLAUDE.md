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
- All logic in one file (`app.js`), all markup in one file (`index.html`), all styles in one file (`styles.css`)

---

## 3 · Core files

| File | Role |
|---|---|
| `app.js` | All application logic (~1820 lines) |
| `index.html` | All markup — auth screens, tab panes, nav |
| `styles.css` | All styling — system vars, Elysium tokens, component styles |
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
8. Do not introduce frameworks, build tooling, or npm dependencies unless explicitly approved.
9. Do not add inline styles. All styling goes in `styles.css`.
10. Do not restructure files or split logic across multiple JS files.

---

## 7 · Design and tone

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

---

## 9 · Ticket workflow

Every future Claude session working on an EA ticket must follow these steps in order:

1. **Read this file first.** Do not inspect source files or propose changes before reading `CLAUDE.md`.
2. **Read relevant source files.** Inspect only the files and sections relevant to the ticket scope.
3. **Propose before editing.** List exact changes (copy strings, function signatures, HTML structure) and wait for explicit user approval. Do not apply any edit before approval is given.
4. **Keep changes small and reversible.** One concern per ticket. Do not refactor surrounding code, add speculative features, or clean up unrelated sections.
5. **After implementation, provide:**
   - Changed files table
   - Exact diff summary per file
   - Confirmation checklist (state shape, constraints, no regressions)
   - Manual smoke test checklist
6. **Update this file's ticket log** (section 8) after each completed ticket, adding a one-line entry for the new ticket.
