// Elysium — Ritual interaction philosophy
// Design / product exploration. Composed on a DesignCanvas:
//   01 · Diagnosis (everything is a checklist)
//   02 · Seven interaction primitives
//   03–09 · Per-domain philosophy + sketch
//   10 · Strength matrix
//   11 · Long-term product identity
//   12 · Roadmap

// ─────────────────────────────────────────────────────────────
// Reusable primitives — spec card, dom card, etc.
// ─────────────────────────────────────────────────────────────
const Spec = ({ eyebrow, title, children, accent = false }) => (
  <div className={`spec-card${accent ? ' accent' : ''}`}>
    {eyebrow && <div className="eyebrow">{eyebrow}</div>}
    {title && <h2 className="spec-title">{title}</h2>}
    <div className="spec-body">{children}</div>
  </div>
);

// A domain card: philosophy text on the left, phone sketch on the right.
const DomCard = ({ num, name, archetype, primitive, tags, children, sketch }) => (
  <div className="domain-card">
    <div className="dom-l">
      <div className="dom-h">
        <span className="num">{num}</span>
        <span className="nm">{name}</span>
        <span className="arc">{archetype}</span>
      </div>
      <div className="dom-tags">
        <span className="dom-tag">{primitive}</span>
        {tags && tags.map((t, i) => <span key={i} className={`dom-tag ${t.warn ? 'warn' : ''}`}>{t.label || t}</span>)}
      </div>
      <div>{children}</div>
    </div>
    <div className="dom-r">{sketch}</div>
  </div>
);

