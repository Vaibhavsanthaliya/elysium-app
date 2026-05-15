# Obsidian Temple — Design System

All values are extracted directly from the concept source files.
Canonical source: `/Users/macm92/Downloads/elysium-app-concept/tokens.css`, `prototype-base.css`, `prototype-screens.css`.

---

## Typography

Three fonts. Each has exactly one job. Never mix their roles.

### Font stack

```
DM Sans         — body, UI labels, headings (weights 300–700)
Spectral        — display italic only: ring numbers, stat values, heading accent word,
                  section primary label, milestone index, chronicle textarea + entries
JetBrains Mono  — all meta/eyebrow labels: dates, stat labels, section right-meta,
                  cycle-day labels, version line, back button, legend text
```

Google Fonts import (place in `<head>` before styles):
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Spectral:ital,wght@0,300;0,400;0,500;1,400;1,500;1,600&family=JetBrains+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
```

### Type roles and specs

#### Eyebrow / meta label
```css
font-family: 'JetBrains Mono', monospace;
font-size: 10px;          /* 10–10.5px in the concept */
letter-spacing: 0.22em;   /* 0.18–0.24em range across uses */
text-transform: uppercase;
color: var(--bronze);     /* always bronze */
font-weight: 400;
```
Used for: date line above heading, stat-label, section right-meta, cycle-day-label, legend text, version line.

#### Page heading
```css
/* Container */
/* Line 1: eyebrow (see above) */

/* Line 2: main heading */
font-family: 'DM Sans', sans-serif;
font-weight: 500;           /* NOT 700 — the concept reads lighter than iOS bold */
font-size: 28–32px;         /* 28px detail screens, 32px home */
letter-spacing: -0.02em;
color: var(--ink);

/* The accent word inside the heading — Spectral italic */
font-family: 'Spectral', serif;
font-style: italic;
font-weight: 400;
color: var(--bronze);

/* Line 3: sub-text */
font-family: 'DM Sans', sans-serif;
font-weight: 400;
font-size: 13–14px;
color: var(--ink-muted);
```

Example heading HTML pattern:
```html
<div class="eyebrow">THURSDAY · 15 MAY</div>
<h1>Today's <span class="ital">temple</span></h1>
<p>72% kept. Tonight's care is salicylic — a light hand.</p>
```

The Spectral italic accent word is always the *concept noun* of the screen:
- Temple → *temple*
- Cycle → *wheel*
- Chronicle → *chronicle*
- Progress → *stars*
- Settings → *Settings* (italic only)

#### Section header
```css
/* Left label — Spectral italic */
font-family: 'Spectral', serif;
font-style: italic;
font-size: 17px;
color: var(--ink);

