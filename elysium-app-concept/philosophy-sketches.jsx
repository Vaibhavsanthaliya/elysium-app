// Elysium — Ritual philosophy sketches
// One phone-sized sketch per domain. The point of each is to demonstrate
// an interaction idiom that is NOT a checklist. Visual fidelity is
// intentionally lighter than the production prototype — these are
// conceptual sketches.

const { useState: useSt } = React;

// ─────────────────────────────────────────────────────────────
// Mini phone frame for sketches (smaller than the prototype phone)
// ─────────────────────────────────────────────────────────────
const SketchPhone = ({ theme = 'obsidian', label, children }) => (
  <div className="sketch-phone" data-theme={theme} data-screen-label={label}>
    <div className="sketch-screen">
      <div className="sketch-status">
        <span>9:41</span>
        <div className="sketch-dots"><span></span><span></span><span></span></div>
      </div>
      <div className="sketch-body">{children}</div>
    </div>
  </div>
);

const SketchEyebrow = ({ children }) => <div className="sk-eyebrow">{children}</div>;
const SketchTitle = ({ children, italic, italicTail }) => (
  <h1 className="sk-title">
    {italic ? <span className="sk-ital">{children}</span>
           : italicTail ? <>{children}<span className="sk-ital">{italicTail}</span></>
           : children}
  </h1>
);

// ─────────────────────────────────────────────────────────────
// 01 · Care — Cycle  (the only domain that legitimately keeps
// completion language, because skin already runs on a cycle)
// ─────────────────────────────────────────────────────────────
const SketchCare = () => (
  <SketchPhone label="Care · Cycle">
    <div className="sk-pad">
      <SketchEyebrow>Cycle II · Day 2 of 3</SketchEyebrow>
      <SketchTitle italic>Tonight is salicylic</SketchTitle>
      <p className="sk-blurb">A light hand. Skip if the day was sun-heavy.</p>

      <div className="care-cycle">
        {['Niacinamide','Salicylic','Rest'].map((n, i) => (
          <div key={n} className={`care-night ${i === 1 ? 'tonight' : i === 0 ? 'past' : ''}`}>
            <div className="cn-ix">{['I','II','III'][i]}</div>
            <div className="cn-nm">{n}</div>
            <div className="cn-mk">{i === 0 ? 'kept' : i === 1 ? 'tonight' : '—'}</div>
          </div>
        ))}
      </div>

      <div className="care-rhythm">
        <div className="sk-divider"><span>Rhythm</span></div>
        <div className="care-bars">
          {Array.from({ length: 21 }).map((_, i) => {
            const cls = i % 3 === 2 ? 'rest' : 'on';
            const past = i < 14;
            return <div key={i} className={`care-bar ${cls} ${past ? 'past' : ''} ${i === 14 ? 'now' : ''}`}></div>;
          })}
        </div>
        <div className="care-rhythm-l">7 weeks · 3-night turn</div>
      </div>
    </div>
  </SketchPhone>
);

// ─────────────────────────────────────────────────────────────
// 02 · Chronicle — Drift  (memory garden, not a journaling app)
// Today's prompt is small; the river of past entries dominates.
// ─────────────────────────────────────────────────────────────
const SketchChronicle = () => (
  <SketchPhone label="Chronicle · Drift">
    <div className="sk-pad">
      <SketchEyebrow>Mnemosyne · 18 May</SketchEyebrow>

      <div className="chr-prompt">
        <span className="chr-q">What asked something of you today?</span>
        <span className="chr-go">Add a line ›</span>
      </div>

      <div className="sk-divider"><span>From the well</span></div>

      <div className="chr-surface">
        <div className="chr-eyebrow">A year ago today</div>
        <p>The afternoons still dissolved. The morning is the only honest part — same as now.</p>
      </div>

      <div className="chr-river">
        <div className="chr-entry">
          <div className="chr-date">14 May</div>
          <p>Salicylic night went well. No sting. Window cracked open helps.</p>
        </div>
        <div className="chr-entry faint">
          <div className="chr-date">7 May</div>
          <p>Two real focus blocks before lunch. The rest dissolved.</p>
        </div>
        <div className="chr-entry fainter">
          <div className="chr-date">2 May</div>
          <p>Tired. Skipped the walk.</p>
        </div>
        <div className="chr-entry fadeout">
          <div className="chr-date">21 Apr</div>
          <p>—</p>
        </div>
      </div>
    </div>
  </SketchPhone>
);

