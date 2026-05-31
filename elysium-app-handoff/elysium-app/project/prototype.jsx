// Obsidian Temple — interactive prototype
// Multi-screen app demonstrating the leading direction (Stacked Medallions Temple home).
// Tap a medallion to open a ritual; check off tasks; switch tabs.
// Theme toggleable via Tweaks panel (Marble ↔ Obsidian).

const { useState, useEffect, useRef } = React;

// ───────────────────────────────────────────────
// Ritual data — long-term roadmap of seven rituals.
// Each carries a user-facing label and an italic archetype subtitle.
// Care preserves the existing skincare logic (cycle of niacinamide / salicylic / rest).
// ───────────────────────────────────────────────
const TODAY_CYCLE = 1; // 0=niacinamide, 1=salicylic, 2=rest
const CYCLE_NAMES = ['Niacinamide', 'Salicylic', 'Rest'];

const RITUALS_FULL = [
  {
    id: 'light', label: 'Light', archetype: 'Apollo', glyph: 'light',
    blurb: 'The first hour. Sun on skin.',
    accent: 'Dawn',
    tasks: [
      { id: 'l1', t: 'Open the window', s: 'Two minutes of outdoor light', done: true },
      { id: 'l2', t: 'Water before anything else', s: 'A full glass, room temperature', done: true },
      { id: 'l3', t: 'Five slow breaths', s: 'Box pattern · in, hold, out, hold', done: true },
      { id: 'l4', t: 'Sunlight on skin', s: 'Ten minutes within the first hour', done: false },
    ],
  },
  {
    id: 'care', label: 'Care', archetype: 'Hygieia', glyph: 'care',
    blurb: 'Skin, body, the slow attention. Cycle day II.',
    accent: 'Cycle II',
    tasks: [
      { id: 'm1', t: 'Cleanse with cool water', s: 'Morning · 1 minute', done: true },
      { id: 'm2', t: 'Niacinamide serum', s: 'A pea, evenly', done: true },
      { id: 'm3', t: 'Moisturize lightly', s: 'Damp skin holds it', done: true },
      { id: 'm4', t: 'Sunscreen, generous', s: 'SPF 50 · re-apply at noon', done: true },
      { id: 'n1', t: 'Cleanse again, gently', s: 'Tonight', done: false },
      { id: 'n2', t: 'Salicylic — light hand', s: 'Cycle day 02 · max 3×/week', done: false },
    ],
  },
  {
    id: 'water', label: 'Water', archetype: 'Poseidon', glyph: 'water',
    blurb: 'Eight glasses, evenly spaced.',
    accent: '6 of 8',
    tasks: [
      { id: 'w1', t: 'On waking', s: 'Before anything else', done: true },
      { id: 'w2', t: 'Mid-morning', s: 'With first focus block', done: true },
      { id: 'w3', t: 'Before lunch', s: '', done: true },
      { id: 'w4', t: 'Afternoon', s: '', done: true },
      { id: 'w5', t: 'After exercise', s: '', done: true },
      { id: 'w6', t: 'Pre-dinner', s: '', done: true },
      { id: 'w7', t: 'With dinner', s: '', done: false },
      { id: 'w8', t: 'Before bed', s: 'A sip only', done: false },
    ],
  },
  {
    id: 'body', label: 'Body', archetype: 'Atlas', glyph: 'body',
    blurb: 'Movement, weight, breath.',
    accent: 'Unset',
    tasks: [
      { id: 'b1', t: 'Mobility · 10 minutes', s: 'Hips, shoulders, spine', done: false },
      { id: 'b2', t: 'Strength · 30 minutes', s: 'Lower body day', done: false },
      { id: 'b3', t: 'Walk · 20 minutes', s: 'Outside if possible', done: false },
    ],
  },
  {
    id: 'mind', label: 'Mind', archetype: 'Athena', glyph: 'mind',
    blurb: 'One focused hour.',
    accent: 'Unset',
    tasks: [
      { id: 'mi1', t: 'No notifications, no second monitor', s: '', done: false },
      { id: 'mi2', t: 'A single task named on paper', s: '', done: false },
      { id: 'mi3', t: 'Forty minutes uninterrupted', s: '', done: false },
      { id: 'mi4', t: 'A note on what shifted', s: 'Three sentences', done: false },
    ],
  },
  {
    id: 'sleep', label: 'Sleep', archetype: 'Hypnos', glyph: 'sleep',
    blurb: 'Wind-down. Returning home.',
    accent: '22:30',
    tasks: [
      { id: 's1', t: 'Phones to greyscale', s: 'At sunset', done: false },
      { id: 's2', t: 'Last meal complete', s: 'Three hours before bed', done: false },
      { id: 's3', t: 'Lights dimmed', s: 'Warm only, no overheads', done: false },
      { id: 's4', t: 'Tea or reading', s: 'Twenty minutes', done: false },
      { id: 's5', t: 'Bed by 22:30', s: 'No exceptions tonight', done: false },
    ],
  },
  {
    id: 'chronicle', label: 'Chronicle', archetype: 'Mnemosyne', glyph: 'chronicle',
    blurb: 'One note. What today asked.',
    accent: 'Open',
    tasks: [
      { id: 'c1', t: 'A note on the day', s: 'Two or three sentences', done: false },
    ],
  },
];

