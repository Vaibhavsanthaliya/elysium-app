# Elysium — Project Handoff Guide

This file is the authoritative context document for every Claude session working on this codebase. Read it before inspecting any source file or making any change.

---

## 0 · Read First

Read these files before any ticket work, in this order:

| File | When required |
|---|---|
| `CLAUDE.md` (this file) | Always — read first |
| `docs/ticket-log.md` | Always — full implementation history per ticket |
| `docs/continuity-constitution.md` | Any continuity, memory, resurfacing, or atmosphere ticket |
| `design/obsidian-temple/design-system.md` | Any UI or visual ticket |
| `design/obsidian-temple/implementation-map.md` | Any UI or visual ticket |
| `design/obsidian-temple/README.md` | Any UI ticket — allowed/forbidden visual patterns |
| `elysium-app-concept/Elysium - Ritual Philosophy.html` | Any patron identity or philosophy ticket |
| `elysium-app-handoff/elysium-app/project/Elysium - Pantheon Direction.html` | Any patron identity or philosophy ticket |
| `philosophy-presentation.jsx` | Any patron/philosophy ticket (when available) |
| `philosophy-sketches.jsx` | Any patron/philosophy ticket (when available) |
| Relevant source files | Specific to the ticket scope only |

Additional concept reference files when available: `prototype.jsx`, `prototype-screens.css`, `tokens.css`, `glyphs.jsx`.

---

## 1 · App Overview

Elysium is a quiet ritual operating system — a calm daily companion for keeping personal domains without turning them into productivity dashboards, wellness SaaS, or self-optimization scorecards. It evolved from a vanilla JavaScript skincare tracker PWA, and that origin remains protected as the Care domain. The approach is strictly incremental: each ticket adds one small, reversible layer. This is never a rewrite. Legacy Care behavior, storage compatibility, and existing user data must continue to work correctly after every change.

**Product arc:** Began as an iOS-style skincare tracker → gained Greek mythology shaping → moved through an over-ritualized phase → now being corrected into a **practical myth-shaped daily operating system**. Mythology shapes the form, language, and interaction logic — it is not decoration pasted on. Utility comes first; patron identity shapes how that utility is delivered.

**What Elysium is not:** a habit tracker, a wellness app, a productivity dashboard, a journaling app, or ritual theater. Each domain has a real job, and the patron is the reason the job has its particular shape.

---

## 2 · Architecture

- Vanilla JavaScript — no framework, no build step, no bundler
- CDN-loaded Supabase (`@supabase/supabase-js` via `esm.sh`)
- Static deployment on Vercel
- Single-page app: tab-pane navigation managed by `switchTab(name)`
- Dark/light mode via `prefers-color-scheme` media query
- PWA: service worker for offline support and home screen install
- All markup in `index.html`. Styles in `css/` by feature area. JS in `js/` module tree (entry: `main.js`).

---

## 3 · Core Files

| File | Role |
|---|---|
| `index.html` | All markup — auth screens, tab panes, nav |
| `css/base.css` | CSS custom properties (tokens), reset, `html`/`body` base |
| `css/layout.css` | App shell, header, tab bar, boot shell |
| `css/components.css` | Shared UI components + global overrides |
| `css/settings.css` | Settings tab |
| `css/modal.css` | Modal system, field inputs, buttons, past-day modal |
| `css/cycle.css` | Cycle tab |
| `css/chronicle.css` | Chronicle tab |
| `css/progress.css` | Progress tab — stats, calendar, photos, milestones |
| `css/today.css` | Today/Care tab overrides |
| `css/auth.css` | Auth screen |
| `css/temple.css` | Temple tab |
| `sw.js` | Service worker — cache shell, offline fallback, notification click |
| `manifest.json` | PWA manifest |
| `vercel.json` | Vercel deployment config |
| `js/constants.js` | `DEFAULT_DATA`, all constant arrays |
| `js/utils.js` | Shared utilities: `ymd()`, `getDayOfYear()`, `uid()`, etc. |
| `js/state.js` | `loadState`, `mergeDefaults`, `migrateState`, `saveState` |
| `js/sync.js` | Supabase sync, post-sync callbacks, `hideBootShell()` |
| `js/ui/flow.js` | Morning / Work / Night flow modal logic |
| `js/render/temple.js` | Temple rendering, Day Thread, daily line, warmth coefficient |
| `js/render/today-plan.js` | Today tab rendering |
| `js/render/chronicle-archive.js` | Chronicle archive list and entry detail |
| `js/render/common.js` | Shared render helpers: Apollo line, Asclepius guard, Care protocol memory |
| `js/domains/` | Per-domain logic: care, chronicle, light, sleep, mind, body, water |

