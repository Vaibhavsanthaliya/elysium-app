---
name: elysium-ui-design
description: Use this skill for any Elysium UI, visual, or styling ticket — including layout refinement, typography, color, spacing, motion, component polish, and aesthetic direction. Produces restrained, premium, Greek-mythology-inspired UI guidance without fantasy-game visuals or mythology clichés. Do NOT use this skill for logic, state, storage, sync, service worker, or skincare-behavior changes — those are out of scope and must be left untouched.
---

# Elysium UI Design

This skill guides Claude through Elysium UI and visual work. The aesthetic target is restrained and premium — Greek mythology used as atmosphere, never as illustration. Think the hush of a temple at dawn, not a fantasy game. Apple-like clarity is the baseline; mythology is the seasoning, not the dish.

## 0. Read first

Before doing anything in an Elysium UI ticket, read `CLAUDE.md` at the repo root. It is the source of truth for project conventions, scope rules, and any constraints not captured here. If anything in this skill conflicts with `CLAUDE.md`, `CLAUDE.md` wins.

## 1. Aesthetic philosophy

- **Atmospheric, not literal.** Mythology shows up as mood, material, and language — never as illustration. No gods, no lightning, no laurels, no columns drawn in the UI.
- **Restraint reads as premium.** Quietness, weight, and precision communicate quality. Ornament communicates effort, which is the opposite.
- **One memorable detail per surface.** A single deliberate flourish beats five decorative ones. If a detail can be removed and the surface still feels right, remove it.
- **Clarity is non-negotiable.** Mood never costs the user legibility, contrast, or task speed. If atmosphere fights usability, atmosphere loses.

## 2. Material & language register

Use these as visual cues, microcopy register, and naming inspiration — not as literal imagery.

- **Materials:** obsidian, marble, ivory, bronze, alabaster, basalt, weathered gold, vellum
- **Light:** temple light, dawn, dusk, lamp-light, hush, gloaming
- **Concepts:** oracle, chronicle, ritual, threshold, vow, rite, ledger, vigil

Good uses: an empty state titled "The chronicle begins here." A loading shimmer the color of dawn on marble. A primary surface the deep matte of obsidian. A success state called "Rite complete."

Bad uses: a logo with a lightning bolt. A laurel wreath around the avatar. A button labeled "Summon Zeus." A column-shaped divider. Anything that names a specific god.

## 3. Visual guardrails — never produce

- Cartoon gods, mythological characters, or figural illustration
- Zeus / lightning / thunderbolt motifs
- Fantasy-game UI: ornate gilded frames, rune borders, scrollwork, gem icons
- Parchment, aged-paper, or "scroll" textures
- Heavy lore copy, faux-archaic language, "thou/thee/hark"
- Random decorative clutter — corner flourishes, divider ornaments, filler iconography
- Low-contrast aesthetic choices that hurt legibility (gold on ivory, bronze on marble for body text, sub-4.5:1 text contrast)
- More than one display flourish per screen
- Centered everything — symmetry as a substitute for hierarchy

## 4. Implementation guardrails

- **One surface at a time.** Change the screen or component the ticket names. Do not touch sibling surfaces "while you're in there."
- **Scope CSS to the active surface.** No edits to global tokens, base resets, or shared utilities unless the ticket explicitly approves it.
- **No JavaScript changes** unless the ticket requires them. UI tickets are CSS-and-markup tickets by default.
- **No HTML structure changes** unless required and approved. Prefer styling existing markup over restructuring it.
- **No new dependencies, build tools, fonts loaded from new sources, or asset pipelines** without explicit approval.
- **Avoid modifying protected runtime files** in UI tickets unless the ticket explicitly requires it. UI tickets should prefer scoped styles in `styles.css`. HTML changes must be minimal, surface-scoped, and approved in the proposal. JavaScript, state, storage, sync, service worker, manifest, and deployment files must not be changed unless explicitly approved.
- **Protect app logic, state, storage, sync, service-worker behavior, and any skincare-tracking behavior.** UI work must not alter what the app does, only how it looks.
- **Keep diffs small and reversible.** A reviewer should be able to revert the change in a single commit without collateral damage.

## 5. Propose before editing

For every Elysium UI ticket, post a proposal first and wait for approval before writing code. The proposal must contain, in this order:

1. **Current UI diagnosis** — what the surface looks like now and what specifically is weak (be concrete: "the card header competes with the title weight," not "it feels off").
2. **Proposed visual changes** — the smallest set of changes that resolves the diagnosis, described in plain language plus the design rationale tying it to the aesthetic philosophy in §1.
3. **Exact files and selectors affected** — file paths and CSS selectors (or component names) that will change. If a token or variable is involved, name it.
4. **Why the change remains in scope** — one or two sentences confirming the change touches only the ticket's surface and respects §4.
5. **Risks / what could become cringe** — honest failure modes. If a choice is one step away from "fantasy game" or "low contrast," say so and say how it's being avoided.
6. **Manual smoke test checklist** — the exact things a reviewer should click, hover, resize, and read to confirm nothing regressed visually or functionally on this surface.

If the ticket is genuinely trivial (a single value change like a spacing token on one component), the proposal can be two or three sentences — but it still goes first.

## 6. Execution defaults

When approval lands and code is written:

- **Typography:** a single restrained serif or transitional sans for display (something with weight and quietness — not Trajan, not Cinzel, those are the obvious traps); a clean neutral for body. Never both flashy. Pair display weight 500–600 with body weight 400 for premium hush.
- **Color:** dominant neutral surface (obsidian-near-black, ivory, or marble), one bronze or weathered-gold accent used sparingly for emphasis only — never for body text, never on a comparable-luminance background. Verify text contrast meets WCAG AA (4.5:1 for body, 3:1 for large text) before shipping.
- **Spacing:** generous. When in doubt, add space rather than ornament.
- **Motion:** slow, few, intentional. A 400–600ms ease-out fade on entry beats a dozen micro-interactions. Respect `prefers-reduced-motion`.
- **Iconography:** thin-stroke, geometric, single weight. Never filled-gold ornamental icons.
- **Decoration:** a single fine rule, a quiet divider, or a soft directional gradient is plenty. If the surface needs more than that to feel right, the type and spacing aren't doing their job yet — fix those first.

## 7. Anti-pattern self-check

Before submitting a proposal or a diff, Claude runs this check and resolves any "yes" before continuing:

- Does this look like it could appear in a video game's main menu?
- Would this read as "Greek mythology" to someone who saw it for two seconds with no context? (It should read as "premium app" first; mythology should only land on a closer look.)
- Is there any element on the surface that exists purely for decoration?
- Is the accent color doing work, or is it just sprinkled around?
- Could a colorblind user or a tired user at low brightness still read every piece of text comfortably?
- Did the change creep beyond the ticket's surface?

A "yes" to any of these means revise before posting.

## 8. After the change

Once code is written:

- List every file changed, with a one-line summary per file.
- Confirm explicitly that no protected logic, state, storage, sync, service worker, manifest, or deployment behavior was modified. If `styles.css` or `index.html` changed, confirm the change was scoped to the approved UI surface.
- Re-state the manual smoke test from the proposal so the reviewer can run it without scrolling back.
- If anything during implementation forced a deviation from the approved proposal, call it out at the top, not buried at the bottom.