// ─────────────────────────────────────────────────────────────
// 03 · Light — Witness  (environmental, not completion)
// A horizon gradient that fills with the day. No tasks.
// ─────────────────────────────────────────────────────────────
const SketchLight = () => (
  <SketchPhone label="Light · Witness">
    <div className="lt-sky">
      <div className="lt-sun" />
      <div className="lt-horizon" />
      <div className="lt-cursor" style={{ left: '42%' }}>
        <div className="lt-cursor-dot" />
        <div className="lt-cursor-time">9:41</div>
      </div>
    </div>
    <div className="sk-pad lt-bottom">
      <SketchEyebrow>The first hour · kept</SketchEyebrow>
      <div className="lt-figure">
        <span className="lt-mins">1h 17m</span>
        <span className="lt-of">of light, today</span>
      </div>
      <button className="lt-witness">I'm here ·</button>
      <div className="lt-meta">
        <span>Sunrise · 5:42</span>
        <span>Sunset · 21:08</span>
      </div>
    </div>
  </SketchPhone>
);

// ─────────────────────────────────────────────────────────────
// 04 · Body — Felt-sense  (offerings, not assignments)
// Tap the region asking for movement; three offerings below.
// ─────────────────────────────────────────────────────────────
const SketchBody = () => {
  const [reg, setReg] = useSt('shoulders');
  const regions = [
    { id: 'shoulders', y: 22, label: 'shoulders' },
    { id: 'spine',     y: 40, label: 'spine' },
    { id: 'hips',      y: 56, label: 'hips' },
    { id: 'legs',      y: 76, label: 'legs' },
  ];
  return (
    <SketchPhone label="Body · Felt-sense">
      <div className="sk-pad">
        <SketchEyebrow>Atlas · 18 May</SketchEyebrow>
        <SketchTitle italicTail=" is asking">Your {reg}</SketchTitle>
      </div>
      <div className="bd-figure">
        <svg viewBox="0 0 100 200" className="bd-silhouette">
          {/* abstract figure — head + torso + legs as soft shapes */}
          <ellipse cx="50" cy="14" rx="9" ry="9" />
          <path d="M38 24 Q50 22 62 24 L62 70 Q62 88 50 90 Q38 88 38 70 Z" />
          <path d="M40 90 L40 170 Q40 178 44 178 L46 178 L48 90 Z" />
          <path d="M60 90 L60 170 Q60 178 56 178 L54 178 L52 90 Z" />
        </svg>
        {regions.map(r => (
          <button key={r.id} className={`bd-tap ${reg === r.id ? 'on' : ''}`}
                  onClick={() => setReg(r.id)} style={{ top: `${r.y}%` }} />
        ))}
      </div>
      <div className="sk-pad">
        <div className="sk-divider"><span>Offerings</span></div>
        <div className="bd-offering"><span>A walk</span><span>20 min · outside if you can</span></div>
        <div className="bd-offering"><span>Shoulders</span><span>5 min · doorway opener</span></div>
        <div className="bd-offering"><span>Floor time</span><span>10 min · no goal</span></div>
        <p className="bd-note">Nothing to finish. Nothing to skip.</p>
      </div>
    </SketchPhone>
  );
};