**CSS load order in `index.html` must be preserved exactly:**
`base → layout → settings → modal → components → cycle → chronicle → progress → today → auth → temple`

Reordering breaks cascade dependencies. Do not create new CSS files without explicit approval.

---

## 4 · State and Storage

### localStorage

Key: `skincare_app_v1` — **do not change** (see Hard Constraints).

Single JSON blob. On load: `mergeDefaults()` then `migrateState()`. `DEFAULT_DATA` shape: see `js/constants.js` (authoritative). When adding new state keys: add to `DEFAULT_DATA` (auto-injected by `mergeDefaults`) and add a sanity check in `migrateState`.

### Supabase

- Table: `user_data` · Columns: `user_id` (PK), `data` (JSONB), `updated_at`
- **Schema must not change.** JSONB `data` accepts arbitrary nested keys — new state fields do not require schema migrations.
- `syncFromSupabase`: union-merges `loggedDays` + `checks`; cloud wins for tasks/settings; re-runs `migrateState` after merge.
- Writes debounced via `scheduleSaveToSupabase`; immediate flush on `visibilitychange` (hidden) and `pagehide`.

### IndexedDB

- Database: `skin-photos-v1` — **do not touch**. Binary photo data only.
- `weeklyPhotos` in state holds metadata only (`id`, `date`, `label`).
- Photo logic isolated in: `openPhotoDb`, `savePhotoData`, `getPhotoData`, `removePhotoData`, `clearAllPhotoData`.

---

## 5 · Critical Functions

| Function | Role |
|---|---|
| `loadState()` | Reads localStorage, applies `mergeDefaults` + `migrateState` |
| `mergeDefaults(obj, defaults)` | Recursive merge — injects missing `DEFAULT_DATA` keys without overwriting |
| `migrateState(s)` | Defensive validation and sanitization; called on load and after Supabase sync |
| `saveState()` | Writes to localStorage, schedules debounced Supabase flush |
| `syncFromSupabase()` | Fetches cloud state; union-merges progress; cloud wins for tasks/settings |
| `flushToSupabase()` | Immediate Supabase write — called on page hide and unload |
| `advanceCycleIfNeeded()` | Auto-advances `cycleDay` based on days elapsed since `lastCycleDate` |
| `getMilestoneStage(n)` | Returns passive season index for Stars display without mutating state |
| `switchTab(name)` | Activates tab pane, deactivates others, calls tab-specific render |
| `showToast(msg)` | Brief toast notification overlay |
| `uid()` | Short random ID for new tasks |
| `getPeriodKey()` | Returns current time period: `first-light`/`morning`/`midday`/`afternoon`/`dusk`/`night` |
| `getDayOfYear(date)` | Canonical day-of-year helper in `utils.js` — do not redefine locally |

---

## 6 · Hard Constraints

1. Do not change `STORAGE_KEY` without an explicitly approved migration plan.
2. Do not change the Supabase schema (`user_data` table, column names, or types).
3. Do not touch the IndexedDB store name (`skin-photos-v1`) or its object store structure.
4. Do not change skincare task IDs (`m1`, `m2`, `m3`, `n1`–`n8`, `h1`–`h3`) or the default task text.
5. Do not change the 3-day cycle logic (`cycleDay` 0/1/2, `advanceCycleIfNeeded`).
6. Do not change milestone thresholds (14 → stage 1, 28 → stage 2, 56 → stage 3).
7. Only change `CACHE_NAME` in `sw.js` when HTML/CSS/JS caching freshness requires a deliberate version bump.
8. Do not introduce frameworks, build tooling, or npm runtime dependencies without explicit approval. Browser-native ES modules (`import`/`export`, `type="module"`) are approved and in use.
9. Do not add inline styles. All styling goes in the appropriate `css/` file.
10. JS logic lives in the `js/` module tree. Entry: `main.js`. No module may exceed ~350–400 lines without architecture approval. Module tree: `js/constants.js`, `js/utils.js`, `js/state.js`, `js/sync.js`, `js/domains/`, `js/services/`, `js/render/`, `js/ui/`.
11. CSS organized by feature area under `css/`. Do not create new CSS files without explicit approval.

