// Elysium — Logo & App Icon · comprehensive exploration
// Layout (top→bottom on the canvas):
//   01 · Brief, ground truth, north star
//   02 · 9-up grid · 3 prior + 6 new directions
//   03 · Shortlist · the three strongest
//   04 · Lead · MERIDIAN at scale + wordmark lockup
//   05 · App icon · panorama + home-screen-in-context
//   06 · Monochrome + bronze · 5-up palette study
//   07 · Size ladder · 180 → 16
//   08 · Motion · first-paint reveal
//   09 · Brand adjacency · who Elysium sits beside
//   10 · Recommendation & risks

const LExp_App = () => (
  <DesignCanvas>

    {/* ─── 01 · Brief & ground truth ─── */}
    <DCSection id="brief" title="01 · Brief & ground truth"
               subtitle="Where Elysium sits, what the mark must carry">
      <DCArtboard id="brief-card" label="Brief" width={620} height={520} style={{ background: '#0E0E12' }}>
        <div className="spec-card">
          <div className="eyebrow">Brief · 24 May</div>
          <h2 className="spec-title">A medallion for a ritual operating system.</h2>
          <div className="spec-body">
            <p>
              Elysium is no longer a skincare tracker. It is becoming a <i>philosophy-led ritual operating system</i> —
              a calm personal companion held together by seven domains (Light · Care · Body · Mind · Water · Sleep · Chronicle)
              and a single visual identity: <b>Obsidian Temple</b>.
            </p>
            <p>The mark we ship needs to do five things:</p>
            <ol className="num-list">
              <li><b>Read as a seal</b> — an ancient medallion rediscovered in a minimalist future, not a startup glyph.</li>
              <li><b>Survive at 16&nbsp;px</b> — favicon, app-switcher thumb, notification dot.</li>
              <li><b>Carry the dual themes</b> — bronze on obsidian and bronze on marble, equally at home.</li>
              <li><b>Not quote an in-app screen</b> — the astrolabe and the constellation belong to the product surface.</li>
              <li><b>Sit beside Notion, Linear, Arc, Apple Journal, Aesop, Loewe, Rimowa</b> — not beside wellness or gaming.</li>
            </ol>
            <p className="ital-note">
              Mythology stays atmospheric. No helmets, columns, lightning, owls, laurels, wreaths, water drops, leaves.
              The brand instrument is the <i>medallion</i> — a circle with one carved element inside it.
            </p>
          </div>
        </div>
      </DCArtboard>

      <DCArtboard id="ground-truth" label="Ground truth · in-project" width={400} height={520}
                  style={{ background: '#15151b' }}>
        <div className="spec-card">
          <div className="eyebrow">Anchored to</div>
          <h2 className="spec-title">The Obsidian Temple system.</h2>
          <div className="spec-body">
            <ul className="bullet-list">
              <li><span className="mono-inline">design/obsidian-temple/design-system.md</span> — tokens, type, components</li>
              <li><span className="mono-inline">design/obsidian-temple/README.md</span> — the allowed / forbidden vocabulary</li>
              <li><span className="mono-inline">tokens.css</span> — bronze <span className="mono-inline">#C9A56B</span> / <span className="mono-inline">#A07A4A</span></li>
              <li><span className="mono-inline">glyphs.jsx</span> — the seven ritual glyphs already drawn the same way</li>
            </ul>
            <p>
              The marks below borrow exactly two primitives from this system: <b>a hairline circle</b>
              (the medallion ring) and <b>a single carved element inside it</b>. They are siblings
              of the ritual glyphs already in the product, not competitors with them.
            </p>
            <p className="ital-note">
              Same stroke weight as section separators. Same bronze. Same restraint.
            </p>
          </div>
        </div>
      </DCArtboard>

      <DCArtboard id="north-star" label="North star" width={400} height={520}
                  style={{ background: '#0E0E12' }}>
        <div className="spec-card">
          <div className="eyebrow">North star · one sentence</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontSize: 28, lineHeight: 1.3, color: 'var(--ink)',
            margin: '24px 0', letterSpacing: '-0.01em',
          }}>
            A carved hairline that could have been pressed into obsidian three thousand years ago — and rendered crisply on a 16-pixel favicon today.
          </div>
          <div className="spec-body">
            <p>
              The whole exploration below is a search for one mark that holds both ends of that sentence.
              Anything that drifts toward fantasy on one side or toward generic SaaS on the other has failed the brief.
            </p>
          </div>
        </div>
      </DCArtboard>
    </DCSection>

    {/* ─── 02 · 9-up grid ─── */}
    <DCSection id="grid" title="02 · Nine candidates"
               subtitle="Three from the prior pass · six new symbolic directions">

      <DCArtboard id="grid-9up" label="The 9-up" width={780} height={780}
                  style={{ background: '#0E0E12' }}>
        <div className="mark-grid">
          <MarkCell idx="01" name="Aperture"    tag="threshold · dawn line"     Mark={LogoAperture}   prior />
          <MarkCell idx="02" name="Orbit"       tag="cycle held · dawn pip"     Mark={LogoOrbit}      prior />
          <MarkCell idx="03" name="Stele"       tag="strata · the stack"        Mark={LogoStele}      prior />
          <MarkCell idx="04" name="Meridian"    tag="gnomon · still axis"       Mark={LogoMeridian}        />
          <MarkCell idx="05" name="Conjunction" tag="alignment · two readings"  Mark={LogoConjunction}     />
          <MarkCell idx="06" name="Phases"      tag="fourfold day"              Mark={LogoPhases}          />
          <MarkCell idx="07" name="Tablet"      tag="carved inlay · pictogram"  Mark={LogoTablet}          />
          <MarkCell idx="08" name="Vault"       tag="threshold · lintel"        Mark={LogoVault}           />
          <MarkCell idx="09" name="Compass"     tag="cardinal · radial"         Mark={LogoCompass}         />
        </div>
      </DCArtboard>

      <DCArtboard id="grid-key" label="Symbolism key" width={460} height={780}
                  style={{ background: '#15151b' }}>
        <div className="spec-card">
          <div className="eyebrow">Symbolism · per mark</div>
          <h2 className="spec-title">What each carving carries.</h2>
          <div className="spec-body">
            <div className="kv">
              <div className="k">01 Aperture</div>
              <div className="v">The horizon line through a circle at golden ratio. The first hour, the door opening.</div>
            </div>
            <div className="kv">
              <div className="k">02 Orbit</div>
              <div className="v">Two rings, one offset; a single dawn pip. The cycle held with a moment inside it.</div>
            </div>
            <div className="kv">
              <div className="k">03 Stele</div>
              <div className="v">Three descending hairlines. Strata; the three nights of a Care cycle.</div>
            </div>
            <div className="kv">
              <div className="k">04 Meridian</div>
              <div className="v">A gnomon line bisecting the ring. The still axis. Pole star, sundial pole, the spine.</div>
            </div>
            <div className="kv">
              <div className="k">05 Conjunction</div>
              <div className="v">Two circles overlapping. Sun meeting moon. The body and the sky, briefly aligned.</div>
            </div>
            <div className="kv">
              <div className="k">06 Phases</div>
              <div className="v">Four cardinal pips on a ring. The fourfold day: dawn, noon, dusk, night.</div>
            </div>
            <div className="kv">
              <div className="k">07 Tablet</div>
              <div className="v">A bronze diamond carved inside the ring. The kept record. The sacred geometry of order.</div>
            </div>
            <div className="kv">
              <div className="k">08 Vault</div>
              <div className="v">Arc above a horizontal line. The temple dome above the threshold; the door opens.</div>
            </div>
            <div className="kv">
              <div className="k">09 Compass</div>
              <div className="v">Four short radial strokes from center. The cardinal points; attention radiating from a still point.</div>
            </div>
            <p className="ital-note">
              All nine are buildable in <b>three SVG primitives or fewer</b>. None of them depicts a person, a deity, a weapon, or an organic form.
            </p>
          </div>
        </div>
      </DCArtboard>
    </DCSection>

    {/* ─── 03 · Shortlist ─── */}
    <DCSection id="shortlist" title="03 · Shortlist"
               subtitle="The three that survive every constraint">

      <DCArtboard id="sl-meridian" label="A · Meridian · lead" width={420} height={620}
                  style={{ background: '#0E0E12' }}>
        <ShortlistCard
          rank="I"
          name="Meridian"
          accent="the still axis"
          subtitle="A · the carved spine"
          symbolism="A vertical hairline bisecting the medallion, with one bronze pip at the top. The gnomon — the pole that casts the shadow that makes time visible."
          body="It carries everything Aperture carried (the door, the threshold, the dawn pip) — but vertical instead of horizontal, which solves the favicon problem decisively and is harder to confuse with the Cycle screen. The most timeless of the nine. A coin found in a temple."
          Mark={LogoMeridian}
          isRecommended
        />
      </DCArtboard>

      <DCArtboard id="sl-aperture" label="B · Aperture · safe alternate" width={420} height={620}
                  style={{ background: '#0E0E12' }}>
        <ShortlistCard
          rank="II"
          name="Aperture"
          accent="the open horizon"
          subtitle="B · the prior lead"
          symbolism="A hairline crosses the medallion at the golden ratio from the top. The first hour. The horizon line."
          body="The reigning recommendation from the prior pass — still excellent. The dawn-line read pairs naturally with the 'Light' archetype that opens the day. The only reason it isn't lead anymore is that Meridian gets the same metaphor with a more carved, more vertical, more medallion-native gesture."
          Mark={LogoAperture}
        />
      </DCArtboard>

      <DCArtboard id="sl-tablet" label="C · Tablet · expressive alternate" width={420} height={620}
                  style={{ background: '#0E0E12' }}>
        <ShortlistCard
          rank="III"
          name="Tablet"
          accent="the carved inlay"
          subtitle="C · the coin face"
          symbolism="A bronze diamond inset in the medallion ring. The kept record; the inlay on a stone tablet; sacred geometry of order held inside continuity."
          body="The most overtly medallion-like — a coin face. Loses to Meridian on app-icon scale (the diamond can read as a generic 'gem' at 28&nbsp;px), but is the strongest of the nine for editorial work: business cards, app-store key art, founder letters."
          Mark={LogoTablet}
        />
      </DCArtboard>

      <DCArtboard id="sl-rejects" label="Why the others didn't make it" width={460} height={620}
                  style={{ background: '#15151b' }}>
        <div className="spec-card">
          <div className="eyebrow">Cuts · honest notes</div>
          <h2 className="spec-title">Six near-misses.</h2>
          <div className="spec-body">
            <div className="kv">
              <div className="k">Orbit</div>
              <div className="v">Too close to the Cycle screen's astrolabe. The logo would compete with the most distinctive in-app surface.</div>
            </div>
            <div className="kv">
              <div className="k">Stele</div>
              <div className="v">Reads as hamburger menu below ~22&nbsp;px. Beautiful as a print stamp; loses where it has to live.</div>
            </div>
            <div className="kv">
              <div className="k">Conjunction</div>
              <div className="v">Reads as Audi / Mastercard / Olympic rings if abstracted. The two-circle motif is owned territory.</div>
            </div>
            <div className="kv">
              <div className="k">Phases</div>
              <div className="v">Reads as a four-dot loading spinner or compass rose at small sizes. The pips can't be told from cursor dots.</div>
            </div>
            <div className="kv">
              <div className="k">Vault</div>
              <div className="v">A half-circle over a line is the universal sign for "rainbow" or "bridge". Too literal of an arch, and too horizontal for a square icon.</div>
            </div>
            <div className="kv">
              <div className="k">Compass</div>
              <div className="v">Too close to existing iconography (cross, plus, asterisk). Doesn't say anything Elysium-specific.</div>
            </div>
            <p className="ital-note">
              Each rejection is preserved here so the choice can be re-litigated if the brief moves. None of them is bad work — they
              just lose to the same constraint: <i>a single mark, recognizable in a sea of icons, that doesn't echo anything else</i>.
            </p>
          </div>
        </div>
      </DCArtboard>
    </DCSection>

    {/* ─── 04 · The lead · Meridian at scale ─── */}
    <DCSection id="lead" title="04 · The lead · Meridian"
               subtitle="The carved spine — at scale, with wordmark">

      <DCArtboard id="lead-hero" label="Meridian · on obsidian" width={620} height={520}
                  style={{ background: '#0E0E12' }}>
        <div style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: 30,
          background: 'radial-gradient(ellipse at 50% 25%, rgba(201,165,107,0.14), transparent 60%)',
        }}>
          <LogoMeridian size={280} color="#D8B47A" stroke={2.6} />
        </div>
      </DCArtboard>

      <DCArtboard id="lead-marble" label="Meridian · on marble" width={460} height={520}
                  style={{ background: '#F4EFE6' }}>
        <div style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(ellipse at 50% 25%, rgba(160,122,74,0.14), transparent 60%)',
        }}>
          <LogoMeridian size={240} color="#8A6A40" stroke={2.4} />
        </div>
      </DCArtboard>

      <DCArtboard id="lead-lockup" label="Wordmark lockup" width={520} height={520}
                  style={{ background: '#0E0E12' }}>
        <div className="lockup-pano">
          <div className="lockup-band is-obs" style={{ flexDirection: 'column', gap: 24 }}>
            <span className="lockup-band-label">Horizontal lockup</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <LogoMeridian size={48} color="#D8B47A" stroke={1.7} />
              <Wordmark size={30} />
            </div>
            <div style={{
              borderTop: '1px solid rgba(236,230,217,0.10)',
              paddingTop: 22, marginTop: 8, width: '70%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <LogoMeridian size={20} color="#D8B47A" stroke={1.2} />
              <Wordmark size={14} italicTail={false} />
            </div>
          </div>
          <div className="lockup-band is-marble" style={{ flexDirection: 'column', gap: 22 }}>
            <span className="lockup-band-label">Stacked · marble</span>
            <LogoMeridian size={56} color="#8A6A40" stroke={1.8} />
            <Wordmark size={26} color="#1A1816" accent="#8A6A40" />
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em',
              color: 'rgba(26,24,22,0.5)', textTransform: 'uppercase', marginTop: 4,
            }}>Obsidian Temple</div>
          </div>
        </div>
      </DCArtboard>
    </DCSection>

    {/* ─── 05 · App icon ─── */}
    <DCSection id="appicon" title="05 · App icon"
               subtitle="iOS · PWA install · marble auto-tint by system appearance">

      <DCArtboard id="icon-pano" label="Size sweep · both themes" width={780} height={520}
                  style={{ background: '#0E0E12' }}>
        <IconPano Mark={LogoMeridian} />
      </DCArtboard>

      <DCArtboard id="icon-home" label="In context · iOS home" width={360} height={620}
                  style={{ background: '#000', padding: 0 }}>
        <HomeScreen Mark={LogoMeridian} />
      </DCArtboard>

      <DCArtboard id="icon-spec" label="Safe area & spec" width={420} height={620}
                  style={{ background: '#15151b' }}>
        <div className="safe-area-card">
          <div className="sa-stage">
            <IconTile size={220} theme="obsidian" Mark={LogoMeridian} showSafeArea />
          </div>
          <ul className="sa-list">
            <li><span className="sa-dot a"></span><span><b>Squircle</b> — border-radius 22.37% of icon size</span></li>
            <li><span className="sa-dot b"></span><span><b>10% bleed</b> — pure background only, no readable detail</span></li>
            <li><span className="sa-dot c"></span><span><b>52% safe area</b> — the medallion fits inside this circle</span></li>
            <li><span className="sa-dot d"></span><span><b>Meridian line</b> — drawn from rim to rim, not edge-to-edge</span></li>
          </ul>
        </div>
      </DCArtboard>
    </DCSection>

    {/* ─── 06 · Monochrome + bronze ─── */}
    <DCSection id="mono" title="06 · Monochrome + bronze"
               subtitle="Where the mark sits across the palette — and where it shouldn't">

      <DCArtboard id="mono-strip" label="Five colorways" width={920} height={320}
                  style={{ background: '#15151b' }}>
        <MonoStrip
          Mark={LogoMeridian}
          foot={<>
            Default is bronze on obsidian. Ink-on-obsidian and ink-on-marble are the print fallbacks (one-color stamping, lasered into wood, embossed on paper).
            Reverse — obsidian on bronze — is reserved for the boot splash and store key art only; never use as a UI element.
          </>}
        />
      </DCArtboard>

      <DCArtboard id="mono-rules" label="Usage rules" width={460} height={320}
                  style={{ background: '#0E0E12' }}>
        <div className="spec-card">
          <div className="eyebrow">Color · what's allowed</div>
          <div className="spec-body">
            <div className="kv"><div className="k">Default</div><div className="v">Bronze <span className="mono-inline">#C9A56B</span> on obsidian <span className="mono-inline">#0E0E12</span></div></div>
            <div className="kv"><div className="k">Marble</div><div className="v">Bronze <span className="mono-inline">#A07A4A</span> on warm stone <span className="mono-inline">#F4EFE6</span></div></div>
            <div className="kv"><div className="k">Print mono</div><div className="v">Ink on its native ground only — never ink on a contrasting ground</div></div>
            <div className="kv"><div className="k">Reverse</div><div className="v">Obsidian on bronze, splash/key-art only · never in UI</div></div>
            <div className="kv"><div className="k">Forbidden</div><div className="v">No gradients on the mark · no bronze on white · no two-color treatments</div></div>
          </div>
        </div>
      </DCArtboard>
    </DCSection>

    {/* ─── 07 · Size ladder ─── */}
    <DCSection id="ladder" title="07 · Size ladder"
               subtitle="180&nbsp;px hero down to 16&nbsp;px favicon · no detail loss">
      <DCArtboard id="ladder" label="Meridian · size sweep" width={920} height={360}
                  style={{ background: '#0E0E12' }}>
        <SizeLadder
          Mark={LogoMeridian}
          sizes={[180, 96, 56, 32, 20, 16]}
          note={<>Stroke scales with size (max 2.4&nbsp;px at hero, min 1&nbsp;px at favicon). The bronze pip stays present down to 20&nbsp;px; at 16&nbsp;px it merges with the gnomon and the mark reads as a single carved I — still distinctive.</>}
        />
      </DCArtboard>
    </DCSection>

    {/* ─── 08 · Motion ─── */}
    <DCSection id="motion" title="08 · Motion behavior"
               subtitle="Sub-second, once per session, never idle">
      <DCArtboard id="motion-card" label="First-paint reveal" width={920} height={420}
                  style={{ background: '#0E0E12' }}>
        <MotionStrip Mark={LogoMeridian} />
      </DCArtboard>

      <DCArtboard id="motion-rules" label="Motion rules" width={420} height={420}
                  style={{ background: '#15151b' }}>
        <div className="spec-card">
          <div className="eyebrow">Motion · the discipline</div>
          <div className="spec-body">
            <ul className="bullet-list">
              <li><b>One gesture only.</b> The ring traces, the gnomon rises, the pip blooms. Three moves, in sequence, under 1.1&nbsp;s.</li>
              <li><b>No idle animation.</b> The mark never breathes, pulses, or rotates. Stillness <i>is</i> the brand.</li>
              <li><b>Once per session.</b> Cold launch only. App-switcher re-entries land on the final state.</li>
              <li><b>Reduced-motion fallback.</b> Cross-fade from empty medallion to settled state, 280&nbsp;ms.</li>
              <li><b>In-app uses.</b> Reused for the auth screen reveal and as the "synced quietly" indicator on Chronicle save — same gesture, half the duration.</li>
            </ul>
            <p className="ital-note">
              The motion is borrowed from the Cycle ring fill (600&nbsp;ms cubic-bezier 0.2 0.7 0.2 1) already in the system.
              Same easing curve everywhere — the app moves like one thing.
            </p>
          </div>
        </div>
      </DCArtboard>
    </DCSection>

    {/* ─── 09 · Brand adjacency ─── */}
    <DCSection id="adjacency" title="09 · Brand adjacency"
               subtitle="Where the mark sits in the room">
      <DCArtboard id="adj-board" label="The room Elysium walks into" width={620} height={520}
                  style={{ background: '#0E0E12' }}>
        <div className="adjacency-card">
          <div className="eyebrow">Brand neighbors · explicit targets</div>
          <div className="adj-row">
            <div className="adj-brand">Apple Journal</div>
            <div className="adj-note"><b>The closest sibling.</b> A square with one carved gesture inside it. Same restraint, same warm-mono palette. Elysium's mark earns a place on the same home screen.</div>
          </div>
          <div className="adj-row">
            <div className="adj-brand">Aesop</div>
            <div className="adj-note"><b>The voice influence.</b> Editorial typography, deliberate whitespace, no shine. Meridian carries the same "considered object" mood without being literal about it.</div>
          </div>
          <div className="adj-row">
            <div className="adj-brand">Loewe · Rimowa</div>
            <div className="adj-note"><b>The luxury restraint.</b> One stamped emblem, no gradient, no figural illustration. Elysium can show up on a leather goods page and not look out of place.</div>
          </div>
          <div className="adj-row">
            <div className="adj-brand">Linear · Arc · Notion</div>
            <div className="adj-note"><b>The software peer group.</b> Simple geometric marks, single accent color. Meridian's hairline gnomon plays the same game with a more atmospheric vocabulary.</div>
          </div>
        </div>
      </DCArtboard>

      <DCArtboard id="adj-distance" label="Brands we are not" width={400} height={520}
                  style={{ background: '#15151b' }}>
        <div className="spec-card">
          <div className="eyebrow">Distance · what we walk past</div>
          <h2 className="spec-title">Where we visibly aren't.</h2>
          <div className="spec-body">
            <ul className="bullet-list">
              <li><b>Calm / Headspace / Aura</b> — soft gradients, mascot icons, rounded sans. Wellness startup territory.</li>
              <li><b>Strava / WHOOP / Eight Sleep</b> — sport-tech sharpness, athletic typography. Wrong temperature.</li>
              <li><b>The Ordinary / Glossier</b> — skincare-product seriousness. The old direction; we are leaving.</li>
              <li><b>Final Fantasy / League of Legends</b> — fantasy mythology, ornament, gilding. The brief's explicit no.</li>
              <li><b>Generic productivity</b> — checkmarks-in-circles, gradient logos, "P" monograms. Office-software default.</li>
            </ul>
            <p className="ital-note">
              The distance from these is what makes the mark legible. If at any point Meridian starts looking like one of them, walk it back.
            </p>
          </div>
        </div>
      </DCArtboard>

      <DCArtboard id="adj-grid" label="In-room visual test" width={420} height={520}
                  style={{ background: '#15151b' }}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 24, gap: 18 }}>
          <div className="eyebrow">A row of icons · would you find Elysium?</div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 8,
          }}>
            {/* fake adjacent app icons + Elysium */}
            <div style={{ aspectRatio: '1', borderRadius: 14, background: 'linear-gradient(160deg, #fff, #f0f0f0)' }}></div>
            <div style={{ aspectRatio: '1', borderRadius: 14, background: 'linear-gradient(160deg, #2c2c2e, #1c1c1e)' }}></div>
            <IconTile size={76} theme="obsidian" Mark={LogoMeridian} />
            <div style={{ aspectRatio: '1', borderRadius: 14, background: 'linear-gradient(160deg, #fff 60%, #e6e6e6)' }}></div>
            <div style={{ aspectRatio: '1', borderRadius: 14, background: 'linear-gradient(160deg, #ff3b30, #c91e3b)' }}></div>
            <div style={{ aspectRatio: '1', borderRadius: 14, background: 'linear-gradient(160deg, #cfe5b9, #88b76d)' }}></div>
            <div style={{ aspectRatio: '1', borderRadius: 14, background: '#1d72e8' }}></div>
            <IconTile size={76} theme="marble" Mark={LogoMeridian} />
          </div>
          <p style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            color: 'var(--ink-muted)', fontSize: 13, lineHeight: 1.5, marginTop: 12,
          }}>
            Elysium reads as the quietest tile in either row — a still note among the loud ones. That's the correct outcome.
            The bronze-on-obsidian icon is the only one in the row that doesn't shout, which is exactly why the eye comes back to it.
          </p>
        </div>
      </DCArtboard>
    </DCSection>

    {/* ─── 10 · Recommendation & risks ─── */}
    <DCSection id="final" title="10 · Recommendation"
               subtitle="What to ship · what to defer">

      <DCArtboard id="final-card" label="Ship list" width={520} height={620}
                  style={{ background: '#0E0E12' }}>
        <div className="spec-card accent">
          <div className="eyebrow">The ship list</div>
          <h2 className="spec-title">Meridian, in five layers.</h2>
          <div className="spec-body">
            <ol className="num-list">
              <li><b>Mark</b> — Meridian. One SVG, bronze on transparent. Ring radius 42% of icon, stroke 1.5&nbsp;px at 96&nbsp;px.</li>
              <li><b>Wordmark</b> — Elys<i>ium</i>, DM Sans 500 with Spectral italic terminal at display sizes; plain DM Sans 500 below 14&nbsp;px.</li>
              <li><b>App icon</b> — obsidian default, marble auto-tint via <span className="mono-inline">@media (prefers-color-scheme: light)</span> manifest pair.</li>
              <li><b>Favicon</b> — single SVG of Meridian, plus 32&nbsp;px and 16&nbsp;px PNG fallbacks at the same bronze.</li>
              <li><b>Motion</b> — first-paint reveal on cold launch only; reuse for auth screen entrance.</li>
            </ol>
            <p className="ital-note">
              All of this is buildable from the existing token set. No new color, no new font, no new dependency. The mark is one SVG file.
            </p>
          </div>
        </div>
      </DCArtboard>

      <DCArtboard id="why" label="Why Meridian wins" width={420} height={620}
                  style={{ background: '#15151b' }}>
        <div className="spec-card">
          <div className="eyebrow">Decision rationale</div>
          <div className="spec-body">
            <p>Meridian wins on four axes simultaneously:</p>
            <ul className="bullet-list">
              <li><b>Apple-quality restraint.</b> One ring, one line, one pip. There is no quieter mark in the room.</li>
              <li><b>Obsidian Temple fidelity.</b> Built from the same primitives as the ritual glyphs; reads as a sibling, not a stranger.</li>
              <li><b>Editorial gravity.</b> Vertical axis like a bronze obelisk on a page — works at the head of a Substack column or a foundation letter without ornament.</li>
              <li><b>Ritual atmosphere.</b> The gnomon is the still axis around which the day turns. The mark <i>is</i> the metaphor: a still center inside a cycle.</li>
            </ul>
            <p className="ital-note">
              Aperture (the prior lead) wins on three of four. Meridian wins on all four because it gets the same metaphor with a more carved, more medallion-native gesture — and a stronger 16&nbsp;px read.
            </p>
          </div>
        </div>
      </DCArtboard>

      <DCArtboard id="risks" label="Risks · how to keep it honest" width={420} height={620}
                  style={{ background: '#0E0E12' }}>
        <div className="spec-card">
          <div className="eyebrow">Risks · drift-watch</div>
          <div className="spec-body">
            <ul className="bullet-list">
              <li><b>Reading as the letter I.</b> Meridian is close to a serif uppercase I. Acceptable — even a feature — but it means we never letterspace "I" next to it in the wordmark.</li>
              <li><b>Pip drift.</b> The bronze pip wants to grow. Hold it at <span className="mono-inline">stroke × 1.3</span>; anything bigger reads as a bullet.</li>
              <li><b>The gnomon turning into a divider.</b> Below 20&nbsp;px the gnomon and ring merge. Acceptable; do not "fix" it by thickening the stroke — that would push the mark toward Stele's hamburger problem.</li>
              <li><b>Marble palette warmth creep.</b> Bronze-on-marble is one shade away from "luxury spa". Keep <span className="mono-inline">#A07A4A</span>; resist any push toward warmer rose / copper.</li>
              <li><b>Animation overreach.</b> A single sub-second reveal, once per session. Never breathing, never rotating, never re-running.</li>
            </ul>
            <p className="ital-note">
              Defer to a later pass: animated wordmark, multi-color brand event treatments, founder-letter masthead, embossed business-card test pull.
              All worth doing — none of them gates the v1 ship.
            </p>
          </div>
        </div>
      </DCArtboard>
    </DCSection>

  </DesignCanvas>
);

ReactDOM.createRoot(document.getElementById('root')).render(<LExp_App />);
