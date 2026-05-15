# Obsidian Temple — Implementation Map

This file tracks where the current app stands relative to the concept, element by element. Use it to plan tickets and understand what has been approximated vs fully aligned.

---

## EA-14 through EA-20 — ticket classification

| Ticket | What it did | Classification | Notes |
|---|---|---|---|
| EA-14 | Temple hero card: centered column, bronze ring, alabaster/temple-gradient surface, warm separator, 120px ring | **Partial approximation** | Direction is correct (centered, bronze ring). But uses custom `--alabaster` for light surface (concept uses white `--surface`) and `--temple-gradient` for dark (concept uses `--surface: #1A1A21`). No glyph medallion. Should remain as foundation; refine surface values when tokens are corrected. |
| EA-15 | Active tab: bronze | **Aligned** | Exact concept match: `color: var(--bronze)` on `.tab.active`. No changes needed. |
| EA-16 | Today/Care: hero card alabaster, warm separator, ring track, task list radius/shadow | **Partial approximation** | Hero card surface direction is correct. Task list gets a card background (alabaster) — the concept has no card wrapper on task rows (tasks sit directly on page background with separator lines only). This divergence is minor for now; flag for future refinement. |
| EA-17 | Chronicle: card alabaster, warm border, bronze focus ring, save button radius | **Partial approximation** | Card surface direction is right. Concept has a Spectral italic textarea and a dashed bronze prompt card above it — neither is present yet. Bronze focus ring is aligned. Foundation to keep; Spectral font and prompt card are the next step. |
| EA-18 | Progress: stat cards alabaster, calendar card alabaster, today ring bronze, milestone dot bronze + glow, photo radius | **Partial approximation** | Stat cards and calendar direction aligned. Today ring bronze aligned. Milestone treatment diverges significantly — concept uses Spectral italic roman numeral (I, II, III, IV) as the index, not a colored dot. Stat grid is 2-column in app, 4-column in concept. Foundation to keep; milestone and stat grid need replacement. |
| EA-19 | Settings: cards alabaster, warm border, oracle-text action rows, danger red, chevrons bronze, reset bronze | **Aligned** | Very close to concept. Minor remaining delta: concept's danger row color is `#d97a5e` (desaturated rust), current uses `--red` (`#ff3b30`). No structural changes needed. |
| EA-20 | Global: warms `--bg` / `--separator` / `--bg-input` in light mode; warm header/tab bar glass; task-list + cycle-card + info-card alabaster; btn-row oracle-text; btn-primary obsidian; ambient glow | **Partial approximation** | Light mode base canvas is now warmer and closer to concept. Header/tab bar de-iOS-ed. However: dark mode tokens (`--bg`, `--separator`, `--bronze`) remain entirely unchanged from iOS defaults — the most significant remaining gap. Foundation to keep; dark mode token correction is the next priority. |

**Summary:** EA-15 and EA-19 are fully aligned. EA-14, EA-16, EA-17, EA-18, EA-20 are correct in direction but are approximations — they should remain as the foundation and be refined incrementally, not replaced wholesale.

---

## Element-by-element implementation map