**Absolute prohibitions (no exceptions, no tickets, no exceptions for "this one case"):**
- No streaks, scores, percentages, habit analytics, weekly reports, or productivity dashboards
- No AI summaries or inferred emotional/personality analysis
- No HealthKit, passive sensing, or social features
- No generic todo-app drift
- No Greek decoration without utility — patron form must serve a real job
- No atmospheric-only features that don't support an actual useful surface
- No returning to decorative ritual loops that passed in the over-ritualized phase

---

## 7 · Design and Tone

### Design References — Read Before Any UI Ticket

| File | Purpose |
|---|---|
| `design/obsidian-temple/README.md` | Visual goal, what is allowed and forbidden |
| `design/obsidian-temple/design-system.md` | Exact tokens, typography, component patterns |
| `design/obsidian-temple/implementation-map.md` | App vs concept gap table, suggested tickets |
| `elysium-app-concept/Elysium - Ritual Philosophy.html` | Ritual philosophy reference |
| `elysium-app-handoff/elysium-app/project/Elysium - Pantheon Direction.html` | Current patron philosophy (use as ground truth) |

Use the concept folder as design ground truth, not previous EA ticket approximations. Any deviation from concept values must be justified explicitly.

### Continuity Constitution — Read Before Any Memory / Atmosphere Ticket

`docs/continuity-constitution.md` — 27 articles, six binding tests, prohibited directions.

The constitution is **doctrinal, not advisory**. Any continuity proposal must pass all **Six Tests** in §27.2:
1. **Felt-not-read** — atmosphere, not annotation
2. **No-counter** — no numbers or frequencies
3. **Reversibility** — user can close or ignore
4. **Silence** — omittable when nothing has happened
5. **Non-actionable** — does not prompt the user to act
6. **Productivity-app** — does not optimize, score, or trajectory-frame

Failing any one is grounds for rejection. When the constitution and a proposal disagree, the proposal is wrong. The constitution supersedes contradicting ticket instructions unless it is itself amended through a documentation ticket.

### Patron Doctrine — Read Before Any Surface or Domain Ticket

Every domain is a patron. A patron is not a theme applied afterward — it is the reason a surface has its shape. Two gates must be passed before any surface is built:

**Gate 1 — Utility Gate:** Would the user miss this surface if it vanished? Is the feature useful with the patron name removed?

**Gate 2 — Form Gate:** Does the patron shape how the job is done — naming, timing, restraint, hierarchy, rhythm? Could only this patron hold this surface?

Both failures are forbidden:
- **Decoration:** mythology with no real job.
- **Generic utility:** useful feature with Greek naming pasted on.

**Current patron map:**

| Patron | Surface | Structural role |
|---|---|---|
| Kairos | Today | The right hour; what belongs now; intentions |
| Hygieia | Care | Skincare protocol, cycle, reaction memory |
| Asclepius | Care guard | Conditional irritation guard; barrier repair caution (shown only when `condition === 'irritated'`) |
| Mnemosyne | Chronicle | Writing, archive, memory |
| Hypnos | Sleep | Closure, parking note, morning handoff |
| Atlas | Body | Carried weight; physical relief lookup |
| Athena | Mind | Mental-load offload; one thread; clarity |
| Apollo | Light | Morning visibility; daylight awareness; SPF — accessible only via Morning Flow |
| Water | Dormant | Retired from visible UI; `state.water` and migration preserved; no standalone card or modal |

Tab labels remain plain and useful. The patron name belongs in the eyebrow, subtitle, or context — not the primary navigation label.