/* Right meta — JetBrains Mono */
font-family: 'JetBrains Mono', monospace;
font-size: 10px;
letter-spacing: 0.18em;
text-transform: uppercase;
color: var(--ink-faint);
```
Example: left "The other six" / right "06 PATRONS"

#### Ring / progress number (inside SVG ring)
```css
font-family: 'Spectral', serif;
font-style: italic;
font-size: 28px;
color: var(--ink);
line-height: 1;
```
The `%` suffix: JetBrains Mono, 10px, bronze, positioned top-right of the number.

#### Stat value (Stars/Progress screen)
```css
font-family: 'Spectral', serif;
font-style: italic;
font-size: 26px;
color: var(--bronze);
line-height: 1;
```

#### Milestone index (roman numeral)
```css
font-family: 'Spectral', serif;
font-style: italic;
font-size: 18px;
color: var(--bronze);
text-align: center;
width: 28px;
```
Values: I, II, III, IV (not Arabic numerals, not a dot).

#### Chronicle textarea + entry body
```css
font-family: 'Spectral', serif;
font-style: italic;     /* entries are always italic */
font-size: 15px;        /* textarea */ / 14px  /* past entries */
color: var(--ink);
line-height: 1.55;
/* Placeholder: also Spectral italic, var(--ink-faint) */
```

#### Archetype subtitle (ritual cards)
```css
font-family: 'Spectral', serif;
font-style: italic;
font-size: 12–13px;
color: var(--ink-faint);
letter-spacing: 0.02em;
```
This is the secondary label on each ritual card (e.g. "Hygieia", "Apollo"). Never the primary label.

---

## Colour tokens

### Obsidian theme (dark)
Source: `tokens.css` `[data-theme="obsidian"]`

```css
--bg:               #0E0E12;                        /* page floor — NOT pure black */
--bg-soft:          #131318;                        /* one step above floor */
--surface:          #1A1A21;                        /* card / module background */
--surface-2:        #22222B;                        /* elevated card or nested surface */
--ink:              #ECE6D9;                        /* primary text — warm off-white */
--ink-muted:        rgba(236, 230, 217, 0.62);      /* secondary text */
--ink-faint:        rgba(236, 230, 217, 0.40);      /* tertiary text / placeholders */
--bronze:           #C9A56B;                        /* champagne gold — NOT orange-amber */
--bronze-dim:       #8A704A;                        /* dimmed / ghost bronze */
--separator:        rgba(236, 230, 217, 0.08);      /* barely-there warm hairline — 8% only */
--separator-strong: rgba(236, 230, 217, 0.16);      /* stronger warm hairline */
--shadow-card:      0 30px 60px -20px rgba(0, 0, 0, 0.6);
--glow-bronze:      0 0 24px -4px rgba(201, 165, 107, 0.28);
--temple-grad:      radial-gradient(ellipse at 50% -10%, rgba(201, 165, 107, 0.10), transparent 60%);
```

### Marble theme (light)
Source: `tokens.css` `[data-theme="marble"]`

```css
--bg:               #F4EFE6;                        /* warm stone — NOT iOS #f2f2f7 */
--bg-soft:          #EBE4D6;                        /* slightly deeper warm stone */
--surface:          #FFFFFF;                        /* card surface — white */
--surface-2:        #FAF6EC;                        /* warm white for nested surfaces */
--ink:              #1A1816;                        /* near-black warm ink */
--ink-muted:        rgba(26, 24, 22, 0.62);         /* secondary text */
--ink-faint:        rgba(26, 24, 22, 0.36);         /* tertiary / placeholders */
--bronze:           #A07A4A;                        /* warm bronze — NOT red-brown */
--bronze-dim:       #C9A56B;                        /* lighter bronze (reversed from dark) */
--separator:        rgba(26, 24, 22, 0.10);         /* ink-warm hairline */
--separator-strong: rgba(26, 24, 22, 0.20);         /* stronger ink-warm hairline */
--shadow-card:      0 20px 40px -16px rgba(70, 55, 30, 0.18);
--glow-bronze:      0 0 20px -4px rgba(160, 122, 74, 0.18);
--temple-grad:      radial-gradient(ellipse at 50% -10%, rgba(160, 122, 74, 0.10), transparent 60%);
```

### Critical delta — where the current app deviates most

| Token | Concept (dark) | Current app (dark) | Delta |
|---|---|---|---|
| `--bg` | `#0E0E12` | `#000000` | Pure black is flat; obsidian has depth |
| `--separator` | `rgba(236,230,217,0.08)` | `rgba(84,84,88,0.60)` | 7.5× too heavy; cold not warm |
| `--bronze` | `#C9A56B` | `#c9903e` | Too orange; should be champagne |
| `--surface` | `#1A1A21` | `#1c1c1e` | Close but iOS cool cast |

| Token | Concept (light) | Current app (light) | Delta |
|---|---|---|---|
| `--bg` | `#F4EFE6` | `#ede8df` | Close; concept is slightly warmer |
| `--bronze` | `#A07A4A` | `#a0722a` | Close; current is slightly more red-brown |
| `--separator` | `rgba(26,24,22,0.10)` | `rgba(95,70,28,0.13)` | Close; current has bronze tint vs neutral ink |

---

## Spacing and radius

```css
/* Radius */
--r-xs: 6px;
--r-sm: 10px;
--r-md: 14px;   /* default card radius */
--r-lg: 20px;   /* featured card, large surfaces */
--r-xl: 28px;

/* Spacing */
--s-1: 4px;   --s-2: 8px;   --s-3: 12px;  --s-4: 16px;
--s-5: 20px;  --s-6: 24px;  --s-7: 32px;  --s-8: 44px;
```

---

## Component patterns

### Ambient temple light
Applied as `::before` on the app shell (or as a background layer). Always the first visual layer.

```css
background: var(--temple-grad);
/* = radial-gradient(ellipse at 50% -10%, rgba(201,165,107,0.10), transparent 60%) */
position: absolute;
inset: 0;
pointer-events: none;
z-index: 0;
```

### Tab bar
```css
border-top: 1px solid var(--separator);
background: rgba(14, 14, 18, 0.6);        /* obsidian */
background: rgba(244, 239, 230, 0.7);      /* marble */
backdrop-filter: blur(12px);
padding: 10px 14px 22px;                  /* safe area bottom handled separately */

/* Inactive tab */
color: var(--ink-faint);

/* Active tab */
color: var(--bronze);

/* Tab label */
font-size: 10px;
font-weight: 500;
letter-spacing: 0.02em;

/* Tab icon */
width: 20px; height: 20px;
stroke-width: 1.5;                        /* inactive */
stroke-width: 1.7;                        /* active */
```