| Prototype element | Current app equivalent | Status | Gap | Risk | Suggested ticket |
|---|---|---|---|---|---|
| **TYPOGRAPHY** | | | | | |
| DM Sans — body/UI font | `-apple-system` (SF Pro) | Missing | Wrong warmth, wrong weight feel at 500 vs 700 | Low — CSS + one `<link>` in HTML | EA-21: Font loading |
| Spectral italic — display | None (system bold sans-serif) | Missing | Ring numbers, headings, stat values, chronicle, milestones all wrong | Low — CSS | EA-21: Font loading |
| JetBrains Mono — eyebrow/meta | None (system sans-serif) | Missing | All uppercase labels: date, stat-label, section-meta, etc. | Low — CSS | EA-21: Font loading |
| **DARK MODE TOKENS** | | | | | |
| `--bg: #0E0E12` | `#000000` (pure black) | Wrong value | Dark background too flat; surfaces don't lift | Low — token only | EA-22: Dark token pass |
| `--surface: #1A1A21` | `--bg-elevated: #1c1c1e` | Close | Slight cold iOS cast vs concept's cooler blue-dark | Low — token | EA-22 |
| `--separator: rgba(236,230,217,0.08)` | `rgba(84,84,88,0.60)` | Major gap | 7.5× too heavy; cold gray vs warm near-invisible | Low — token | EA-22 |
| `--bronze: #C9A56B` | `#c9903e` | Wrong value | Current reads orange-amber; concept is champagne-gold | Low — token | EA-22 |
| `--ink: #ECE6D9` | `--label: #ffffff` (pure white) | Close | Pure white is colder; concept is warm off-white | Low — token | EA-22 |
| **LIGHT MODE TOKENS** | | | | | |
| `--bg: #F4EFE6` | `#ede8df` | Close | Concept is slightly warmer/more amber | Low — token | EA-22 or minor refine |
| `--bronze: #A07A4A` | `#a0722a` | Close | Current is slightly more red-brown | Low — token | EA-22 |
| `--separator: rgba(26,24,22,0.10)` | `rgba(95,70,28,0.13)` | Close | Current has bronze tint vs concept's neutral ink-warm | Low — token | Optional |
| `--surface: #FFFFFF` | Cards use `--alabaster: #f8f6f1` | Close | Alabaster is warmer than concept's white cards in light mode | Low — token | Review after font pass |
| **AMBIENT ATMOSPHERE** | | | | | |
| Temple gradient `::before` on shell (10% bronze radial, ellipse at 50% -10%) | `.app` radial gradient from top (EA-20) | Partial | Gradient is in approximately right position; values close. Dark mode gradient missing entirely. | Low | Add dark mode gradient in EA-22 |
| **CHROME** | | | | | |
| Tab bar: thin separator, warm glass, 20px icons, 1.5/1.7 stroke | 26px icons, warm glass (EA-20) | Partial | Icon size larger than concept; stroke similar | Low | Optional refinement |
| Tab active: bronze | Bronze (EA-15) | Aligned | None | — | — |
| **TEMPLE / HOME SCREEN** | | | | | |
| Featured Care card: bronze gradient border, bronzed xl medallion, row layout | Hero card: alabaster surface, centered column, bronze ring (EA-14) | Partial | No medallion glyph icon; different border treatment (warm hairline vs bronze gradient); ring-only, no medallion container | Medium — HTML change needed | Future |
| Secondary ritual cards: surface + separator border + medallion + mini arc | Quick-action rows in setting-card (no mini arcs, no medallions) | Diverged | Structure is completely different — setting-card rows vs ritual cards | High — significant HTML/JS | Later |
| Mini progress arc per card | None | Missing | Each card shows a small per-ritual progress arc | High — JS needed | Later |
| Section header "The other six" / "06 PATRONS" | Section headings in bold sans | Partial | Missing Spectral italic + mono meta pattern; needs fonts first | Low — CSS | After EA-21 |
| **TODAY / CARE SCREEN** | | | | | |
| Task rows: naked on page background, separator lines only | Task list card with alabaster background (EA-16/20) | Diverged | Concept has no card wrapper — tasks are borderless rows on page bg | Low risk to change | Future refinement |
| Task check: bronze fill when done | Green fill when done | Wrong | Concept uses `var(--bronze)` — single most visible color divergence in task flows | Low — CSS only | EA-23: Bronze check state |
| Task done text: bronze-tint strikethrough | Cold gray strikethrough | Wrong | `rgba(201,165,107,0.3)` vs system color | Low — CSS only | EA-23 |
| Task text: 15px, DM Sans | 16px, system font | Close | Size close; font needs EA-21 first | Low | After EA-21 |
| **CYCLE SCREEN** | | | | | |
| Astrolabe wheel of 7 ritual nodes | 3 cycle cards (Niacinamide / Salicylic / Rest) | Out of scope | 7-ritual product model — CLAUDE.md hard constraint prohibits this | — | Never |
| Cycle card grid (3-column within Care detail) | 3 cycle cards as rows | Partial | Concept cycle strip inside Care detail is 3-column grid with roman numeral index; current is row-based list | Medium | Future |
| **CHRONICLE SCREEN** | | | | | |
| Prompt card: dashed bronze border, Spectral italic question | None | Missing | The most visually distinctive Chronicle element | Low — CSS + minor HTML | After EA-21 |
| Textarea: Spectral italic, bronze focus ring + glow | System sans-serif, bronze focus ring (EA-17) | Partial | Font missing; focus ring aligned | Low | After EA-21 |
| Past entries: Spectral italic body, mono date + bronze tag | Not present | Missing | Different data model (multiple entries vs single note) | High — JS + state change | Out of scope |
| Mood dots | Not present | Missing | New state required | High | Out of scope |
| **STARS / PROGRESS SCREEN** | | | | | |
| Stat cells: Spectral italic bronze value, mono label, 4-column grid | 2-column grid, system bold, label | Partial | Font + color wrong; grid is 2-col not 4-col | Low — CSS | After EA-21 |
| Constellation card (6×7 star grid with SVG constellation lines) | Calendar grid (7-column, date numbers) | Diverged | Completely different visual treatment — same underlying data | Medium — CSS + HTML | Later |
| Milestone: Spectral italic roman numeral index, bronze done gradient | Bronze dot + row (EA-18) | Wrong | Milestone index is I/II/III/IV in Spectral italic, not a dot; done rows have bronze gradient bg | Low — CSS | After EA-21 |
| **SETTINGS SCREEN** | | | | | |
| Settings: surface + separator border + DM Sans rows | Alabaster + warm border + oracle-text rows (EA-19) | Aligned | Very close match. Minor: danger color `#d97a5e` vs current `--red` | Low | Minor refinement |
| Version: JetBrains Mono uppercase | System sans-serif small | Missing | Needs font | Low | After EA-21 |

---

## Priority sequence

Based on impact and dependencies:

| Priority | Ticket | What it closes | Blocker for |
|---|---|---|---|
| 1 | **EA-21: Font loading** | DM Sans + Spectral + JetBrains Mono | Every typography gap in the map |
| 2 | **EA-22: Dark token correction** | `--bg`, `--separator`, `--bronze`, `--ink` in dark mode; light mode `--bg`/`--bronze` refinement; dark temple gradient | Most atmospheric dark-mode gaps |
| 3 | **EA-23: Bronze check state** | Done task check and strikethrough color | Visually correct task completion |
| 4 | **EA-24: Typography application** | Eyebrow labels → mono; section headers → Spectral italic; ring numbers → Spectral; stat values → Spectral bronze; milestone index → roman numeral | Depends on EA-21 |
| 5 | **EA-25: Chronicle prompt card** | Dashed bronze prompt card above textarea | Depends on EA-21 |
| 6 | Later | Stat grid 4-column; task rows naked (remove card wrapper); milestone bronze gradient; mini arcs | Structural refinements |
| 7 | Out of scope | Astrolabe wheel, past chronicle entries, mood dots, ritual drill-down navigation | Never or major future milestone |