### Visual Tokens

New UI work should reference Elysium tokens, not raw system variables. Authoritative values in `css/base.css`.

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

### Copy and Tone

- Use **ritual** not routine, **chronicle** not journal, **temple** not home, **cycle** not schedule.
- Premium and restrained. One sentence is better than two.
- Do not use fantasy game UI language, dramatic lore, or Zeus/lightning imagery.
- No exclamation points in UI copy.

---

## 8 · Ticket History

Full implementation notes for every ticket: [`docs/ticket-log.md`](docs/ticket-log.md)

### EA-95 through EA-164 — Phases 1–3 (see ticket-log.md for full detail)

**Phase 1: Foundation & Identity (EA-95–EA-124)**
Identity reset (EA-96), milestone reframe to passive Stars season framing (EA-98), philosophical cleanup of Sleep/Mind/Cycle (EA-99), dead code removal (EA-97, EA-100). Built continuity primitives: Light linger marks (EA-101), Mind/Sleep sedimentary layers (EA-102), Well resonance infrastructure with coordinate imprinting and age labels (EA-103–105). Temple lifetime warmth coefficient (EA-107–108). Activated Body domain (EA-109) and Water domain (EA-110). Temple restraint compression (EA-111–113). Care surface modernization (EA-115). Ritual constant arrays added to `constants.js`; Meridian mark (EA-124).

**Phase 2: Ritual Domain Deepening (EA-125–EA-149)**
Chronicle ritualization foundation and memory resurfacing (EA-125–126). Sleep closure ritual (EA-127), Mind gathering ritual (EA-128), Water/Body contact rituals (EA-129–130), ritual constants convergence (EA-131). Light threshold surface (EA-133). Temple morning orientation lines and daily rhythm with period-keyed headings and `data-rhythm` CSS ordering (EA-135, EA-137). Day Thread (`deriveTodayTraces` + `renderDayThread` in `temple.js`) (EA-141). Closing Summary for evening (EA-140). Recent presence atmosphere (EA-142). Care guidance surface `CARE_PROTOCOL_NOTES` keyed by `cycleDay` (EA-144). Constitution compliance: count displays removed, Day Thread traces qualitative-only (EA-146). Architecture dedup: `getDayOfYear` canonicalized to `utils.js` (EA-147). Chronicle prompt pools by period (EA-148). Care Practical Exception §19A added to constitution (EA-149).

**Phase 3: Utility Hardening Arc (EA-152–EA-164)**
Sleep parking note (EA-152). Body desk reset paced sequence (EA-153). Mind focus hold with 60s reveal, no countdown display (EA-154). Water reset 3-step pause (EA-155). Light morning orientation with ephemeral tone chooser (EA-156). Temple utility signal copy (EA-157). Quiet completion outcomes for Body/Water/Light (EA-158). Full arc verification (EA-159). `js/ui/flow.js` introduced with three period-gated flows: Morning (Light → Care → Chronicle, EA-161), Night (Night Care → Chronicle → Sleep, EA-162), Work (Mind → Body → Water, EA-163). Per-open session token prevents stale flow advances (EA-164).

---

### EA-166 onward — Active Architecture

