// Elysium — Six new logo mark directions.
// Each is built strictly from the Obsidian Temple visual vocabulary:
// a hairline circle (the medallion), one extra carved element, one
// optional bronze pip. No gradients, no figural imagery, no fantasy
// vocabulary. Each lives equally well at 16px and 1024px because each
// is at most three primitives.
//
// Naming is material/instrument, not mythological — meridian, vault,
// tablet, compass — to stay flush with the Obsidian Temple rule that
// names should evoke instrument and architecture, not characters.

// ─────────────────────────────────────────────────────────────
// 1 · MERIDIAN
// A vertical hairline (the gnomon) bisects a circle, with one
// bronze pip at the top. Reads as: the still axis, the pole, the
// sundial's pole that casts the shadow that makes time visible.
// The mark of the moment held inside the cycle.
// ─────────────────────────────────────────────────────────────
const LogoMeridian = ({ size = 96, color = 'var(--bronze)', stroke = 1.5, dot = true }) => {
  const s = size, cx = s / 2, cy = s / 2;
  const r = s * 0.42;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={stroke} fill="none" />
      <line x1={cx} x2={cx} y1={cy - r * 1.02} y2={cy + r * 1.02}
            stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      {dot && <circle cx={cx} cy={cy - r} r={stroke * 1.3} fill={color} />}
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────
// 2 · CONJUNCTION
// Two circles, the second offset upward by ~25% of the radius.
// Reads as: the moment of alignment (sun meeting moon), the
// vesica overlap, two readings of the same hour. Carries the
// app's "two themes / one ritual" duality.
// ─────────────────────────────────────────────────────────────
const LogoConjunction = ({ size = 96, color = 'var(--bronze)', stroke = 1.5 }) => {
  const s = size, cx = s / 2;
  const r = s * 0.32;
  const cyA = s * 0.55, cyB = s * 0.45;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block' }}>
      <circle cx={cx} cy={cyA} r={r} stroke={color} strokeWidth={stroke} fill="none" />
      <circle cx={cx} cy={cyB} r={r} stroke={color} strokeWidth={stroke} fill="none"
              strokeOpacity="0.55" />
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────
// 3 · PHASES
// A hairline ring with four bronze pips at the cardinal positions.
// Reads as: the fourfold day (dawn, noon, dusk, night), the compass
// rose, the cycle anchored at its hinges. Quietest of the new marks
// — distinguishable from Orbit because the eye reads four pips, not
// a single trajectory.
// ─────────────────────────────────────────────────────────────
const LogoPhases = ({ size = 96, color = 'var(--bronze)', stroke = 1.5 }) => {
  const s = size, cx = s / 2, cy = s / 2;
  const r = s * 0.40;
  const pip = stroke * 1.25;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={stroke} fill="none" />
      <circle cx={cx} cy={cy - r} r={pip} fill={color} />
      <circle cx={cx + r} cy={cy} r={pip} fill={color} />
      <circle cx={cx} cy={cy + r} r={pip} fill={color} />
      <circle cx={cx - r} cy={cy} r={pip} fill={color} />
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────
// 4 · TABLET
// A small bronze diamond (square rotated 45°) inset inside a
// hairline circle. Reads as: the carved inlay, the pictogram
// surface of a medallion, sacred geometry of order held inside
// continuity. The most coin-stamp of the set.
// ─────────────────────────────────────────────────────────────
const LogoTablet = ({ size = 96, color = 'var(--bronze)', stroke = 1.5, filled = true }) => {
  const s = size, cx = s / 2, cy = s / 2;
  const r = s * 0.42;
  const d = s * 0.16; // diamond half-extent
  const path = `M ${cx} ${cy - d} L ${cx + d} ${cy} L ${cx} ${cy + d} L ${cx - d} ${cy} Z`;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={stroke} fill="none" />
      {filled
        ? <path d={path} fill={color} />
        : <path d={path} fill="none" stroke={color} strokeWidth={stroke} strokeLinejoin="round" />}
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────
// 5 · VAULT
// A semicircular arc rising over a horizontal hairline. Reads
// as: the threshold lintel, the temple dome at dawn, the door
// opening. The most architectural mark — closest in feeling to
// the Apple Journal / Aesop quietness target.
// ─────────────────────────────────────────────────────────────
const LogoVault = ({ size = 96, color = 'var(--bronze)', stroke = 1.5, withDot = false }) => {
  const s = size, cx = s / 2, cy = s * 0.58;
  const r = s * 0.34;
  const baseY = cy;
  const arcPath = `M ${cx - r} ${baseY} A ${r} ${r} 0 0 1 ${cx + r} ${baseY}`;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block' }}>
      <path d={arcPath} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" />
      <line x1={cx - r * 1.32} x2={cx + r * 1.32} y1={baseY} y2={baseY}
            stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      {withDot && <circle cx={cx} cy={baseY - r} r={stroke * 1.2} fill={color} />}
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────
// 6 · COMPASS
// Four thin radial strokes from a central point, each terminating
// short of the rim of an implied disc, with one filled bronze pip
// at center. Reads as: the four cardinal points, the radial of the
// astrolabe, the still center radiating attention outward. Reads as
// a stylized asterisk / radial without being literal compass-rose.
// ─────────────────────────────────────────────────────────────
const LogoCompass = ({ size = 96, color = 'var(--bronze)', stroke = 1.5, ringed = true }) => {
  const s = size, cx = s / 2, cy = s / 2;
  const r = s * 0.42;
  const armOuter = r * 0.92, armInner = r * 0.22;
  const arm = (x1, y1, x2, y2) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={color} strokeWidth={stroke} strokeLinecap="round" />
  );
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block' }}>
      {ringed && (
        <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={stroke}
                strokeOpacity="0.35" fill="none" />
      )}
      {arm(cx, cy - armOuter, cx, cy - armInner)}
      {arm(cx, cy + armInner, cx, cy + armOuter)}
      {arm(cx - armOuter, cy, cx - armInner, cy)}
      {arm(cx + armInner, cy, cx + armOuter, cy)}
      <circle cx={cx} cy={cy} r={stroke * 1.3} fill={color} />
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────
// Reusable: an app-icon container that accepts any mark
// (a more generic version of AppIcon in auth-logos.jsx that
//  doesn't hard-code Aperture).
// ─────────────────────────────────────────────────────────────
const IconTile = ({
  size = 180,
  theme = 'obsidian',
  Mark = LogoMeridian,
  stroke = null,           // auto-scales to icon size if null
  showSafeArea = false,
  flatten = false,         // true = no inner radial light (for tiny icons)
}) => {
  const isObs = theme === 'obsidian';
  const radius = size * 0.2237;
  const markSize = Math.round(size * 0.52);
  const calcStroke = stroke ?? Math.max(1.0, size * 0.011);
  const color = isObs ? '#D8B47A' : '#8A6A40';
  const bg = isObs
    ? 'radial-gradient(ellipse at 50% 18%, #1f1b16 0%, #0E0E12 55%, #08080b 100%)'
    : 'radial-gradient(ellipse at 50% 18%, #FBF6EA 0%, #F4EFE6 55%, #E6DFCF 100%)';
  const inset = isObs
    ? 'inset 0 1px 0 rgba(201,165,107,0.18), inset 0 -8px 24px rgba(0,0,0,0.35), 0 24px 48px -16px rgba(0,0,0,0.55)'
    : 'inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -10px 24px rgba(160,122,74,0.10), 0 24px 48px -16px rgba(70,55,30,0.25)';
  return (
    <div style={{
      width: size, height: size,
      borderRadius: radius,
      background: flatten ? (isObs ? '#0E0E12' : '#F4EFE6') : bg,
      boxShadow: flatten ? 'none' : inset,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {!flatten && (
        <div style={{
          position: 'absolute', inset: 0,
          background: isObs
            ? 'radial-gradient(ellipse at 50% 0%, rgba(201,165,107,0.18), transparent 55%)'
            : 'radial-gradient(ellipse at 50% 0%, rgba(160,122,74,0.10), transparent 55%)',
          pointerEvents: 'none',
        }} />
      )}
      {showSafeArea && (
        <>
          <div style={{
            position: 'absolute', inset: `${size * 0.10}px`,
            border: `1px dashed ${isObs ? 'rgba(216,180,122,0.35)' : 'rgba(138,106,64,0.35)'}`,
            borderRadius: radius * 0.78,
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            width: size * 0.62, height: size * 0.62,
            border: `1px dashed ${isObs ? 'rgba(216,180,122,0.5)' : 'rgba(138,106,64,0.5)'}`,
            borderRadius: '50%',
            pointerEvents: 'none',
          }} />
        </>
      )}
      <Mark size={markSize} color={color} stroke={calcStroke} />
    </div>
  );
};

Object.assign(window, {
  LogoMeridian, LogoConjunction, LogoPhases,
  LogoTablet, LogoVault, LogoCompass,
  IconTile,
});
