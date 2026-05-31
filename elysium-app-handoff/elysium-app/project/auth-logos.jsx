// Elysium — Logo concepts, app-icon friendly.
// Three abstract directions, all built from the existing Obsidian Temple
// visual vocabulary (medallion, hairline, bronze on obsidian / marble).
// Greek mythology is atmosphere, not iconography.

// ─────────────────────────────────────────────────────────────
// Concept A — APERTURE
// A bronze hairline crosses a circle at the golden ratio from the
// top. Reads as: threshold, dawn line, the moment the temple opens
// — and as a stylized E (an open horizon). The lowest-noise mark
// of the three; scales tightest to a 16×16 favicon.
// ─────────────────────────────────────────────────────────────
const LogoAperture = ({ size = 96, color = 'var(--bronze)', stroke = 1.5, withDot = true }) => {
  const s = size;
  const cx = s / 2, cy = s / 2;
  const r = s * 0.42;
  // Horizon at 38.2% (golden) from the top of the circle.
  const horizonY = cy - r + r * 2 * 0.382;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={stroke} fill="none" />
      <line
        x1={cx - r * 1.02} y1={horizonY}
        x2={cx + r * 1.02} y2={horizonY}
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
      />
      {withDot && (
        <circle cx={cx} cy={horizonY} r={stroke * 1.1} fill={color} />
      )}
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────
// Concept B — ORBIT
// Two concentric rings, the inner one slightly offset, with a single
// bronze dot at the dawn position. Reads as: the astrolabe, the cycle,
// one moment held inside a wider system. Closest sibling to the
// existing Cycle screen — but possibly too literal a quote of it.
// ─────────────────────────────────────────────────────────────
const LogoOrbit = ({ size = 96, color = 'var(--bronze)', stroke = 1.5 }) => {
  const s = size, cx = s / 2, cy = s / 2;
  const rOuter = s * 0.42, rInner = s * 0.26;
  const offset = s * 0.025;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={rOuter} stroke={color} strokeWidth={stroke} fill="none" />
      <circle cx={cx + offset} cy={cy - offset * 0.6} r={rInner} stroke={color} strokeWidth={stroke} strokeOpacity="0.55" fill="none" />
      <circle cx={cx} cy={cy - rOuter} r={stroke * 1.4} fill={color} />
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────
// Concept C — STELE   ("the stack")
// Three horizontal bronze hairlines of descending width, inside an
// optional ring. Reads as: monogram E, strata, the three nights of a
// cycle. Most "logo-like" of the three; risks reading as a hamburger
// menu at small sizes.
// ─────────────────────────────────────────────────────────────
const LogoStele = ({ size = 96, color = 'var(--bronze)', stroke = 1.5, ringed = true }) => {
  const s = size, cx = s / 2, cy = s / 2;
  const r = s * 0.42;
  const wTop = r * 1.08, wMid = wTop * 0.78, wBot = wTop * 0.56;
  const gap = s * 0.085;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block' }}>
      {ringed && (
        <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={stroke} strokeOpacity="0.45" fill="none" />
      )}
      <line x1={cx - wTop/2} x2={cx + wTop/2} y1={cy - gap} y2={cy - gap}
            stroke={color} strokeWidth={stroke * 1.05} strokeLinecap="round" />
      <line x1={cx - wMid/2} x2={cx + wMid/2} y1={cy} y2={cy}
            stroke={color} strokeWidth={stroke * 1.05} strokeLinecap="round"
            strokeOpacity="0.85" />
      <line x1={cx - wBot/2} x2={cx + wBot/2} y1={cy + gap} y2={cy + gap}
            stroke={color} strokeWidth={stroke * 1.05} strokeLinecap="round"
            strokeOpacity="0.70" />
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────
// Wordmark — "Elysium" set in DM Sans medium; the "ium" terminal
// flips to Spectral italic. Pairs with any of the three marks.
// ─────────────────────────────────────────────────────────────
const Wordmark = ({ size = 22, color = 'var(--ink)', accent = 'var(--bronze)', italicTail = true, letter = '-0.02em' }) => (
  <span style={{
    fontFamily: 'var(--font-sans)',
    fontSize: size,
    fontWeight: 500,
    letterSpacing: letter,
    color: color,
    lineHeight: 1,
    display: 'inline-block',
  }}>
    {italicTail ? (
      <>Elys<span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400, color: accent }}>ium</span></>
    ) : 'Elysium'}
  </span>
);

// ─────────────────────────────────────────────────────────────
// App-icon container — iOS-style superellipse with the recommended
// mark centered inside its safe area. Two color treatments: Obsidian
// (default) and Marble.
// ─────────────────────────────────────────────────────────────
const AppIcon = ({ size = 180, theme = 'obsidian', mark = 'aperture', showSafeArea = false }) => {
  const obsidianBg = 'radial-gradient(ellipse at 50% 18%, #1f1b16 0%, #0E0E12 55%, #08080b 100%)';
  const marbleBg   = 'radial-gradient(ellipse at 50% 18%, #FBF6EA 0%, #F4EFE6 55%, #E6DFCF 100%)';
  const isObs = theme === 'obsidian';
  const inset = isObs
    ? 'inset 0 1px 0 rgba(201,165,107,0.18), inset 0 -8px 24px rgba(0,0,0,0.35), 0 24px 48px -16px rgba(0,0,0,0.55)'
    : 'inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -10px 24px rgba(160,122,74,0.10), 0 24px 48px -16px rgba(70,55,30,0.25)';
  const color = isObs ? '#D8B47A' : '#8A6A40';
  // iOS app-icon "squircle" approximated with border-radius 22.37%.
  const radius = size * 0.2237;
  const markSize = Math.round(size * 0.52);
  const MarkComp = mark === 'orbit' ? LogoOrbit : mark === 'stele' ? LogoStele : LogoAperture;
  return (
    <div style={{
      width: size, height: size,
      borderRadius: radius,
      background: isObs ? obsidianBg : marbleBg,
      boxShadow: inset,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: isObs
          ? 'radial-gradient(ellipse at 50% 0%, rgba(201,165,107,0.18), transparent 55%)'
          : 'radial-gradient(ellipse at 50% 0%, rgba(160,122,74,0.10), transparent 55%)',
        pointerEvents: 'none',
      }} />
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
      <MarkComp size={markSize} color={color} stroke={Math.max(1.2, size * 0.012)} />
    </div>
  );
};

Object.assign(window, { LogoAperture, LogoOrbit, LogoStele, Wordmark, AppIcon });