### Medallion (circular icon container)
```css
/* Base */
width: 44px; height: 44px;   /* sm: 32px / lg: 56px / xl: 88px */
border-radius: 50%;
border: 1px solid var(--separator-strong);
background: var(--bg-soft);
color: var(--bronze);
display: flex; align-items: center; justify-content: center;

/* Bronzed variant (featured card, ritual detail) */
background: linear-gradient(160deg, #2a221a, #1a1612);   /* obsidian */
box-shadow: var(--glow-bronze), inset 0 0 0 1px rgba(201, 165, 107, 0.30);

/* Bronzed variant — marble */
background: linear-gradient(160deg, #f8efde, #ebdfc4);
box-shadow: 0 0 18px -2px rgba(160,122,74,0.25), inset 0 0 0 1px rgba(160,122,74,0.30);
```

### Ritual card (Temple home — secondary)
```css
display: flex;
align-items: center;
gap: 14px;
padding: 14px 16px;
background: var(--surface);
border: 1px solid var(--separator);
border-radius: var(--r-md);          /* 14px */
cursor: pointer;
transition: transform 180ms ease, border-color 180ms ease;

/* Hover */
border-color: var(--separator-strong);

/* Active/press */
transform: scale(0.99);
```

### Featured Care card (Temple home — primary)
```css
background: linear-gradient(180deg, rgba(201,165,107,0.12), rgba(201,165,107,0.02));
border-color: rgba(201, 165, 107, 0.30);
border-radius: var(--r-lg);          /* 20px */
padding: 18px;
margin-bottom: 8px;

/* Marble theme */
background: linear-gradient(180deg, rgba(160,122,74,0.10), rgba(160,122,74,0.02));
border-color: rgba(160, 122, 74, 0.35);
```

### Mini progress arc (per ritual card)
```css
/* SVG, 28×28, stroke 2.5 */
/* Track: var(--separator-strong) */
/* Fill: var(--bronze), round linecap */
/* No rotation offset — starts at 12 o'clock */
```
Positioned right-aligned on each card, above the mono state text.

### Task row (concept — naked, no card wrapper)
```css
display: flex;
align-items: flex-start;
gap: 14px;
padding: 14px 4px;
background: none;                          /* NO card background */
border: 0;
border-bottom: 1px solid var(--separator);
width: 100%;
text-align: left;
cursor: pointer;
color: var(--ink);

/* First row also gets border-top */
border-top: 1px solid var(--separator);
```
**Note:** Tasks in the concept have no enclosing card background. They sit directly on the page background, separated only by thin warm separator lines. The current app wraps tasks in a card — this is a divergence flagged for future refinement.

### Task check circle
```css
/* Unchecked */
width: 20px; height: 20px;
border-radius: 50%;
border: 1.5px solid var(--separator-strong);
background: transparent;

/* Checked / done — BRONZE, not green */
background: var(--bronze);
border-color: var(--bronze);
color: var(--bg);  /* checkmark icon inherits this */
transition: background 180ms ease, border-color 180ms ease;
```

### Done task text
```css
color: var(--ink-faint);
text-decoration: line-through;
text-decoration-color: rgba(201, 165, 107, 0.3);   /* bronze-tint, NOT cold gray */
```

### Full progress ring (SVG)
```css
/* Track stroke */
stroke: var(--separator-strong);

/* Fill stroke */
stroke: var(--bronze);
stroke-linecap: round;
transition: stroke-dashoffset 600ms cubic-bezier(0.2, 0.7, 0.2, 1);
```
Number inside: Spectral italic 28px. `%` suffix: JetBrains Mono 10px bronze, positioned offset.

### Stat cell (4-column grid on Stars screen)
```css
padding: 14px 10px;
background: var(--surface);
border: 1px solid var(--separator);
border-radius: var(--r-md);
text-align: center;

/* Value: Spectral italic 26px, bronze */
/* Label: JetBrains Mono 8.5px, 0.16em, uppercase, ink-faint */
```
Layout: 4 columns across (not 2). Current app uses 2-column grid — divergence.

### Constellation / star grid (Stars screen)
```css
/* Container */
background: var(--bg-soft);
border: 1px solid var(--separator);
border-radius: var(--r-lg);
padding: 18px;
overflow: hidden;
position: relative;

/* SVG constellation lines: stroke var(--bronze), strokeWidth 0.5, opacity 0.35 */

/* Star cell — empty */
background: transparent;
border: 1px solid var(--separator);
border-radius: 50%;
aspect-ratio: 1;

/* Star cell — half-kept */
background: rgba(201, 165, 107, 0.4);
border: 1px solid rgba(201, 165, 107, 0.6);

/* Star cell — fully kept */
background: var(--bronze);
box-shadow: 0 0 6px rgba(201, 165, 107, 0.4);
```