| Ticket | Summary |
|---|---|
| EA-166 | **Today Plan** — `state.today` with intentions/carryover; `js/domains/today-plan.js` + `js/render/today-plan.js`; 4-tab nav (Today\|Care\|Temple\|Settings); daily rollover with 1-day carryover; no streaks/counts. |
| EA-167 | **Chronicle Reading View** — Write/Read mode toggle (session-only); `js/render/chronicle-archive.js`; reverse-chronological archive; read-only entry detail with Back button. |
| EA-167A–D | **Today/Temple Stabilization Batch** — iOS first-launch dvh/scroll geometry fix (synchronous reflow in `hideBootShell`); time-aware OPEN rows by period; auth error styling; Today card polish. |
| EA-168 / 168A | **Chronicle Plain Search** — `searchChronicleEntries(query)` in `chronicle.js`; bronze match highlight; iOS autocorrect disabled on input. |
| EA-169 | **Care Condition + Reaction Notes** — `state.care.records[dateStr]` shape (`condition`, `morningNote`, `reactionNote`); morning check-in chips (calmer/same/irritated); night reaction note field; no analytics or trends. |
| EA-170A | **Constitution Amendment: Practical Usefulness** — §19B Today exception; §15.4A Chronicle reading; §22.5A resurfacing clarification; §27.8 doctrine note. (Docs only.) |
| EA-171A | **Today Threshold Redesign** — masthead, naked separator rows, Spectral section labels, carryover echo "Yesterday left". |
| EA-174 | **Care Protocol Reaction Memory** — `getPreviousCareRecordForCycle()` surfaces prior night on same cycle protocol; `LAST TIME ON THIS NIGHT` eyebrow in Care night section; `renderCareProtocolMemory()` in `common.js`. |
| EA-176 | **Sleep Shutdown → Morning Handoff** — Sleep modal shows unkept intentions with Carry/Let-pass decisions; `state.today.sleepDecisions` + `state.today.sleepHandoffDismissedFor`; morning `HYPNOS HELD` handoff with dismiss; §19C constitution amendment. |
| EA-177 | **Body Desk Relief Lookup (Atlas)** — chip-based area lookup replacing paced somatic sequence; `BODY_RELIEF_AREAS` in `constants.js`; `BODY_SOMATIC_INVITATIONS` retained for Work Flow. |
| EA-178 | **Today/Sleep Bug Fix Batch** — first-launch Today reveal geometry fix; Today vertical rhythm tightened; Sleep separator cleanup. |
| EA-178A | **Mind Mental-Load Offload** — direct 2-state thread-offload modal; `state.mind.thread` same-day field; held thread surfaces in Today as "HELD NEARBY"; §18.8 constitution amendment. |
| EA-178B | **Mind Modal Rebuild** — single offload surface; "Set it down" / "Send to Today" / "Clear"; `getMindOffload()`/`saveMindOffload()`/`clearMindOffload()` in `mind.js`. |
| EA-179 | **Water Demotion** — step-through sequence removed; one static line + "Held" button only; `getWaterRitual`/`getWaterContactInvitation`/`getWaterResetSteps` removed from `water.js`. |
| EA-180 | **Today Intention Inline Edit** — tap row text to edit in place; `updateIntention(id, text)`; Enter saves, Escape reverts. |
| EA-181 | **Light Standalone Removal** — Light Temple card and modal removed; Light accessible only via Morning Flow Step 1; `js/domains/light.js` and state shape preserved. |
| EA-183 | **Post-Water Stabilization** — confirmed no standalone Water card/modal remnants; `state.water`, migration, and sync preserve dormant Water state. |
| EA-184 | **Patron Doctrine** (docs only) — patron gates, patron map, and navigation-label rule added to CLAUDE.md and constitution §27.9. |
| EA-189 | **Today as Kairos** — masthead eyebrow `KAIROS · [day] · [date]`; sub `"Only what belongs to this hour."`; footer `"What does not belong can pass."` |
| EA-190 | **Asclepius Irritation Guard** — conditional guard in Care night when `condition === 'irritated'`; `ASCLEPIUS_GUARD_LINES` keyed by `cycleDay`; `renderCareAsclepiusGuard()` in `common.js`. |
| EA-192 | **Water Complete Retirement** — Water removed from Work Flow and Day Thread trace; `state.water` preserved dormant; `js/domains/water.js` intact but unused in active UI. |
| EA-193 | **Apollo Daylight Protection** — practical daylight chip (Mostly inside / Some sun / Strong sun) replaces decorative tone chooser in Morning Flow; `saveDaylight()`/`getDaylight()` in `light.js`; `renderCareApolloLine()` in `common.js` surfaces in Care morning. |
| EA-194 | **Hypnos Night Closure Copy** — Sleep modal and Today handoff copy aligned to Hypnos frame; morning handoff eyebrow `HYPNOS HELD` in bronze. |
| EA-195 | **Atlas Body Copy** — `BODY_RELIEF_AREAS` copy updated to curated phrasing; Body modal sub → "Where does the body carry its weight?" |
| EA-196 | **Mnemosyne Chronicle Copy** — eyebrow `MNEMOSYNE`; Read button `Remember`; resurfacing kicker `Remembered`. |
| EA-197 | **Hypnos Sleep Copy** — title `Let the day go quiet.`; sub `What remains does not need your hands tonight.`; handoff `WHAT CAN WAIT MAY REST`; CTA `Let it rest`. |
| EA-200 | **Temple as Olympus** — section label `OLYMPUS`; Care hero eyebrow `CARE · ASCLEPIUS`; domain card sub copy shifted to patron-role verbs; Temple daily line and Day Thread copy softened. |
| EA-201 | **Today Open Rows: Patron Identity** — section label `The hour holds`; patron eyebrows on Open rows: `HYGIEIA`, `MNEMOSYNE`, `ATHENA`, `ASCLEPIUS` (irritated only), `HYPNOS`. |
| EA-202 | **Apollo Morning Threshold** — Morning Flow Light step eyebrow `APOLLO`; title `Let the day come into view.`; invitations rewritten around first light and clarity at threshold. |
| EA-202 | **Mnemosyne Status Copy** — Chronicle status reads `Left · [time]` in bronze; resurfacing label changed to `A week ago`. |
| EA-203 | **Chronicle Archive Copy** — Drift header `What remains`; search placeholder `Search what was left`; back button `Return to archive`; empty/no-result states softened. |
| EA-204 | **Light/Water Residue Cleanup** — dead standalone Light CSS/JS removed; Light daylight sync merge fixed to preserve valid `daylight` value; Water confirmed legacy-only. SW → `elysium-v112`. |