// ─────────────────────────────────────────────────────────────
// 05 · Mind — Session  (held time, then one reflection)
// A single "begin" affordance. No task list.
// ─────────────────────────────────────────────────────────────
const SketchMind = () => (
  <SketchPhone label="Mind · Session">
    <div className="sk-pad" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <SketchEyebrow>Athena · 18 May</SketchEyebrow>
      <SketchTitle italicTail=" hour">A held </SketchTitle>
      <p className="sk-blurb">One thing. No second monitor. The phone face down.</p>

      <div className="md-stage">
        <div className="md-ring">
          <div className="md-ring-fill" />
          <div className="md-center">
            <div className="md-begin">Begin</div>
            <div className="md-dur">forty minutes</div>
          </div>
        </div>
        <div className="md-options">
          <span>25</span><span className="on">40</span><span>90</span>
        </div>
      </div>

      <div className="md-foot">
        <div className="sk-divider"><span>Yesterday</span></div>
        <p className="md-yest">"The afternoon was honest. Forty minutes on the third paragraph; the rest re-read itself."</p>
      </div>
    </div>
  </SketchPhone>
);

// ─────────────────────────────────────────────────────────────
// 06 · Water — Meter  (passive ambient, no glass count)
// Vertical wave that fills slowly across the day.
// ─────────────────────────────────────────────────────────────
const SketchWater = () => (
  <SketchPhone label="Water · Meter">
    <div className="sk-pad">
      <SketchEyebrow>Poseidon · 18 May</SketchEyebrow>
      <SketchTitle italicTail=" returns">The wave</SketchTitle>
      <p className="sk-blurb">It will rise again at 11:30. No counting — just notice.</p>
    </div>
    <div className="wt-stage">
      <div className="wt-glass">
        <div className="wt-fill" />
        <div className="wt-marks">
          <span style={{ bottom: '20%' }}>06:00</span>
          <span style={{ bottom: '40%' }} className="on">09:30</span>
          <span style={{ bottom: '60%' }}>11:30</span>
          <span style={{ bottom: '78%' }}>14:00</span>
        </div>
      </div>
      <div className="wt-meta">
        <button className="wt-sip">A sip ·</button>
        <div className="wt-cad">every ~90 min · the rhythm</div>
      </div>
    </div>
  </SketchPhone>
);

// ─────────────────────────────────────────────────────────────
// 07 · Sleep — Closure  (the app goes quiet)
// One line for the day's last note; afterward, "goodnight".
// ─────────────────────────────────────────────────────────────
const SketchSleep = ({ closed = false }) => (
  <SketchPhone label={closed ? "Sleep · Closed" : "Sleep · Closure"} theme="obsidian">
    <div className={`sl-stage ${closed ? 'closed' : ''}`}>
      {!closed && (
        <>
          <div className="sk-pad">
            <SketchEyebrow>Hypnos · 22:14</SketchEyebrow>
            <SketchTitle italicTail=" note">A last </SketchTitle>
            <p className="sk-blurb">One line and the temple goes quiet.</p>
          </div>
          <div className="sl-input-wrap">
            <div className="sl-input">A line for today —</div>
            <div className="sl-handoff">Then the screen dims. No more checks.</div>
          </div>
          <div className="sl-foot">
            <div className="sk-divider"><span>Tonight</span></div>
            <div className="sl-tonight">
              <div className="sl-pair"><span>Lights dimmed</span><span>21:30</span></div>
              <div className="sl-pair"><span>Phones to greyscale</span><span>sunset</span></div>
              <div className="sl-pair"><span>Bed</span><span>22:30</span></div>
            </div>
          </div>
        </>
      )}
      {closed && (
        <div className="sl-closed">
          <div className="sl-moon" />
          <div className="sl-goodnight">Goodnight.</div>
          <div className="sl-quiet">See you at first light.</div>
        </div>
      )}
    </div>
  </SketchPhone>
);

Object.assign(window, {
  SketchPhone, SketchEyebrow, SketchTitle,
  SketchCare, SketchChronicle, SketchLight, SketchBody, SketchMind, SketchWater, SketchSleep,
});
