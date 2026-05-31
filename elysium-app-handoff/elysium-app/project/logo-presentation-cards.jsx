// Elysium — Logo Exploration · helper components
// Reusable cards for the broader logo presentation: shortlist card,
// 9-up grid, size ladder, mono strip, app-icon panorama, motion strip,
// brand-adjacency board.

const LE_eyebrow = (text) => <div className="eyebrow">{text}</div>;

// Wrap mark in a stage; show name + tag underneath.
const MarkCell = ({ idx, name, tag, Mark, size = 84, color = '#C9A56B', stroke = 1.5, prior = false }) => (
  <div className={`mark-cell${prior ? ' is-prior' : ''}`}>
    <div className="mark-index">{idx}</div>
    <Mark size={size} color={color} stroke={stroke} />
    <div className="mark-name">{name}</div>
    <div className="mark-tag">{tag}</div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Shortlist card — one of the three recommended marks, big.
// ─────────────────────────────────────────────────────────────
const ShortlistCard = ({ rank, name, accent, subtitle, symbolism, body, Mark, isRecommended = false }) => (
  <div className="shortlist-card">
    <div className="shortlist-stage">
      <div className="shortlist-rank">{rank}</div>
      {isRecommended && <div className="shortlist-pip">Lead</div>}
      <Mark size={210} color="#D8B47A" stroke={2.4} />
    </div>
    <div className="shortlist-meta">
      {LE_eyebrow(subtitle)}
      <h3 className="shortlist-name">{name}{accent && <> · <em>{accent}</em></>}</h3>
      <p className="shortlist-symbolism">{symbolism}</p>
      <p className="shortlist-body">{body}</p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Size ladder — same mark from large to favicon
// ─────────────────────────────────────────────────────────────
const SizeLadder = ({ Mark, sizes = [180, 96, 56, 32, 16], note }) => (
  <div className="size-ladder">
    <div className="size-ladder-stage">
      {sizes.map((s) => {
        const stroke = Math.max(0.9, Math.min(2.4, s * 0.014));
        return (
          <div className="size-ladder-pair" key={s}>
            <Mark size={s} color="#D8B47A" stroke={stroke} />
            <span className="size-tag">{s}px</span>
          </div>
        );
      })}
    </div>
    {note && <div className="size-ladder-note">{note}</div>}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Mono / bronze strip — same mark in five colorways
// ─────────────────────────────────────────────────────────────
const MonoStrip = ({ Mark, foot }) => {
  const swatches = [
    { bg: '#0E0E12', color: '#C9A56B', tag: 'Bronze · obsidian', tagColor: 'rgba(236,230,217,0.5)' },
    { bg: '#0E0E12', color: '#ECE6D9', tag: 'Ink · obsidian',    tagColor: 'rgba(236,230,217,0.5)' },
    { bg: '#F4EFE6', color: '#A07A4A', tag: 'Bronze · marble',   tagColor: 'rgba(26,24,22,0.55)' },
    { bg: '#F4EFE6', color: '#1A1816', tag: 'Ink · marble',      tagColor: 'rgba(26,24,22,0.55)' },
    { bg: '#C9A56B', color: '#0E0E12', tag: 'Reverse · bronze',  tagColor: 'rgba(14,14,18,0.65)' },
  ];
  return (
    <div className="mono-strip">
      <div className="mono-row">
        {swatches.map((sw, i) => (
          <div className="mono-cell" key={i} style={{ background: sw.bg }}>
            <Mark size={64} color={sw.color} stroke={1.6} />
            <span className="mono-tag" style={{ color: sw.tagColor }}>{sw.tag}</span>
          </div>
        ))}
      </div>
      {foot && <div className="mono-strip-foot">{foot}</div>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// App icon panorama — recommended mark, three sizes, obs + marble
// ─────────────────────────────────────────────────────────────
const IconPano = ({ Mark }) => (
  <div className="icon-pano">
    <div className="icon-pano-band is-obs">
      <span className="icon-pano-band-label">Obsidian</span>
      <div className="icon-pano-pair">
        <IconTile size={180} theme="obsidian" Mark={Mark} />
        <span className="icon-pano-tag">180px</span>
      </div>
      <div className="icon-pano-pair">
        <IconTile size={120} theme="obsidian" Mark={Mark} />
        <span className="icon-pano-tag">120</span>
      </div>
      <div className="icon-pano-pair">
        <IconTile size={76} theme="obsidian" Mark={Mark} />
        <span className="icon-pano-tag">76</span>
      </div>
      <div className="icon-pano-pair">
        <IconTile size={40} theme="obsidian" Mark={Mark} flatten />
        <span className="icon-pano-tag">40</span>
      </div>
    </div>
    <div className="icon-pano-band is-marble">
      <span className="icon-pano-band-label">Marble</span>
      <div className="icon-pano-pair">
        <IconTile size={180} theme="marble" Mark={Mark} />
        <span className="icon-pano-tag">180px</span>
      </div>
      <div className="icon-pano-pair">
        <IconTile size={120} theme="marble" Mark={Mark} />
        <span className="icon-pano-tag">120</span>
      </div>
      <div className="icon-pano-pair">
        <IconTile size={76} theme="marble" Mark={Mark} />
        <span className="icon-pano-tag">76</span>
      </div>
      <div className="icon-pano-pair">
        <IconTile size={40} theme="marble" Mark={Mark} flatten />
        <span className="icon-pano-tag">40</span>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Fake iOS home screen with the Elysium icon in the dock
// ─────────────────────────────────────────────────────────────
const HomeScreen = ({ Mark }) => (
  <div className="homescreen">
    <div className="hs-clock">9:41</div>
    <div className="hs-date">Monday, 24 May</div>
    <div className="hs-row">
      <div className="hs-app"><div className="hs-app-tile is-cal"></div><span className="hs-name">Calendar</span></div>
      <div className="hs-app"><div className="hs-app-tile is-photos"></div><span className="hs-name">Photos</span></div>
      <div className="hs-app"><div className="hs-app-tile is-camera"></div><span className="hs-name">Camera</span></div>
      <div className="hs-app"><div className="hs-app-tile is-maps"></div><span className="hs-name">Maps</span></div>
      <div className="hs-app"><div className="hs-app-tile is-notes"></div><span className="hs-name">Notes</span></div>
      <div className="hs-app">
        <div className="hs-app-tile is-elysium"><Mark size={32} color="#D8B47A" stroke={1.4} /></div>
        <span className="hs-name">Elysium</span>
      </div>
      <div className="hs-app"><div className="hs-app-tile is-music"></div><span className="hs-name">Music</span></div>
      <div className="hs-app"><div className="hs-app-tile is-safari"></div><span className="hs-name">Safari</span></div>
    </div>
    <div className="hs-dock">
      <div className="hs-app-tile is-mail"></div>
      <div className="hs-app-tile is-safari"></div>
      <div className="hs-app-tile is-music"></div>
      <div className="hs-app-tile is-camera"></div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Motion strip — 5 frames of the first-paint reveal
// ─────────────────────────────────────────────────────────────
// Each frame draws a stylized "state" of the mark coming into being.
const MotionStrip = ({ Mark }) => {
  const FRAME_BG = '#0E0E12';
  return (
    <div className="motion-card" style={{ background: '#0E0E12' }}>
      {LE_eyebrow('Motion · first-paint reveal · 1100ms total')}
      <div className="motion-strip" style={{ background: FRAME_BG, padding: '8px 0' }}>
        {/* 0 — empty medallion */}
        <div className="motion-frame">
          <svg width="68" height="68" viewBox="0 0 68 68">
            <circle cx="34" cy="34" r="28" stroke="#C9A56B" strokeOpacity="0.18" strokeWidth="1.5" fill="none" />
          </svg>
          <span className="mf-tag">0ms</span>
        </div>
        {/* 200 — circle traces in */}
        <div className="motion-frame">
          <svg width="68" height="68" viewBox="0 0 68 68">
            <circle cx="34" cy="34" r="28" stroke="#C9A56B" strokeWidth="1.5" fill="none"
                    strokeDasharray="175" strokeDashoffset="60" strokeLinecap="round"
                    transform="rotate(-90 34 34)" />
          </svg>
          <span className="mf-tag">300ms</span>
        </div>
        {/* 500 — circle complete, inner element starting */}
        <div className="motion-frame">
          <svg width="68" height="68" viewBox="0 0 68 68">
            <circle cx="34" cy="34" r="28" stroke="#C9A56B" strokeWidth="1.5" fill="none" />
          </svg>
          <span className="mf-tag">600ms</span>
        </div>
        {/* 800 — mark fades in */}
        <div className="motion-frame">
          <div style={{ opacity: 0.55 }}>
            <Mark size={64} color="#C9A56B" stroke={1.5} />
          </div>
          <span className="mf-tag">900ms</span>
        </div>
        {/* 1100 — settled */}
        <div className="motion-frame" style={{ boxShadow: 'inset 0 0 18px rgba(201,165,107,0.10)' }}>
          <Mark size={64} color="#C9A56B" stroke={1.5} />
          <span className="mf-tag">1100ms</span>
        </div>
      </div>
      <div className="motion-foot" style={{
        fontFamily: 'var(--font-display)', fontStyle: 'italic',
        fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.5,
      }}>
        The medallion ring traces clockwise from 12 (400&nbsp;ms, cubic-bezier 0.2&nbsp;0.7&nbsp;0.2&nbsp;1). After a 100&nbsp;ms hold, the inner element fades and rises 4&nbsp;px (300&nbsp;ms ease-out). A single 200&nbsp;ms bronze bloom finishes the gesture. The whole thing is sub-second on app launch, and only ever plays once per session. No idle animation.
      </div>
    </div>
  );
};

Object.assign(window, {
  MarkCell, ShortlistCard, SizeLadder, MonoStrip, IconPano, HomeScreen, MotionStrip, LE_eyebrow,
});
