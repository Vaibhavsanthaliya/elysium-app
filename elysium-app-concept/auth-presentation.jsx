// Elysium — Auth & Logo design presentation
// Composes the existing logo + auth components into a DesignCanvas
// arranged as a top-to-bottom design review:
//   1 · Diagnosis
//   2 · Logo directions
//   3 · Recommended direction
//   4 · App icon
//   5 · Sign-in screens
//   6 · Sign-up screen
//   7 · Copy options
//   8 · Implementation map
//   9 · Risks & final recommendation
//
// All text in spec cards is plain HTML so the user can inline-edit it.

const Spec = ({ title, eyebrow, children, accent = false, style = {} }) => (
  <div className={`spec-card${accent ? ' accent' : ''}`} style={style}>
    {eyebrow && <div className="eyebrow">{eyebrow}</div>}
    {title && <h2 className="spec-title">{title}</h2>}
    <div className="spec-body">{children}</div>
  </div>
);

const KV = ({ k, v }) => (
  <div className="kv">
    <div className="k">{k}</div>
    <div className="v">{v}</div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Logo presentation card — large mark + label + description
// ─────────────────────────────────────────────────────────────
const LogoCard = ({ name, subtitle, body, children, recommended = false }) => (
  <div className="logo-card">
    <div className="logo-stage">
      {recommended && <div className="recommend-pip">Recommended</div>}
      {children}
    </div>
    <div className="logo-meta">
      <div className="eyebrow">{subtitle}</div>
      <h3 className="logo-name">{name}</h3>
      <p className="logo-body">{body}</p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// App-icon card — icon at three sizes
// ─────────────────────────────────────────────────────────────
const IconCard = ({ theme = 'obsidian', label, showSafeArea = false }) => (
  <div className="icon-card" data-theme={theme}>
    <div className="icon-stage">
      <AppIcon size={180} theme={theme} mark="aperture" showSafeArea={showSafeArea} />
      <div className="icon-row">
        <div className="icon-pair">
          <AppIcon size={72} theme={theme} mark="aperture" />
          <span className="icon-tag">72</span>
        </div>
        <div className="icon-pair">
          <AppIcon size={48} theme={theme} mark="aperture" />
          <span className="icon-tag">48</span>
        </div>
        <div className="icon-pair">
          <AppIcon size={28} theme={theme} mark="aperture" />
          <span className="icon-tag">28</span>
        </div>
      </div>
    </div>
    <div className="icon-meta">
      <div className="eyebrow">{theme === 'obsidian' ? 'Obsidian mode' : 'Marble mode'}</div>
      <div className="icon-label">{label}</div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Wordmark trio — three sizes on one card
// ─────────────────────────────────────────────────────────────
const WordmarkTrio = () => (
  <div className="wordmark-trio">
    <div className="wm-row">
      <Wordmark size={36} />
      <span className="wm-tag">display</span>
    </div>
    <div className="wm-row">
      <Wordmark size={22} />
      <span className="wm-tag">primary</span>
    </div>
    <div className="wm-row">
      <Wordmark size={14} italicTail={false} />
      <span className="wm-tag">utility · all caps elsewhere</span>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Safe-area diagram for the icon
// ─────────────────────────────────────────────────────────────
const SafeAreaCard = () => (
  <div className="safe-area-card">
    <div className="sa-stage">
      <AppIcon size={220} theme="obsidian" mark="aperture" showSafeArea />
    </div>
    <ul className="sa-list">
      <li>
        <span className="sa-dot a"></span>
        <span><b>Squircle</b> — border-radius 22.37% of icon size (iOS spec)</span>
      </li>
      <li>
        <span className="sa-dot b"></span>
        <span><b>10% bleed</b> — pure background only; nothing readable here</span>
      </li>
      <li>
        <span className="sa-dot c"></span>
        <span><b>52% circular safe area</b> — mark fits inside this</span>
      </li>
      <li>
        <span className="sa-dot d"></span>
        <span><b>Horizon line</b> — anchored at the 38.2% golden ratio of the circle, not the icon</span>
      </li>
    </ul>
  </div>
);

// ─────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────
const App = () => (
  <DesignCanvas>
    {/* ───── 1 · Diagnosis ───── */}
    <DCSection id="diagnosis" title="01 · Auth & logo gap diagnosis" subtitle="Where the product is and what's missing">
      <DCArtboard id="diag" label="The gap" width={620} height={520} style={{ background: '#0E0E12' }}>
        <Spec eyebrow="Current state · 15 May">
          <p>
            The app has stabilized around <i>Obsidian Temple</i>: a five-tab phone surface with a stacked-medallion home,
            an astrolabe Cycle, a Chronicle, Stars, and Settings. The visual system is committed —
            DM Sans, Spectral italic, JetBrains Mono, bronze on obsidian or marble, hairlines and medallions.
          </p>
          <p>
            <b>What it doesn't have yet</b> is an identity at the door. Unauthenticated users land on a generic SaaS sign-in,
            which breaks the spell before the temple begins. There's also no logo to anchor the wordmark, the favicon, or the
            PWA install icon. Three things are missing, in this order:
          </p>
          <ol className="num-list">
            <li>A logo mark — abstract enough to scale to a 16px favicon and pair with the existing wordmark.</li>
            <li>A sign-in / sign-up surface that already feels like the Temple tab.</li>
            <li>An app-icon treatment for iOS / PWA install that doesn't quote the wordmark.</li>
          </ol>
          <p className="ital-note">
            Constraint reminder: mythology stays atmospheric. No columns, laurels, lightning, faces.
            We are designing a <i>door</i>, not a temple façade.
          </p>
        </Spec>
      </DCArtboard>

      <DCArtboard id="missing-readme" label="Source-of-truth note" width={360} height={520} style={{ background: '#15151b' }}>
        <Spec eyebrow="Note to reviewer" accent>
          <p>
            The brief references <span className="mono-inline">design/obsidian-temple/README.md</span>,
            <span className="mono-inline">design-system.md</span>, and
            <span className="mono-inline">implementation-map.md</span> — these files aren't present in
            this project's filesystem.
          </p>
          <p>
            I've worked from the in-project source of truth instead:
          </p>
          <ul className="bullet-list">
            <li><span className="mono-inline">tokens.css</span> — colors, type, radii</li>
            <li><span className="mono-inline">prototype-base.css</span> — phone shell, medallions, eyebrow</li>
            <li><span className="mono-inline">prototype-screens.css</span> — per-screen idioms</li>
            <li><span className="mono-inline">Obsidian Temple — Prototype.html</span></li>
          </ul>
          <p className="ital-note">
            If the three referenced docs exist outside this project, attach them and I'll reconcile.
          </p>
        </Spec>
      </DCArtboard>
    </DCSection>

    {/* ───── 2 · Logo directions ───── */}
    <DCSection id="logos" title="02 · Three logo directions" subtitle="All built from the existing medallion / hairline vocabulary">
      <DCArtboard id="logo-aperture" label="A · Aperture" width={340} height={460} style={{ background: '#0E0E12' }}>
        <LogoCard
          name="Aperture"
          subtitle="A · the open horizon"
          body="A bronze hairline crosses a circle at the golden ratio from the top. Reads as: threshold, dawn line, the moment the temple opens. Reads as a stylized E (an open horizon). Loses the least detail at 16px."
        >
          <LogoAperture size={180} color="#C9A56B" stroke={2} />
        </LogoCard>
      </DCArtboard>

      <DCArtboard id="logo-orbit" label="B · Orbit" width={340} height={460} style={{ background: '#0E0E12' }}>
        <LogoCard
          name="Orbit"
          subtitle="B · the cycle, held"
          body="Two concentric rings, the inner slightly offset, with a single dot at the dawn position. Reads as the astrolabe, the cycle, a moment inside a wider system. Closest sibling to the Cycle tab — possibly too literal a quote of an internal screen."
        >
          <LogoOrbit size={180} color="#C9A56B" stroke={2} />
        </LogoCard>
      </DCArtboard>

      <DCArtboard id="logo-stele" label="C · Stele" width={340} height={460} style={{ background: '#0E0E12' }}>
        <LogoCard
          name="Stele"
          subtitle="C · the stack"
          body="Three descending hairlines inside a ring. Reads as monogram E, strata, the three nights of a Care cycle. Most ornamental of the three, but trends toward hamburger-menu legibility at very small sizes."
        >
          <LogoStele size={180} color="#C9A56B" stroke={2} />
        </LogoCard>
      </DCArtboard>

      <DCArtboard id="logos-summary" label="Read-side comparison" width={520} height={460} style={{ background: '#15151b' }}>
        <Spec eyebrow="Where each reads best">
          <table className="cmp-table">
            <thead>
              <tr><th></th><th>16px favicon</th><th>App icon</th><th>Wordmark sidekick</th><th>Distinctiveness</th></tr>
            </thead>
            <tbody>
              <tr><td className="row-h">Aperture</td><td>★★★</td><td>★★★</td><td>★★★</td><td>★★★</td></tr>
              <tr><td className="row-h">Orbit</td><td>★★</td><td>★★★</td><td>★★</td><td>★★</td></tr>
              <tr><td className="row-h">Stele</td><td>★</td><td>★★</td><td>★★★</td><td>★★</td></tr>
            </tbody>
          </table>
          <p>
            All three resolve to a single shape in a circle — the medallion language is the connective tissue.
            None of them depict mythology; the references are all atmospheric (threshold, cycle, strata).
          </p>
        </Spec>
      </DCArtboard>
    </DCSection>

    {/* ───── 3 · Recommended ───── */}
    <DCSection id="recommended" title="03 · Recommended · Aperture" subtitle="The horizon line — what the product opens at">
      <DCArtboard id="rec-hero" label="Aperture · scaled" width={620} height={460} style={{ background: '#0E0E12' }}>
        <div className="rec-hero">
          <div className="rec-row">
            <div className="rec-pair">
              <LogoAperture size={220} color="#D8B47A" stroke={2.4} />
              <span className="rec-tag">primary · bronze on obsidian</span>
            </div>
            <div className="rec-pair">
              <div className="rec-light"><LogoAperture size={120} color="#8A6A40" stroke={2} /></div>
              <span className="rec-tag">marble · deep-bronze on alabaster</span>
            </div>
            <div className="rec-pair">
              <LogoAperture size={64} color="#D8B47A" stroke={1.4} />
              <LogoAperture size={32} color="#D8B47A" stroke={1.2} />
              <LogoAperture size={16} color="#D8B47A" stroke={1} />
              <span className="rec-tag">favicon ladder</span>
            </div>
          </div>
        </div>
      </DCArtboard>

      <DCArtboard id="rec-wordmark" label="Wordmark lockup" width={460} height={460} style={{ background: '#0E0E12' }}>
        <div className="wm-lockup">
          <div className="wm-row-h">
            <LogoAperture size={42} color="#D8B47A" stroke={1.6} />
            <Wordmark size={28} />
          </div>
          <div className="wm-row-v">
            <LogoAperture size={64} color="#D8B47A" stroke={1.8} />
            <Wordmark size={22} />
          </div>
          <WordmarkTrio />
        </div>
      </DCArtboard>

      <DCArtboard id="rec-rationale" label="Why Aperture" width={460} height={460} style={{ background: '#15151b' }}>
        <Spec eyebrow="Rationale">
          <p>
            <b>Aperture wins on three axes</b> the others don't fully cover:
          </p>
          <ul className="bullet-list">
            <li><b>Scales further</b> — survives at 16px because it is one circle and one line. Orbit blurs; Stele's three bars merge.</li>
            <li><b>Doesn't quote a screen</b> — Orbit looks like the Cycle tab miniaturized, which would compete with the in-app astrolabe.</li>
            <li><b>Carries the brand metaphor</b> — the door, the dawn, the first hour. The horizon line is the same hairline already drawn under every section header in the app.</li>
          </ul>
          <p className="ital-note">
            It also gives us a single animation primitive for free: the line can rise from below at first paint —
            the door opening — without that being a "logo animation" gesture.
          </p>
        </Spec>
      </DCArtboard>
    </DCSection>

    {/* ───── 4 · App icon ───── */}
    <DCSection id="appicon" title="04 · App icon · Obsidian + Marble" subtitle="iOS / PWA install treatment">
      <DCArtboard id="icon-obsidian" label="Obsidian mode" width={360} height={460} style={{ background: '#1a1a21' }}>
        <IconCard theme="obsidian" label="Default · matches system dark UI" />
      </DCArtboard>

      <DCArtboard id="icon-marble" label="Marble mode" width={360} height={460} style={{ background: '#EBE4D6' }}>
        <IconCard theme="marble" label="Tinted · matches system light UI" />
      </DCArtboard>

      <DCArtboard id="icon-safearea" label="Safe area & spec" width={520} height={460} style={{ background: '#15151b' }}>
        <SafeAreaCard />
      </DCArtboard>
    </DCSection>

    {/* ───── 5 · Sign-in screens ───── */}
    <DCSection id="signin" title="05 · Sign-in screens" subtitle="Two layouts in obsidian, one in marble">
      <DCArtboard id="signin-sanctuary" label="A · Sanctuary · default" width={420} height={840} style={{ background: '#08080b', padding: 15 }}>
        <SignInSanctuary theme="obsidian" mark="aperture" />
      </DCArtboard>

      <DCArtboard id="signin-threshold" label="B · Threshold · cinematic" width={420} height={840} style={{ background: '#08080b', padding: 15 }}>
        <SignInThreshold theme="obsidian" mark="aperture" />
      </DCArtboard>

      <DCArtboard id="signin-marble" label="A · Sanctuary · marble" width={420} height={840} style={{ background: '#DDD5C2', padding: 15 }}>
        <SignInSanctuary theme="marble" mark="aperture" tagline="A quiet place to keep your rituals." />
      </DCArtboard>

      <DCArtboard id="signin-spec" label="Sign-in spec" width={420} height={840} style={{ background: '#15151b' }}>
        <Spec eyebrow="Sign-in · components" title="What's on the screen">
          <KV k="Logo placement" v="Centered medallion at 88px, 36px from status bar" />
          <KV k="Wordmark" v="DM Sans 500 / Spectral italic 'ium' · 38px" />
          <KV k="Eyebrow" v="JetBrains Mono · 'Obsidian Temple' · bronze" />
          <KV k="Tagline" v="Spectral italic · 15px · 26ch · ink-muted" />
          <KV k="Email field" v="Hairline-bottom · mono uppercase label · DM Sans value" />
          <KV k="Password field" v="Same hairline · placeholder dot-cluster" />
          <KV k="Primary CTA" v="Bronze pill · mono uppercase 'Enter the temple'" />
          <KV k="Secondary" v="Quiet links · 'Create an account' · 'Forgot'" />
          <KV k="Reassurance" v="Mono micro-caption · 'Synced quietly · encrypted at rest'" />
          <p className="ital-note">No drop-shadow on the form. The phone stage is the only depth.</p>
        </Spec>
      </DCArtboard>
    </DCSection>

    {/* ───── 6 · Sign-up ───── */}
    <DCSection id="signup" title="06 · Sign-up screen" subtitle="Same vocabulary, one extra optional field">
      <DCArtboard id="signup-default" label="Sign-up · obsidian" width={420} height={840} style={{ background: '#08080b', padding: 15 }}>
        <SignUpScreen theme="obsidian" mark="aperture" />
      </DCArtboard>

      <DCArtboard id="signup-marble" label="Sign-up · marble" width={420} height={840} style={{ background: '#DDD5C2', padding: 15 }}>
        <SignUpScreen theme="marble" mark="aperture" />
      </DCArtboard>

      <DCArtboard id="signup-spec" label="Sign-up spec & rationale" width={560} height={840} style={{ background: '#15151b' }}>
        <Spec eyebrow="Sign-up · components" title="What changes from sign-in">
          <ul className="bullet-list">
            <li><b>Optional name field</b> — labeled "name · optional" in mono. We don't ask for "first name / last name" — too transactional. We ask "what to call you".</li>
            <li><b>Tagline shifts</b> — from "A quiet place to keep your rituals" to "A quiet practice begins here." First-arrival framing.</li>
            <li><b>CTA changes</b> — "Begin" instead of "Enter the temple". Cleaner, less ceremonial; ceremony belongs to returning, not arriving.</li>
            <li><b>Password helper</b> — placeholder is "At least eight quiet characters." Communicates rule + brand voice in one line, no separate copy block needed.</li>
            <li><b>No T&amp;C checkbox in the design</b> — handle via the reassurance footer ("You can change anything later · nothing is shared"). If legal needs a checkbox, add a single hairline row above the button; do not invent a card.</li>
            <li><b>No social logins in v1</b> — they break the door metaphor and the obsidian/marble palette. Worth deferring until product-required.</li>
          </ul>
        </Spec>
      </DCArtboard>
    </DCSection>

    {/* ───── 7 · Copy ───── */}
    <DCSection id="copy" title="07 · Copy options" subtitle="Restrained · ritual language, not dramatic">
      <DCArtboard id="copy-taglines" label="Taglines" width={420} height={520} style={{ background: '#0E0E12' }}>
        <Spec eyebrow="Tagline options · pick one">
          <ul className="copy-list">
            <li><b>1.</b> A quiet place to keep your rituals.</li>
            <li><b>2.</b> The first hour is the temple. The rest is the day.</li>
            <li><b>3.</b> A practice, kept simply.</li>
            <li><b>4.</b> Attention, kept honestly.</li>
            <li><b>5.</b> A place for the small things you do every day.</li>
          </ul>
          <p className="ital-note">
            #1 is the safe default — closest to product reality.
            #2 is the most "Obsidian Temple" — best paired with the Threshold layout.
            #3–4 are utility taglines for app-store / favicon contexts.
          </p>
        </Spec>
      </DCArtboard>

      <DCArtboard id="copy-helpers" label="Sign-in helpers" width={420} height={520} style={{ background: '#0E0E12' }}>
        <Spec eyebrow="Sign-in micro-copy">
          <KV k="Primary CTA" v='"Enter the temple" — when returning' />
          <KV k="Primary CTA · alt" v='"Continue" — neutral fallback if "Enter the temple" feels too much' />
          <KV k="Forgot link" v='"Forgot" — single word; resists the form-letter "Forgot your password?"' />
          <KV k="Create-account link" v='"Create an account" — never "Sign up free"' />
          <KV k="Empty-field error" v='"This one is needed." — restrained, not punitive' />
          <KV k="Wrong-credentials" v={"\u201cThat pair doesn\u2019t open the door yet.\u201d"} />
          <KV k="Reassurance" v='"Synced quietly · encrypted at rest"' />
        </Spec>
      </DCArtboard>

      <DCArtboard id="copy-signup" label="Sign-up helpers" width={420} height={520} style={{ background: '#0E0E12' }}>
        <Spec eyebrow="Sign-up micro-copy">
          <KV k="Tagline" v='"A quiet practice begins here. A few minutes a day is enough."' />
          <KV k="Name label" v='"name · optional"' />
          <KV k="Name placeholder" v='"What to call you"' />
          <KV k="Password placeholder" v='"At least eight quiet characters"' />
          <KV k="Primary CTA" v='"Begin"' />
          <KV k="Have-account link" v='"Have an account · sign in"' />
          <KV k="Reassurance" v='"You can change anything later · nothing is shared"' />
          <p className="ital-note">
            Voice rule of thumb: if it could appear in a finance app or a productivity SaaS, rephrase.
            If it sounds like a meditation app, walk it back one step.
          </p>
        </Spec>
      </DCArtboard>
    </DCSection>

    {/* ───── 8 · Implementation map ───── */}
    <DCSection id="impl" title="08 · Implementation map" subtitle="For the Claude Code pass — not yet wired">
      <DCArtboard id="impl-changes" label="Files to change" width={500} height={620} style={{ background: '#15151b' }}>
        <Spec eyebrow="What gets touched · later">
          <KV k="index.html" v="Add the <div id='auth-root'> route and the SVG logo asset (or inline the mark)." />
          <KV k="styles.css" v="Add the .auth-* block (mirrors the .auth-screens shown here). Use existing CSS variables only." />
          <KV k="manifest.json" v="Update icon set: 192, 512 PNG exports of AppIcon (obsidian + marble where supported)." />
          <KV k="favicon" v="Single SVG of Aperture · bronze on transparent · plus 32px and 16px PNG fallbacks." />
          <KV k="meta theme-color" v="Already #0E0E12 in the prototype — keep; mirror for marble via media query." />
        </Spec>
      </DCArtboard>

      <DCArtboard id="impl-untouched" label="What stays untouched" width={500} height={620} style={{ background: '#15151b' }}>
        <Spec eyebrow="Do not touch in this pass">
          <ul className="bullet-list">
            <li><b>app.js auth logic</b> — only the markup wraps it. Field names, submit handlers, error paths unchanged.</li>
            <li><b>Supabase schema</b> — no new tables, no new columns. The "name" field maps to existing profile.display_name if present; otherwise omit.</li>
            <li><b>State / storage / sync</b> — no migrations, no key changes.</li>
            <li><b>Service worker</b> — the new icons can ship without bumping the SW version unless the cache manifest is fingerprinted.</li>
            <li><b>The 7-ritual product model</b> — auth is upstream of product surface. No copy in the auth screens references the seven rituals.</li>
          </ul>
        </Spec>
      </DCArtboard>

      <DCArtboard id="impl-split" label="CSS-only vs markup" width={500} height={620} style={{ background: '#15151b' }}>
        <Spec eyebrow="What's CSS-only vs needs markup">
          <KV k="CSS-only" v="Hairline-field styling · bronze pill button · mono labels · status-bar styling · medallion variants. All reusable from the existing token set." />
          <KV k="Markup change" v="The auth surface replaces the current sign-in HTML with a single .auth-shell wrapper. No new components in the JS sense — just a new template that app.js mounts when unauth'd." />
          <KV k="New asset" v="One SVG (Aperture). Optionally also serve as a 1024×1024 PNG for stores." />
          <KV k="No new deps" v="No icon library, no auth library, no animation library. Everything uses existing fonts already loaded." />
        </Spec>
      </DCArtboard>
    </DCSection>

    {/* ───── 9 · Risks & final ───── */}
    <DCSection id="risks" title="09 · Risks & final recommendation" subtitle="Where this could become cringe — and how to ship it anyway">
      <DCArtboard id="risks-card" label="Risks" width={520} height={620} style={{ background: '#15151b' }}>
        <Spec eyebrow="What could become cringe">
          <ul className="bullet-list">
            <li>
              <b>"Enter the temple"</b> — the most overtly mythic copy in the design. If it lands wrong, fall back to "Continue".
              Keep the mythology in the eyebrow, not the verb.
            </li>
            <li>
              <b>Bronze gradient on the CTA</b> — close to "luxury skincare" cliché. The current treatment is restrained
              (16% opacity on a hairline-bordered pill); resist the urge to push it warmer or shinier.
            </li>
            <li>
              <b>Italic-tail wordmark</b> — "Elys<i>ium</i>" works at display sizes. At &lt;14px the italic shears.
              Switch to plain DM Sans 500 for body / utility instances.
            </li>
            <li>
              <b>Marble theme</b> — bronze-on-cream can read as "spa" or "wellness brand". Keep saturation low,
              keep the obsidian theme as the default first-paint.
            </li>
            <li>
              <b>Aperture vs Cycle screen</b> — both use a circle. The horizon line distinguishes the logo;
              don't add a second hairline to either side, or they'll start to look alike.
            </li>
          </ul>
        </Spec>
      </DCArtboard>

      <DCArtboard id="final-card" label="Final recommendation" width={520} height={620} style={{ background: '#0E0E12' }}>
        <Spec eyebrow="The ship list" accent>
          <ol className="num-list">
            <li><b>Aperture</b> as the mark — single SVG, bronze on transparent.</li>
            <li><b>Wordmark</b> with italic terminal at display sizes, plain DM Sans 500 below 14px.</li>
            <li><b>Sign-in · Sanctuary (obsidian)</b> as the default route; Threshold available as a Tweaks toggle for review.</li>
            <li><b>Sign-up</b> identical vocabulary, one optional name field, "Begin" CTA.</li>
            <li><b>App icon</b> obsidian by default, marble auto-tinted by system appearance where the platform supports it.</li>
            <li><b>Copy default</b>: tagline #1, reassurance "Synced quietly · encrypted at rest".</li>
          </ol>
          <p className="ital-note">
            Defer until a later pass: social logins, passwordless / magic link, T&amp;C checkbox UI,
            illustration on the sky (Threshold variant), animated horizon-line entrance.
            Each is a deliberate omission, not an oversight.
          </p>
        </Spec>
      </DCArtboard>
    </DCSection>
  </DesignCanvas>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
