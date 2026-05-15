# Obsidian Temple — Design Reference

This folder is the authoritative design reference for all Elysium UI work. Every EA ticket that touches visual appearance must consult these files before proposing changes.

The canonical source is the interactive prototype at:
`/Users/macm92/Downloads/elysium-app-concept/`

---

## What is Obsidian Temple

Obsidian Temple is the visual identity for Elysium — a premium personal ritual companion. The name is material, not mythological: obsidian the mineral (dark, smooth, volcanic glass), temple the architectural type (stillness, intention, threshold). The aesthetic target is a private sanctuary at dawn, not a fantasy game.

The concept exists as a fully working React prototype with two switchable themes:
- **Obsidian** — deep near-black floor (`#0E0E12`), warm ink text, champagne bronze accent
- **Marble** — warm stone background (`#F4EFE6`), white card surfaces, muted bronze accent

Both themes are defined in `tokens.css`. Both are production targets. The app currently uses `prefers-color-scheme` rather than a theme attribute; the token values are the canonical reference regardless of implementation mechanism.

---

## Visual goal

The app should feel like a considered personal object — something between a premium notebook and a scientific instrument. The atmosphere is:

- **Quiet and deliberate.** Generous whitespace. Nothing competes for attention.
- **Materially warm.** Surfaces read as stone, alabaster, or warm ink — not plastic, glass, or iOS system gray.
- **Restrained bronze.** Bronze appears once per surface as a signal, never as decoration. It marks what matters: active states, accent words, ring progress, check completions.
- **Typography with intention.** Three typefaces, each with a single job. DM Sans for everything functional. Spectral italic for display moments only. JetBrains Mono for all meta and measurement text.

The two reference screenshots in the concept folder confirm the target:

- `proto-temple.jpg` — Temple home in Obsidian theme. Near-black ground, dark surface cards, thin warm separator lines, featured Care card with bronze gradient border, JetBrains Mono eyebrow date, "Today's *temple*" in DM Sans + Spectral italic.
- `check-cycle.jpg` — The Wheel (Cycle screen) in Obsidian theme. Astrolabe radial layout, nodes filled bronze when active, Spectral italic percentage in center.

---

## What is allowed

**Atmosphere and materials:**
- Obsidian, marble, alabaster, warm stone, bronze, ink — as material metaphors expressed in color and surface
- Bronze used as the single accent: active states, ring strokes, eyebrow labels, check completions, heading accent words
- Warm near-invisible separator lines (8% opacity in dark mode, 10% in light)
- Ambient warm radial glow at the top of the app (the "temple light")
- Medallion containers (circular, bordered) for ritual/section icons
- Spectral serif italic for one word per heading and for display numbers

**Copy and naming:**
- Temple, ritual, chronicle, cycle, patron, vigil, threshold, rite, oracle, ledger
- Section right-meta labels in JetBrains Mono uppercase (e.g. "06 PATRONS", "II OF IV")
- Bronze eyebrow labels above headings (e.g. "THURSDAY · 15 MAY")
- Heading accent: "Today's *temple*", "The *wheel*", "The *chronicle*", "The *stars*"

**Interactions:**
- Slow, minimal transitions (180–200ms ease, 600ms for ring fill)
- Active states that feel bronze and warm, not blue and urgent
- Scale(0.99) on card press — subtle, weighty

---

## What is forbidden / cringe

**Never produce:**
- Cartoon gods, mythological characters, or figural illustration
- Zeus, lightning bolts, thunderbolt motifs
- Laurel wreaths, columns, parchment, aged-paper or "scroll" textures
- Zodiac, astrology, or horoscope imagery (the astrolabe in the prototype is mechanical, not astrological)
- Fantasy-game UI: gilded frames, rune borders, scrollwork, gem icons, glowing ornaments
- Faux-archaic language: "thou", "hark", "yonder", "verily"
- Heavy lore copy — dramatic backstory for a task checkbox
- Random decorative clutter: corner flourishes, divider ornaments, filler iconography
- Gold text on light backgrounds (contrast failure)
- More than one Spectral italic word per heading
- Bronze used as body text color
- iOS system blue (`#007aff`, `#0a84ff`) anywhere in the UI

**In copy:**
- No exclamation points
- No "Welcome back!" or "Great job!" language
- No emoji in UI chrome
- Never name a specific god as an interactive label (Hygieia/Apollo etc. are archetype *subtitles*, not button labels)

---

## How future tickets should use this folder

**Before proposing any UI change:**

1. Read `design-system.md` for the exact token values, type specs, and component patterns.
2. Read `implementation-map.md` to understand where the current app is relative to the concept, and what the suggested next ticket is for each element.
3. Ask: does the proposed change move the app closer to the concept or further from it? If further — justify why, or revise.

**When proposing a change:**

- Reference the concept component explicitly: "The concept's `.ritual-card.featured` uses a bronze gradient border…"
- If deviating from concept values (e.g. for technical reasons), state the deviation and the reason.
- Check the "out of scope" list in `implementation-map.md` before proposing structural/JS changes.

**Concept source files for deep reference:**
```
tokens.css              — all token values, both themes
prototype-base.css      — shared chrome: header, tab bar, medallions, rings, type classes
prototype-screens.css   — screen-specific components: ritual cards, task rows, chronicle, stars, settings
prototype.jsx           — screen structure and data model
glyphs.jsx              — ritual glyph SVG library (7 glyphs, all abstract)
```
