// Ritual glyphs — abstract, coin-stamp style.
// Greek mythology by association only; no literal imagery.

const Glyph = ({ name, size = 28, stroke = 1.25, ...rest }) => {
  const props = {
    width: size, height: size,
    viewBox: '0 0 32 32',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: stroke,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    ...rest,
  };
  switch (name) {
    case 'care': // open vessel — Hygieia bowl abstracted
      return (
        <svg {...props}>
          <circle cx="16" cy="16" r="10" />
          <path d="M9 14 Q16 11 23 14" />
        </svg>
      );
    case 'body': // triangle of stance
      return (
        <svg {...props}>
          <path d="M16 7 L25 24 L7 24 Z" />
          <path d="M12 24 L20 24" strokeWidth={stroke * 1.4} />
        </svg>
      );
    case 'mind': // diamond on horizon
      return (
        <svg {...props}>
          <path d="M16 7 L23 16 L16 25 L9 16 Z" />
          <line x1="9" y1="16" x2="23" y2="16" />
        </svg>
      );
    case 'sleep': // crescent
      return (
        <svg {...props}>
          <path d="M23 18 A9 9 0 1 1 14 7 A7 7 0 0 0 23 18 Z" />
        </svg>
      );
    case 'light': // sun disc with corona dots
      return (
        <svg {...props}>
          <circle cx="16" cy="16" r="5" />
          <circle cx="16" cy="6" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="16" cy="26" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="6" cy="16" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="26" cy="16" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="9" cy="9" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="23" cy="9" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="9" cy="23" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="23" cy="23" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'water': // two stacked arcs
      return (
        <svg {...props}>
          <path d="M6 13 Q11 9 16 13 T26 13" />
          <path d="M6 19 Q11 15 16 19 T26 19" />
        </svg>
      );
    case 'chronicle': // concentric / spiral
      return (
        <svg {...props}>
          <circle cx="16" cy="16" r="10" />
          <circle cx="16" cy="16" r="5.5" />
          <circle cx="16" cy="16" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return <svg {...props}><circle cx="16" cy="16" r="9" /></svg>;
  }
};

// Each ritual: id, label (user-facing), archetype (subtle subtitle), glyph, description
const RITUALS = [
  { id: 'light',     label: 'Light',     archetype: 'Apollo',     glyph: 'light',     blurb: 'The first hour. Sun on skin.' },
  { id: 'care',      label: 'Care',      archetype: 'Hygieia',    glyph: 'care',      blurb: 'Skin, body, the slow attention.' },
  { id: 'body',      label: 'Body',      archetype: 'Atlas',      glyph: 'body',      blurb: 'Movement, weight, breath.' },
  { id: 'mind',      label: 'Mind',      archetype: 'Athena',     glyph: 'mind',      blurb: 'Focused work. One thing at a time.' },
  { id: 'water',     label: 'Water',     archetype: 'Poseidon',   glyph: 'water',     blurb: 'Hydration through the day.' },
  { id: 'sleep',     label: 'Sleep',     archetype: 'Hypnos',     glyph: 'sleep',     blurb: 'Wind-down. Returning home.' },
  { id: 'chronicle', label: 'Chronicle', archetype: 'Mnemosyne',  glyph: 'chronicle', blurb: 'One note. What today asked.' },
];

Object.assign(window, { Glyph, RITUALS });