// ───────────────────────────────────────────────
// Status bar + tab bar shared chrome
// ───────────────────────────────────────────────
const StatusBar = () => (
  <div className="status-bar">
    <span>9:41</span>
    <div className="dots"><span></span><span></span><span></span></div>
  </div>
);

const TabIcon = ({ kind, active }) => {
  const sw = active ? 1.7 : 1.5;
  switch (kind) {
    case 'temple':    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>;
    case 'cycle':     return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="3" x2="12" y2="21"/></svg>;
    case 'chronicle': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
    case 'stars':     return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw}><path d="M12 2 L14 9 L21 9 L15.5 13.5 L17.5 21 L12 16.5 L6.5 21 L8.5 13.5 L3 9 L10 9 Z"/></svg>;
    case 'settings':  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
  }
};
const TabBar = ({ tab, onTab }) => {
  const tabs = [
    { id: 'temple',    label: 'Temple' },
    { id: 'cycle',     label: 'Cycle' },
    { id: 'chronicle', label: 'Chronicle' },
    { id: 'stars',     label: 'Stars' },
    { id: 'settings',  label: 'Settings' },
  ];
  return (
    <div className="tabbar">
      {tabs.map((tabItem) => (
        <button key={tabItem.id} className={`tab ${tab === tabItem.id ? 'active' : ''}`} onClick={() => onTab(tabItem.id)}>
          <TabIcon kind={tabItem.id} active={tab === tabItem.id} />
          <span>{tabItem.label}</span>
        </button>
      ))}
    </div>
  );
};

// ───────────────────────────────────────────────
// Progress arc — reusable SVG ring
// ───────────────────────────────────────────────
const ProgressRing = ({ pct, size = 120, stroke = 6, label }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (c * pct) / 100;
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--separator-strong)" strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r}
          stroke="var(--bronze)" strokeWidth={stroke} fill="none"
          strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(.2,.7,.2,1)' }}
        />
      </svg>
      <div className="ring-text">
        <span className="num">{Math.round(pct)}</span>
        <span className="suf">%</span>
        {label && <span className="lbl">{label}</span>}
      </div>
    </div>
  );
};

// Mini per-card progress arc
const MiniArc = ({ pct }) => {
  const size = 28, stroke = 2.5, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const off = c - (c * pct) / 100;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mini-arc">
      <circle cx={size/2} cy={size/2} r={r} stroke="var(--separator-strong)" strokeWidth={stroke} fill="none" />
      <circle cx={size/2} cy={size/2} r={r}
        stroke="var(--bronze)" strokeWidth={stroke} fill="none"
        strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off}
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
    </svg>
  );
};