### Milestone row
```css
display: flex;
align-items: center;
gap: 14px;
padding: 14px 16px;
background: var(--surface);
border: 1px solid var(--separator);
border-radius: var(--r-md);

/* Done milestone — bronze gradient */
background: linear-gradient(180deg, rgba(201,165,107,0.08), rgba(201,165,107,0.02));
border-color: rgba(201, 165, 107, 0.25);

/* Index: Spectral italic 18px, bronze, width 28px */
/* Title: DM Sans 600, 14.5px, -0.01em */
/* Sub: JetBrains Mono 9.5px, 0.15em, uppercase, ink-faint */
/* Done tick: circular, background var(--bronze), color var(--bg) */
```

### Chronicle prompt card
```css
border: 1px dashed rgba(201, 165, 107, 0.3);
border-radius: var(--r-md);
padding: 16px 18px;
margin-bottom: 12px;
background: rgba(201, 165, 107, 0.04);

/* Marble */
background: rgba(160, 122, 74, 0.05);
border-color: rgba(160, 122, 74, 0.3);

/* Eyebrow: JetBrains Mono 9.5px, 0.22em, bronze, uppercase */
/* Question: Spectral italic 18px, ink, line-height 1.35 */
```

### Chronicle textarea
```css
width: 100%;
background: var(--surface);
border: 1px solid var(--separator);
border-radius: var(--r-md);
padding: 14px 16px;
font-family: 'Spectral', serif;
font-style: italic;                /* placeholder is also Spectral italic */
font-size: 15px;
color: var(--ink);
line-height: 1.55;
resize: none;
outline: none;
transition: border-color 180ms ease;

/* Focus */
border-color: rgba(201, 165, 107, 0.5);
box-shadow: 0 0 0 3px rgba(201, 165, 107, 0.10);
```

### Past entry (Chronicle — "Recently kept")
```css
padding: 14px 16px;
background: var(--surface);
border: 1px solid var(--separator);
border-radius: var(--r-md);

/* Meta row: JetBrains Mono 9.5px, 0.20em, uppercase, ink-faint */
/* Tag: color var(--bronze) */
/* Body: Spectral italic 14px, ink, line-height 1.5 */
```

### Settings card + row
```css
/* Card */
background: var(--surface);
border: 1px solid var(--separator);
border-radius: var(--r-md);
overflow: hidden;

/* Row */
display: flex;
align-items: center;
justify-content: space-between;
padding: 14px 16px;
border-bottom: 1px solid var(--separator);

/* Row name: DM Sans 14.5px, ink */
/* Row sub: DM Sans 11.5px, ink-muted */

/* Danger row name: color #d97a5e — desaturated rust, NOT pure --red */

/* Version: JetBrains Mono 9.5px, 0.22em, uppercase, ink-faint; padding: 28px 0 16px */
```

### Ritual glyph library
All glyphs: `viewBox="0 0 32 32"`, `fill="none"`, `stroke="currentColor"`, `strokeWidth=1.25`, round caps/joins.
Color is always `currentColor` (inherits bronze from medallion parent).

| Glyph | Description |
|---|---|
| `care` | Open circle (r=10) + inner arc — Hygieia's bowl abstracted |
| `body` | Upright triangle + thick horizontal base line |
| `mind` | Diamond (rotated square) + horizontal bisector line |
| `sleep` | Crescent moon path |
| `light` | Small center circle (r=5) + 8 filled dot corona at cardinal/diagonal positions |
| `water` | Two stacked sine-wave arcs |
| `chronicle` | Three concentric circles + filled center dot |

---

## Screenshot reference

**`/Users/macm92/Downloads/elysium-app-concept/.tmp/proto-temple.jpg`**
Temple home, Obsidian theme. Shows: near-black floor, thin-line dark cards, featured Care with bronze gradient border and bronzed xl medallion, JetBrains Mono eyebrow, DM Sans heading with Spectral italic "temple", 6 secondary ritual cards with mini arcs, bronze active tab.

**`/Users/macm92/Downloads/elysium-app-concept/.tmp/check-cycle.jpg`**
Cycle / Wheel screen, Obsidian theme. Shows: astrolabe radial wheel, 7 circular nodes, active nodes filled bronze with glow, done nodes bronze-tint, ghost pending nodes, Spectral italic "31%" in center, JetBrains Mono legend text, same heading pattern.