---

## 9 · Ticket Workflow

Every future Claude session working on an EA ticket must follow these steps in order:

1. **Read CLAUDE.md first.** Do not inspect source files or propose changes before reading this file.
2. **For UI/design tickets:** Read `design/obsidian-temple/design-system.md` and `implementation-map.md`.
3. **For continuity/memory/atmosphere tickets:** Read `docs/continuity-constitution.md`. The proposal must pass all Six Tests in §27.2. Failing any one is grounds for rejection.
4. **Read relevant source files.** Inspect only the files and sections relevant to the ticket scope.
5. **Propose before editing.** List exact changes (copy strings, function signatures, HTML structure) and wait for explicit user approval. Do not apply any edit before approval is given.
6. **Keep changes small and reversible.** One concern per ticket. Do not refactor surrounding code, add speculative features, or clean up unrelated sections.
7. **After implementation, provide:**
   - Changed files table
   - Exact diff summary per file
   - Confirmation checklist (state shape, constraints, no regressions)
8. **Update the ticket log:** Add a one-line summary row to section 8 of this file, and a full implementation-notes row to `docs/ticket-log.md`.

---

## 10 · Next / Deferred

| Ticket | Status | Description |
|---|---|---|
| EA-205 | Planned | **Morning Flow patron arc** — Light step eyebrow `APOLLO`, Care step `HYGIEIA`, Chronicle step `MNEMOSYNE` within the flow modal steps |
| EA-206 | Planned | **Daily Arc Patron Identity** — period-gated Temple CTA copy shaped by patron (Apollo for morning open, Hypnos for close, Kairos for Today) |
| EA-207 | **Deferred** | **Today Morning Apollo Row** — add Apollo/Light row to Today OPEN morning section; deferred pending decision on whether triggering Morning Flow from Today is appropriate |

**Standing constraints for all future work:**
- Water remains dormant. Do not add a standalone Water surface or re-introduce Water into active flows without documented justification of real utility.
- Apollo has no standalone modal or Temple card. Light is accessible only via Morning Flow Step 1. Do not add a standalone Apollo/Light surface.
- Do not return to a decorative ritual loop model. New features must pass both patron gates (utility + form). Atmospheric surfaces that carry no real job are forbidden even if they feel thematically appropriate.
- Future patron identity work should refine the copy and shape of existing surfaces, not add new ceremony for its own sake.
- The app's correction arc (over-ritualized → practical myth-shaped) must not reverse. Every ticket should make the app more useful, not more elaborate.