// ───────────────────────────────────────────────
// Temple home — stacked medallions
// ───────────────────────────────────────────────
const TempleHome = ({ rituals, onOpen, todayPct }) => {
  const featured = rituals.find(r => r.id === 'care');
  const others = rituals.filter(r => r.id !== 'care');
  return (
    <div className="screen-scroll">
      <div className="greeting">
        <div className="eyebrow">Thursday · 15 May</div>
        <h1>Today's <span className="ital">temple</span></h1>
        <p>{Math.round(todayPct)}% kept. Tonight's care is salicylic — a light hand.</p>
      </div>

      <button className="ritual-card featured" onClick={() => onOpen('care')}>
        <div className="medallion bronzed lg"><Glyph name={featured.glyph} size={30} /></div>
        <div className="meta">
          <div className="row1">
            <span className="label">{featured.label}</span>
            <span className="arche">{featured.archetype}</span>
          </div>
          <div className="blurb">{featured.blurb}</div>
        </div>
        <div className="right">
          <MiniArc pct={ritualPct(featured)} />
          <div className="state">{doneCount(featured)} / {featured.tasks.length}</div>
        </div>
      </button>

      <div className="section-h">
        <span>The other six</span>
        <span className="meta-r">06 patrons</span>
      </div>

      <div className="card-list">
        {others.map((r) => {
          const p = ritualPct(r);
          return (
            <button key={r.id} className="ritual-card" onClick={() => onOpen(r.id)}>
              <div className="medallion"><Glyph name={r.glyph} size={22} /></div>
              <div className="meta">
                <div className="row1">
                  <span className="label">{r.label}</span>
                  <span className="arche">{r.archetype}</span>
                </div>
                <div className="blurb">{r.blurb}</div>
              </div>
              <div className="right">
                {p > 0 ? <MiniArc pct={p} /> : <div style={{width:28,height:28}}></div>}
                <div className={`state ${p === 0 ? 'dim' : ''}`}>
                  {p === 100 ? 'DONE' : p === 0 ? r.accent.toUpperCase() : `${doneCount(r)} / ${r.tasks.length}`}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

function doneCount(r) { return r.tasks.filter(t => t.done).length; }
function ritualPct(r) { return Math.round((doneCount(r) / r.tasks.length) * 100); }

// ───────────────────────────────────────────────
// Ritual detail — Care + others share this view
// ───────────────────────────────────────────────
const RitualDetail = ({ ritual, onBack, onToggle }) => {
  const pct = ritualPct(ritual);
  const isCare = ritual.id === 'care';
  return (
    <div className="screen-scroll">
      <button className="back" onClick={onBack}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        <span>Temple</span>
      </button>

      <div className="ritual-head">
        <div className="medallion bronzed xl"><Glyph name={ritual.glyph} size={42} /></div>
        <div className="eyebrow center">Ritual of</div>
        <h1 className="ritual-name"><span className="ital">{ritual.archetype}</span></h1>
        <div className="ritual-label">{ritual.label.toLowerCase()}</div>
        <p className="ritual-blurb">{ritual.blurb}</p>
      </div>

      <div className="ritual-meta-row">
        <ProgressRing pct={pct} size={92} stroke={5} />
        <div className="meta-side">
          <div className="meta-kv">
            <div className="k">Kept today</div>
            <div className="v">{doneCount(ritual)} / {ritual.tasks.length}</div>
          </div>
          <div className="meta-kv">
            <div className="k">{isCare ? 'Cycle' : 'Cadence'}</div>
            <div className="v">{isCare ? `Day ${roman(TODAY_CYCLE + 1)} · ${CYCLE_NAMES[TODAY_CYCLE]}` : ritual.accent}</div>
          </div>
        </div>
      </div>

      <div className="task-list">
        {ritual.tasks.map((task) => (
          <button key={task.id} className={`task ${task.done ? 'done' : ''}`} onClick={() => onToggle(ritual.id, task.id)}>
            <span className="check">
              {task.done && (
                <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 8.5 6.5 12 13 4.5" />
                </svg>
              )}
            </span>
            <div className="body">
              <div className="t">{task.t}</div>
              {task.s && <div className="s">{task.s}</div>}
            </div>
          </button>
        ))}
      </div>

      {isCare && (
        <div className="cycle-strip">
          <div className="cycle-strip-h">Cycle of three nights</div>
          <div className="cycle-three">
            {CYCLE_NAMES.map((n, i) => (
              <div key={i} className={`cycle-card ${i === TODAY_CYCLE ? 'active' : ''}`}>
                <div className="ix">{roman(i+1)}</div>
                <div className="nm">{n}</div>
                <div className="sm">{i === TODAY_CYCLE ? 'Tonight' : i < TODAY_CYCLE ? 'Yesterday' : 'Tomorrow'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function roman(n) { return ['I','II','III','IV','V','VI','VII'][n-1] || String(n); }

// ───────────────────────────────────────────────
// Cycle — astrolabe wheel of the seven rituals
// ───────────────────────────────────────────────
const CycleScreen = ({ rituals, onOpen }) => {
  const order = ['light','care','body','mind','water','sleep','chronicle'];
  const ordered = order.map(id => rituals.find(r => r.id === id));
  const overall = Math.round(ordered.reduce((s, r) => s + ritualPct(r), 0) / ordered.length);
  return (
    <div className="screen-scroll">
      <div className="greeting">
        <div className="eyebrow">Day XIV · Cycle II</div>
        <h1>The <span className="ital">wheel</span></h1>
        <p>Seven patrons. Tap a face to enter.</p>
      </div>
      <div className="astrolabe">
        <div className="al-ring glow"></div>
        <div className="al-ring outer"></div>
        <div className="al-ring mid"></div>
        <div className="al-ring inner"></div>
        {ordered.map((r, i) => {
          const angle = -90 + (360 / 7) * i;
          const rad = (angle * Math.PI) / 180;
          const radius = 116;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;
          const pct = ritualPct(r);
          const status = pct === 100 ? 'done' : pct > 0 ? 'active' : 'pending';
          return (
            <button key={r.id} className={`al-deity ${status}`}
              onClick={() => onOpen(r.id)}
              style={{ left: `calc(50% + ${x}px - 24px)`, top: `calc(50% + ${y}px - 24px)` }}
            >
              <Glyph name={r.glyph} size={22} stroke={1.4} />
              <span className="nm">{r.label}</span>
            </button>
          );
        })}
        <div className="al-center">
          <div className="pct">{overall}%</div>
          <div className="lbl">All seven</div>
        </div>
      </div>
      <div className="al-legend">
        <div className="al-legend-item"><span className="dot done"></span><span>Kept in full</span></div>
        <div className="al-legend-item"><span className="dot active"></span><span>In progress</span></div>
        <div className="al-legend-item"><span className="dot pending"></span><span>Not yet</span></div>
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────
// Chronicle — Mnemosyne
// ───────────────────────────────────────────────
const ChronicleScreen = () => {
  const [note, setNote] = useState('');
  const placeholders = [
    "Of the seven, which patron asked something difficult of you today?",
    "What did you keep that you almost didn't?",
    "Was there a moment of light?",
  ];
  const prompt = placeholders[0];
  return (
    <div className="screen-scroll">
      <div className="greeting">
        <div className="eyebrow">Mnemosyne · 15 May</div>
        <h1>The <span className="ital">chronicle</span></h1>
      </div>
      <div className="prompt-card">
        <div className="prompt-eyebrow">A question, from the well of memory</div>
        <div className="prompt-q">{prompt}</div>
      </div>
      <textarea
        className="chronicle-input"
        placeholder="Write here. One note per day."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={6}
      />
      <div className="mood-row">
        <span className="mood-l">A mark for the day</span>
        <div className="mood-dots">
          {[0,1,2,3,4].map(i => <span key={i} className={`mood ${i < 3 ? 'on' : ''}`}></span>)}
        </div>
      </div>

      <div className="section-h">
        <span>Recently kept</span>
        <span className="meta-r">past 3</span>
      </div>
      <div className="entry-list">
        <div className="entry">
          <div className="entry-meta"><span>14 May</span><span className="entry-tag">Care · Sleep</span></div>
          <p>Salicylic night went well. No sting. Sleeping with the window cracked open helps.</p>
        </div>
        <div className="entry">
          <div className="entry-meta"><span>13 May</span><span className="entry-tag">Body</span></div>
          <p>Tired. Skipped the walk. Did the mobility, which is something.</p>
        </div>
        <div className="entry">
          <div className="entry-meta"><span>12 May</span><span className="entry-tag">Mind</span></div>
          <p>Two real focus blocks before lunch. The afternoon dissolved as usual. The morning is the only honest part.</p>
        </div>
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────
// Stars — constellation progress
// ───────────────────────────────────────────────
const StarsScreen = () => {
  // 6 weeks x 7 days = 42 cells, some "kept"
  const cells = [];
  const pattern = [1,1,1,0,1,1,1, 1,1,1,1,1,0,1, 1,2,1,1,1,1,1, 1,1,2,1,1,1,1, 1,1,1,1,0,1,1, 0,1,1,1,1,1,1];
  for (let i = 0; i < 42; i++) cells.push(pattern[i] ?? 0);

  const stats = [
    { l: 'Streak', v: 14, u: 'days' },
    { l: 'Kept', v: 42, u: 'total' },
    { l: 'This week', v: '6/7', u: '' },
    { l: 'Milestone', v: 'II', u: 'of IV' },
  ];

  return (
    <div className="screen-scroll">
      <div className="greeting">
        <div className="eyebrow">14 days kept · cycle II</div>
        <h1>The <span className="ital">stars</span></h1>
        <p>One star for each day kept. Brightest are full-pantheon days.</p>
      </div>
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-cell">
            <div className="stat-v">{s.v}</div>
            <div className="stat-l">{s.l}{s.u ? ' · ' + s.u : ''}</div>
          </div>
        ))}
      </div>

      <div className="section-h">
        <span>Six weeks of stars</span>
        <span className="meta-r">42 / 42</span>
      </div>
      <div className="constellation-card">
        <svg viewBox="0 0 280 110" className="const-lines" preserveAspectRatio="none">
          <path d="M20 24 L60 16 L100 32 M60 16 L80 50 M140 18 L180 30 L220 24 M180 30 L200 60 M40 70 L80 86 L130 76 L170 90 L210 78 L250 92" stroke="var(--bronze)" strokeWidth="0.5" strokeOpacity="0.35" fill="none" />
        </svg>
        <div className="star-grid">
          {cells.map((v, i) => (
            <div key={i} className={`star-cell s${v}`}></div>
          ))}
        </div>
      </div>

      <div className="section-h">
        <span>Milestones</span>
        <span className="meta-r">II of IV</span>
      </div>
      <div className="milestone-list">
        <div className="milestone done">
          <div className="m-ix">I</div>
          <div className="m-body">
            <div className="m-t">Foundation</div>
            <div className="m-s">14 days kept · the first turn</div>
          </div>
          <div className="m-tick">
            <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 8.5 6.5 12 13 4.5"/></svg>
          </div>
        </div>
        <div className="milestone done">
          <div className="m-ix">II</div>
          <div className="m-body">
            <div className="m-t">First cycle</div>
            <div className="m-s">28 days · three pantheon nights kept</div>
          </div>
          <div className="m-tick">
            <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 8.5 6.5 12 13 4.5"/></svg>
          </div>
        </div>
        <div className="milestone">
          <div className="m-ix">III</div>
          <div className="m-body">
            <div className="m-t">Quiet stretch</div>
            <div className="m-s">56 days · in 14 days</div>
          </div>
        </div>
        <div className="milestone">
          <div className="m-ix">IV</div>
          <div className="m-body">
            <div className="m-t">A year of attention</div>
            <div className="m-s">365 days</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────
// Settings — minimal placeholder
// ───────────────────────────────────────────────
const SettingsScreen = () => (
  <div className="screen-scroll">
    <div className="greeting">
      <div className="eyebrow">Account &amp; ritual</div>
      <h1><span className="ital">Settings</span></h1>
    </div>
    <div className="settings-card">
      <div className="set-row">
        <div>
          <div className="set-n">Signed in</div>
          <div className="set-s">you@example.com</div>
        </div>
      </div>
      <div className="set-row">
        <div>
          <div className="set-n">Comfort mode</div>
          <div className="set-s">Summer / sweat friendly — Care shows fewer steps</div>
        </div>
        <span className="set-toggle off"></span>
      </div>
      <div className="set-row">
        <div>
          <div className="set-n">Morning reminder</div>
          <div className="set-s">8:00 AM · Light &amp; Care</div>
        </div>
      </div>
      <div className="set-row">
        <div>
          <div className="set-n">Night reminder</div>
          <div className="set-s">10:00 PM · Care &amp; Sleep</div>
        </div>
      </div>
    </div>
    <div className="settings-card">
      <div className="set-row">
        <div>
          <div className="set-n">Theme</div>
          <div className="set-s">Use the Tweaks panel — Marble or Obsidian</div>
        </div>
      </div>
      <div className="set-row danger">
        <div>
          <div className="set-n">Sign out</div>
        </div>
      </div>
    </div>
    <p className="version">Elysium · v0.2 · the pantheon</p>
  </div>
);

// ───────────────────────────────────────────────
// App shell
// ───────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "obsidian"
}/*EDITMODE-END*/;

const App = () => {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tab, setTab] = useState('temple');
  const [openRitual, setOpenRitual] = useState(null);
  const [rituals, setRituals] = useState(RITUALS_FULL);

  // Apply theme to phone-stage root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', t.theme);
  }, [t.theme]);

  const toggleTask = (ritualId, taskId) => {
    setRituals(prev => prev.map(r => {
      if (r.id !== ritualId) return r;
      return {
        ...r,
        tasks: r.tasks.map(task => task.id === taskId ? { ...task, done: !task.done } : task),
      };
    }));
  };

  // Today overall progress
  const todayPct = Math.round(
    rituals.reduce((s, r) => s + ritualPct(r), 0) / rituals.length
  );

  let body;
  if (openRitual) {
    const r = rituals.find(r => r.id === openRitual);
    body = <RitualDetail ritual={r} onBack={() => setOpenRitual(null)} onToggle={toggleTask} />;
  } else if (tab === 'temple')    body = <TempleHome rituals={rituals} onOpen={(id) => setOpenRitual(id)} todayPct={todayPct} />;
  else if (tab === 'cycle')       body = <CycleScreen rituals={rituals} onOpen={(id) => { setTab('temple'); setOpenRitual(id); }} />;
  else if (tab === 'chronicle')   body = <ChronicleScreen />;
  else if (tab === 'stars')       body = <StarsScreen />;
  else if (tab === 'settings')    body = <SettingsScreen />;

  return (
    <div className="app-shell" data-theme={t.theme} data-screen-label={openRitual ? `Ritual: ${openRitual}` : tab}>
      <div className="phone-stage">
        <div className="screen">
          <StatusBar />
          <div className="screen-body">{body}</div>
          <TabBar tab={tab} onTab={(id) => { setOpenRitual(null); setTab(id); }} />
        </div>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme">
          <TweakRadio
            label="Surface"
            value={t.theme}
            onChange={(v) => setTweak('theme', v)}
            options={[
              { value: 'obsidian', label: 'Obsidian' },
              { value: 'marble',   label: 'Marble' },
            ]}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