const Row = ({ k, children }) => (
  <div className="dom-row">
    <div className="k">{k}</div>
    <div className="v">{children}</div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Mini "checklist wall" — used in the diagnosis to show how
// homogeneous the seven domains currently feel.
// ─────────────────────────────────────────────────────────────
const ChecklistWall = () => (
  <div className="checklist-wall">
    {['Light','Care','Body','Mind','Water','Sleep','Chronicle','Stars'].map((label, i) => (
      <div className="cw-screen" key={label}>
        <div className="ttl">{label}</div>
        {Array.from({ length: 5 }).map((_, j) => (
          <div key={j} className={`ln ${j < (i % 4) ? 'done' : ''}`}>
            <span className="box" />
            <span className="bar" />
          </div>
        ))}
        <div className="cw-stamp">{(((i+1)*17) % 100)}%</div>
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Primitive cards — seven interaction modes the system can use.
// (Checklist is one of them — but only one.)
// ─────────────────────────────────────────────────────────────
const PRIMITIVES = [
  { glyph: '◷', name: 'Cycle',     uses: 'Care',
    body: 'A multi-day rotation. Each turn calls for a different protocol; the cycle is the unit, not the day. Skipping a turn means the cycle resumes — not that you "failed."' },
  { glyph: '◐', name: 'Ambient meter', uses: 'Water · Light',
    body: 'A passive indicator that drifts through the day. The user notices, not completes. Tapping it acknowledges the rhythm, but does not "count."' },
  { glyph: '◯', name: 'Session',   uses: 'Mind · (later) Body',
    body: 'A held block of time. One affordance ("Begin"), one duration. Afterward, one line of reflection. No streaks, no leaderboards, no per-task ticks.' },
  { glyph: '◊', name: 'Witness',   uses: 'Light · Body',
    body: 'A single "I\'m here" tap. No checkbox semantics — just presence acknowledged. Repeats are fine; absence is silent, not punitive.' },
  { glyph: '~', name: 'Drift',     uses: 'Chronicle',
    body: 'A gallery of past artifacts that surfaces gently — yesterday\'s line, a year ago today. Reading-first; writing is the small second motion.' },
  { glyph: '?', name: 'Prompt',    uses: 'Chronicle · Sleep',
    body: 'A single question, surfacing once. Answering writes a fragment. Not answering moves it to the drift, where it may surface again.' },
  { glyph: '⌒', name: 'Closure',   uses: 'Sleep',
    body: 'A sequence that ends the day inside the app. After it runs, the surface dims and goes quiet. The app refuses to give you anything else to do.' },
];

const PrimitiveCard = ({ glyph, name, body, uses }) => (
  <div className="primitive">
    <div className="p-h">
      <div className="p-i">{glyph}</div>
      <div className="p-n">{name}</div>
    </div>
    <p>{body}</p>
    <div className="p-uses">For · {uses}</div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────
const App = () => (
  <DesignCanvas>
    {/* ──────────────────────────── 01 · Diagnosis ──────────────────────────── */}
    <DCSection id="diagnosis" title="01 · Diagnosis" subtitle="Everything is a checklist. That is the problem.">
      <DCArtboard id="diag-wall" label="The wall of checklists" width={780} height={620} style={{ background: '#0E0E12' }}>
        <Spec eyebrow="Current state · 18 May" title="Seven domains, one shape">
          <p>
            Every Temple tab is built around the same primitive: a list of items, each with a checkbox and a satisfying tick.
            The visual language is right — bronze, hairlines, italic archetype labels — but the <i>interaction grammar</i> is
            the same as a todo app, repeated seven times.
          </p>
          <ChecklistWall />
          <p>
            The Obsidian Temple concept implies something different: each domain is a <i>mode of attention</i>, with its own
            rhythm and its own definition of "kept." A skincare cycle is genuinely a sequence. A glass of water is not.
            Forty minutes of focus is not. Sunlight on skin is not. We are pretending these are all the same shape because
            checkboxes are easy.
          </p>
          <div className="ital-note">
            The fix isn't to make each domain prettier. It's to give each one a different verb.
            Care &mdash; <i>complete</i>. Water &mdash; <i>notice</i>. Light &mdash; <i>witness</i>. Mind &mdash; <i>hold</i>.
            Body &mdash; <i>arrive</i>. Sleep &mdash; <i>close</i>. Chronicle &mdash; <i>remember</i>.
          </div>
        </Spec>
      </DCArtboard>

      <DCArtboard id="diag-antipatterns" label="What we are NOT building" width={420} height={620} style={{ background: '#15151b' }}>
        <Spec eyebrow="Anti-patterns" title="What none of this should become">
          <ul className="bullet-list">
            <li><b>A habit tracker.</b> Streaks belong somewhere — but not in six of the seven domains. Most of these aren't habits; they are <i>conditions</i>.</li>
            <li><b>A productivity app.</b> No "score." No "today's percentage" front-and-center on every screen. Stars already exists; let it carry that load alone.</li>
            <li><b>A wellness app.</b> No mood faces. No "how are you feeling 1–10." No "daily intention." No "gratitude prompt." These are templates.</li>
            <li><b>A journaling app.</b> Chronicle is not a writing surface; it is a <i>reading</i> surface that occasionally accepts a line.</li>
            <li><b>Self-optimisation.</b> No "improving sleep score," no "deep focus minutes this week," no "hydration goal." These ideas all carry their tone with them and the tone is wrong.</li>
            <li><b>Gamification.</b> No badges. No levels. No "tier" of patron. Stars are stars, not XP.</li>
          </ul>
          <p className="ital-note">
            Where in doubt: read the screen aloud. If it sounds like LinkedIn telling you what to do, walk it back one step.
            If it sounds like a meditation teacher, walk it back two.
          </p>
        </Spec>
      </DCArtboard>
    </DCSection>

    {/* ──────────────────────────── 02 · Primitives ──────────────────────────── */}
    <DCSection id="primitives" title="02 · Seven interaction primitives" subtitle="The shape of attention, not just the shape of pixels">
      <DCArtboard id="prim-key" label="The primitive key" width={820} height={620} style={{ background: '#0E0E12' }}>
        <Spec eyebrow="System design" title="Beyond the checklist">
          <p>
            Before we redesign any single domain, name the interaction primitives the system is allowed to use.
            Seven, chosen to match the seven verbs in the diagnosis. Each domain picks <i>one</i> primary primitive
            (and at most one secondary). When in doubt, default to fewer primitives, not more.
          </p>
          <div className="primitive-grid">
            {PRIMITIVES.map(p => <PrimitiveCard key={p.name} {...p} />)}
          </div>
          <p className="ital-note">
            Checklist appears only inside <b>Cycle</b>, scoped to Care's nightly protocol — never as a top-level surface.
            That's the difference between a ritual and a chore.
          </p>
        </Spec>
      </DCArtboard>
    </DCSection>

    {/* ──────────────────────────── 03 · Care ──────────────────────────── */}
    <DCSection id="care" title="03 · Care · Cycle" subtitle="The only domain where completion is honest">
      <DCArtboard id="care-card" label="Care" width={820} height={620} style={{ background: '#0E0E12' }}>
        <DomCard num="I" name="Care" archetype="Hygieia" primitive="Cycle" tags={['Anchor domain']} sketch={<SketchCare />}>
          <Row k="Verb">Complete &mdash; but inside a cycle, not a day.</Row>
          <Row k="Unit">The 3-night turn. Day II of III is the unit of meaning; a missed night moves the cycle, not you.</Row>
          <Row k="Success">"Kept the turn." Not "got 4 of 5." If the protocol asked for one thing tonight and you did it, the night is whole.</Row>
          <Row k="UI primary">Cycle wheel (three nights), tonight's protocol, the rhythm strip showing past cycles.</Row>
          <Row k="UI secondary">A small checklist <em>inside</em> the night, because applying serum is genuinely a sequence.</Row>
          <Row k="Tone">Material, practical. The most "operating system" of all the domains.</Row>
          <Row k="Avoid">"Streak." "Score." Per-product completion percentages. Reminders that feel like alarms.</Row>
        </DomCard>
      </DCArtboard>
    </DCSection>

    {/* ──────────────────────────── 04 · Chronicle ──────────────────────────── */}
    <DCSection id="chronicle" title="04 · Chronicle · Drift" subtitle="A reading surface that occasionally accepts a line">
      <DCArtboard id="chronicle-card" label="Chronicle" width={820} height={620} style={{ background: '#0E0E12' }}>
        <DomCard num="II" name="Chronicle" archetype="Mnemosyne" primitive="Drift" tags={['Reading-first', 'Anchor domain']} sketch={<SketchChronicle />}>
          <Row k="Verb">Remember &mdash; not journal. The user is reading themselves back.</Row>
          <Row k="Unit">The fragment. One line per day. Most days are blank; that's correct.</Row>
          <Row k="Success">A line was added <em>or</em> a line was re-read. Either counts. There is no "today's entry is missing."</Row>
          <Row k="UI primary">A drift gallery: yesterday's line at the top, then past entries fading into time. Occasional surfacing: <i>"a year ago today."</i></Row>
          <Row k="UI secondary">A single italic prompt at the top &mdash; small, dismissible, never the focus.</Row>
          <Row k="Tone">Spectral italic-dominant. The most literary surface in the app. Silence is allowed to be the answer.</Row>
          <Row k="Avoid">Word counts. Mood tags as required fields. "Daily prompt" notification. Any "writing streak."</Row>
        </DomCard>
      </DCArtboard>
    </DCSection>

    {/* ──────────────────────────── 05 · Light ──────────────────────────── */}
    <DCSection id="light" title="05 · Light · Witness" subtitle="Environmental. The user notices; the app does not assign.">
      <DCArtboard id="light-card" label="Light" width={820} height={620} style={{ background: '#0E0E12' }}>
        <DomCard num="III" name="Light" archetype="Apollo" primitive="Witness" tags={['Ambient', 'Environmental']} sketch={<SketchLight />}>
          <Row k="Verb">Witness. The sun rises whether you tick a box or not.</Row>
          <Row k="Unit">Minutes of outdoor light, surfaced as a single italic figure &mdash; not as a target.</Row>
          <Row k="Success">There is no daily success. The reading is the reading. The "I'm here" tap is a small acknowledgment, not a completion.</Row>
          <Row k="UI primary">A horizon gradient at the top of the screen reflecting where the sun is right now &mdash; sunrise to sunset, with a small cursor at "now."</Row>
          <Row k="UI secondary">A witness button (single, calm tap). Sunrise/sunset times as JetBrains-mono micro-data.</Row>
          <Row k="Tone">Material, atmospheric. The screen literally changes color over the day. Almost a wallpaper.</Row>
          <Row k="Avoid">"Daily light goal." "Vitamin D progress." Quantified-self vocabulary. Anything that turns the sun into a metric.</Row>
        </DomCard>
      </DCArtboard>
    </DCSection>

    {/* ──────────────────────────── 06 · Body ──────────────────────────── */}
    <DCSection id="body" title="06 · Body · Felt-sense" subtitle="Offerings, not assignments">
      <DCArtboard id="body-card" label="Body" width={820} height={620} style={{ background: '#0E0E12' }}>
        <DomCard num="IV" name="Body" archetype="Atlas" primitive="Witness + Session" tags={['Felt-sense']} sketch={<SketchBody />}>
          <Row k="Verb">Arrive &mdash; in the body, before doing anything in it.</Row>
          <Row k="Unit">The check-in. "Where am I asking for movement today?" The figure is the surface, not a workout planner.</Row>
          <Row k="Success">A felt-sense was noted. A movement was chosen <i>or</i> declined. Both count. The user can decline every day for a week without consequence.</Row>
          <Row k="UI primary">An abstract figure with tap-zones for regions (shoulders, spine, hips, legs). Tapping suggests offerings &mdash; not duties.</Row>
          <Row k="UI secondary">A session timer for chosen movements (reuses the Mind primitive), but the timer is optional.</Row>
          <Row k="Tone">Honest, grounded. "Nothing to finish. Nothing to skip." said only once, in the footer, italic.</Row>
          <Row k="Avoid">Step counts. Workout libraries. Sets/reps. Calorie language. "Strength" or "cardio" tabs. The body is not a project.</Row>
        </DomCard>
      </DCArtboard>
    </DCSection>

    {/* ──────────────────────────── 07 · Mind ──────────────────────────── */}
    <DCSection id="mind" title="07 · Mind · Session" subtitle="One held block. One reflection after.">
      <DCArtboard id="mind-card" label="Mind" width={820} height={620} style={{ background: '#0E0E12' }}>
        <DomCard num="V" name="Mind" archetype="Athena" primitive="Session" tags={['Held time']} sketch={<SketchMind />}>
          <Row k="Verb">Hold &mdash; attention, for a chosen length, on a chosen thing.</Row>
          <Row k="Unit">The session. 25 / 40 / 90 minutes; the app holds the duration and asks for one reflection at the end.</Row>
          <Row k="Success">A session was held to its end <em>or</em> ended honestly when it broke. Ending early is data, not failure.</Row>
          <Row k="UI primary">A single large "Begin" ring. Duration choice as italic options below. During: the app surface is almost empty &mdash; refusing to be useful.</Row>
          <Row k="UI secondary">Yesterday's one-line reflection beneath the ring, in italic. No history list, no totals on this surface.</Row>
          <Row k="Tone">Spacious. The screen during a session should feel slightly under-filled, almost meditative-app-like, then walk back from that one notch.</Row>
          <Row k="Avoid">Pomodoro nomenclature. Deep-work scores. "Distractions blocked: 14." Charts of focus time by hour. This is not Toggl.</Row>
        </DomCard>
      </DCArtboard>
    </DCSection>

    {/* ──────────────────────────── 08 · Water ──────────────────────────── */}
    <DCSection id="water" title="08 · Water · Meter" subtitle="A rhythm to notice, not a number to hit">
      <DCArtboard id="water-card" label="Water" width={820} height={620} style={{ background: '#0E0E12' }}>
        <DomCard num="VI" name="Water" archetype="Poseidon" primitive="Ambient meter" tags={['Passive', { label: 'Risk of slop', warn: true }]} sketch={<SketchWater />}>
          <Row k="Verb">Notice &mdash; the wave returning every ~90 minutes.</Row>
          <Row k="Unit">The cadence, not the count. "Every 90 minutes the meter rises." Sips acknowledge the wave; they don't tally.</Row>
          <Row k="Success">There is none. The meter drifts through the day. A user who never opens this surface is doing fine.</Row>
          <Row k="UI primary">A vertical ambient meter that fills slowly. Time markings (06:00, 09:30) on the side, the next "wave" highlighted in bronze.</Row>
          <Row k="UI secondary">A single "A sip ·" tap for acknowledgment. One italic line of rhythm copy beneath.</Row>
          <Row k="Tone">Almost wallpaper. The screen could be glanced at from across the room and still communicate.</Row>
          <Row k="Avoid">"8 glasses." "Hydration percentage." "You're 2 glasses behind." All wellness-app DNA. Water is the riskiest domain to design — it falls into health-app cliché instantly. Keep it ambient or cut it.</Row>
        </DomCard>
      </DCArtboard>
    </DCSection>

    {/* ──────────────────────────── 09 · Sleep ──────────────────────────── */}
    <DCSection id="sleep" title="09 · Sleep · Closure" subtitle="The day ends inside the app, then the app goes quiet">
      <DCArtboard id="sleep-a" label="A · the last note" width={400} height={620} style={{ background: '#0E0E12' }}>
        <SketchSleep closed={false} />
      </DCArtboard>
      <DCArtboard id="sleep-b" label="B · after closure" width={400} height={620} style={{ background: '#0E0E12' }}>
        <SketchSleep closed={true} />
      </DCArtboard>
      <DCArtboard id="sleep-card" label="Sleep · philosophy" width={420} height={620} style={{ background: '#0E0E12' }}>
        <Spec eyebrow="VII · Sleep · Hypnos" title="Closure, not bedtime tracking">
          <Row k="Verb">Close &mdash; the day, the screen, the loop.</Row>
          <Row k="Unit">The closure ritual: one line, lights, hand-off. After it runs, the app dims and refuses to be useful until first light.</Row>
          <Row k="Success">The closure ran. There is no sleep duration to score. We are not a wearable.</Row>
          <Row k="UI primary">A small "last note" surface (one italic input), a list of tonight's environmental cues (lights, phones, bedtime), then a dim/quiet final state.</Row>
          <Row k="UI secondary">The bronze hairline at the bottom of the screen literally lengthens as bedtime approaches &mdash; an ambient warning, not a notification.</Row>
          <Row k="Tone">The quietest surface in the app. The "Goodnight" state is genuinely closed; tapping anything brings you to a single calm screen, not a new tab.</Row>
          <Row k="Avoid">Sleep stages. Sleep score. "How well did you sleep, 1–10?" Any morning-after retrospective inside this surface. That belongs in Chronicle if anywhere.</Row>
        </Spec>
      </DCArtboard>
    </DCSection>

    {/* ──────────────────────────── 10 · Matrix ──────────────────────────── */}
    <DCSection id="matrix" title="10 · Strength matrix" subtitle="Which domains are aligned · which dilute · which to defer">
      <DCArtboard id="mtx-strong" label="Per-domain assessment" width={920} height={560} style={{ background: '#0E0E12' }}>
        <Spec eyebrow="Conceptual alignment" title="Which domains hold the brand · which strain it">
          <table className="matrix-table">
            <thead>
              <tr><th>Domain</th><th>Primitive</th><th>Strength</th><th>Why</th><th>What it must never become</th></tr>
            </thead>
            <tbody>
              <tr>
                <td className="dom">Care</td><td className="pri">Cycle</td><td className="str">Strongest</td>
                <td>The product began here. Skincare runs on cycles natively; "kept the turn" is a real concept.</td>
                <td className="nev">Beauty-routine app. Product-stack manager.</td>
              </tr>
              <tr>
                <td className="dom">Chronicle</td><td className="pri">Drift</td><td className="str">Strong</td>
                <td>Reading-first reframing is genuinely novel. No major app does this — most journaling apps insist on writing.</td>
                <td className="nev">A daily-prompt journal. A mood tracker.</td>
              </tr>
              <tr>
                <td className="dom">Sleep</td><td className="pri">Closure</td><td className="str">Strong</td>
                <td>The "closure ritual + dimmed app" is unique. It's the only place where ending is the feature.</td>
                <td className="nev">A sleep-tracker. A bedtime alarm.</td>
              </tr>
              <tr>
                <td className="dom">Light</td><td className="pri">Witness</td><td className="str">Solid</td>
                <td>Atmospheric, but lives or dies on the gradient feeling right. If it doesn't, this becomes a glorified weather widget.</td>
                <td className="nev">Vitamin-D quantifier. SAD-lamp companion.</td>
              </tr>
              <tr>
                <td className="dom">Mind</td><td className="pri">Session</td><td className="str">Solid</td>
                <td>The Session primitive is clean. Risk is adjacency to focus-app market; differentiator is the after-reflection.</td>
                <td className="nev">A Pomodoro. A focus-music app.</td>
              </tr>
              <tr>
                <td className="dom">Body</td><td className="pri">Felt-sense</td><td className="str">Fragile</td>
                <td>The figure / region idea is the right shape, but offerings have to feel like offerings, not workouts. Easy to slip.</td>
                <td className="nev">A workout-of-the-day. A stretching library.</td>
              </tr>
              <tr>
                <td className="dom">Water</td><td className="pri">Ambient meter</td><td className="str">Weakest</td>
                <td>Hydration tracking is the most-cliché category in wellness. Even our ambient version may be carrying genre baggage we can't shake.</td>
                <td className="nev">A glass-counter. Consider deferring or cutting.</td>
              </tr>
            </tbody>
          </table>
          <div className="ital-note">
            <b>Recommendation:</b> ship Temple + Stars + Astrolabe + Chronicle as v1 of the philosophy.
            Care is already there. Light, Mind, Sleep are each one solid sprint each. Body needs careful copy
            work before build. Water is the deferrable &mdash; not because it doesn't matter, but because
            getting the tone right is harder than the build.
          </div>
        </Spec>
      </DCArtboard>
    </DCSection>

    {/* ──────────────────────────── 11 · Identity ──────────────────────────── */}
    <DCSection id="identity" title="11 · What Elysium is, by being not-something" subtitle="Vs the four obvious adjacent categories">
      <DCArtboard id="id-card" label="Long-term identity" width={920} height={580} style={{ background: '#0E0E12' }}>
        <Spec eyebrow="Long-term identity" title="What we are by refusing to be">
          <p>
            The product becomes distinct only by saying no to four well-trodden shapes. The cliché version of each is
            already in the App Store. The discipline is to be near them in subject matter without becoming them in
            grammar.
          </p>
          <div className="id-cmp">
            <div className="cell them">
              <div className="h">Habit tracker · them</div>
              <p>Streaks. Calendar dots. "Don't break the chain." A habit is a yes/no daily binary; everything is a habit.</p>
            </div>
            <div className="cell us">
              <div className="h">Elysium · us</div>
              <p>Most domains aren't habits, they are <i>conditions</i>. Care is a cycle; Light is environmental; Sleep is closure. Streaks belong only in Stars, and only quietly.</p>
            </div>
            <div className="cell them">
              <div className="h">Wellness app · them</div>
              <p>Mood 1–10. Daily intention. Gratitude prompt. "How are you feeling today?" Stock photos of sunrises. Coaching tone.</p>
            </div>
            <div className="cell us">
              <div className="h">Elysium · us</div>
              <p>No mood faces. The app never asks how you feel; it asks what asked something of you. Tone is restrained &mdash; literary, not therapeutic.</p>
            </div>
            <div className="cell them">
              <div className="h">Journaling app · them</div>
              <p>Daily prompt. Word counts. Streak. Tag your entry. The interface insists you write today, every day.</p>
            </div>
            <div className="cell us">
              <div className="h">Elysium · us</div>
              <p>Reading-first. Most days you read the drift; you write a line when you have one. Silence is a valid response.</p>
            </div>
            <div className="cell them">
              <div className="h">Productivity system · them</div>
              <p>Today's percentage. Tasks shipped. Deep-work hours. Weekly review with charts. Optimisation language.</p>
            </div>
            <div className="cell us">
              <div className="h">Elysium · us</div>
              <p>No daily score on the home tab. Mind sessions are held, not totalled. Stars exists, but it shows constellations not KPIs.</p>
            </div>
          </div>
          <div className="ital-note">
            The one-line product definition we are working toward: <i>a quiet operating system for a rhythm of living &mdash;
            where the surfaces remember what you already know, and don't ask you to perform it.</i>
          </div>
        </Spec>
      </DCArtboard>
    </DCSection>

    {/* ──────────────────────────── 12 · Roadmap ──────────────────────────── */}
    <DCSection id="roadmap" title="12 · Evolution order" subtitle="After Temple · Stars · Astrolabe stabilize">
      <DCArtboard id="rm-card" label="Sequence" width={680} height={620} style={{ background: '#0E0E12' }}>
        <Spec eyebrow="What ships in what order" title="An order based on what holds the brand">
          <div className="roadmap">
            <div className="rm-row done">
              <div className="rm-h">Now · 0</div>
              <div className="rm-body">
                <div className="t">Temple · Stars · Astrolabe</div>
                <div className="s">Already stabilized in the prototype. Care lives here in v0 form &mdash; the cycle exists, the medallion exists. Keep iterating but don't block on it.</div>
              </div>
            </div>
            <div className="rm-row">
              <div className="rm-h">Next · 1</div>
              <div className="rm-body">
                <div className="t">Chronicle · Drift</div>
                <div className="s">The biggest single change to the app's identity. Reframes the most "journaling-app-shaped" surface into a reading-first one. Highest brand return per unit of work.</div>
              </div>
            </div>
            <div className="rm-row">
              <div className="rm-h">Then · 2</div>
              <div className="rm-body">
                <div className="t">Sleep · Closure</div>
                <div className="s">The "dimmed final state" is the most unusual interaction in the system &mdash; a feature most apps will never build. Distinctive, narratively complete, technically small.</div>
              </div>
            </div>
            <div className="rm-row">
              <div className="rm-h">Then · 3</div>
              <div className="rm-body">
                <div className="t">Light · Witness</div>
                <div className="s">Atmospheric reward is high; complexity is medium (geolocation, sunrise/sunset, gradient). Pairs well with Sleep &mdash; they bookend the day.</div>
              </div>
            </div>
            <div className="rm-row">
              <div className="rm-h">Then · 4</div>
              <div className="rm-body">
                <div className="t">Mind · Session</div>
                <div className="s">Clean to build but adjacent to a saturated market. Treat this as a v1 minimum (the ring + a single reflection) and resist scope creep into focus-app territory.</div>
              </div>
            </div>
            <div className="rm-row dormant">
              <div className="rm-h">Dormant · A</div>
              <div className="rm-body">
                <div className="t">Body · Felt-sense</div>
                <div className="s">Conceptually right, copywriting-fragile. Spend a separate sprint just on the offering language before any build. If we can't get the copy clean, defer.</div>
              </div>
            </div>
            <div className="rm-row dormant">
              <div className="rm-h">Dormant · B</div>
              <div className="rm-body">
                <div className="t">Water · Meter</div>
                <div className="s">Build last. Or not at all. If after Body lands the system feels complete, water is the domain to cut. Six rituals is a better story than seven mediocre ones.</div>
              </div>
            </div>
          </div>
          <div className="ital-note">
            A "ritual" we never build is still part of the system. The empty plinth in a temple is doing work.
          </div>
        </Spec>
      </DCArtboard>
    </DCSection>
  </DesignCanvas>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
