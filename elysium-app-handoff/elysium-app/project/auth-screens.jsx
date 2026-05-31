// Elysium — Auth screens (sign-in / sign-up)
// Phone-sized artboards (390 × 820) that share visual vocabulary with the
// Temple tab: bronze hairline, JetBrains Mono labels, Spectral italic tagline,
// DM Sans for everything else, status bar, and the temple-grad ambient glow.
//
// IMPORTANT — these are static design specs. No app.js or Supabase logic is
// invoked. Wired only enough to feel real (focus-state on inputs).

const { useState: useStateAuth } = React;

// ─────────────────────────────────────────────────────────────
// Shared chrome — status bar & phone stage wrapper.
// Slightly tighter shadow than the prototype's so the device sits
// well on a design-canvas card.
// ─────────────────────────────────────────────────────────────
const AuthStage = ({ theme = 'obsidian', children, label }) => (
  <div className="app-shell auth-shell" data-theme={theme} data-screen-label={label}>
    <div className="phone-stage auth-phone">
      <div className="screen">
        <div className="status-bar">
          <span>9:41</span>
          <div className="dots"><span></span><span></span><span></span></div>
        </div>
        <div className="screen-body" style={{ display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>
    </div>
  </div>
);

// A single underlined input — no boxy field, just a hairline that brightens
// on focus. Label is a JetBrains-Mono micro-caption above.
const HairlineField = ({ label, type = 'text', value, onChange, placeholder, autoComplete }) => {
  const [focus, setFocus] = useStateAuth(false);
  return (
    <label style={{
      display: 'flex', flexDirection: 'column', gap: 6, padding: '14px 0 12px',
      borderBottom: `1px solid ${focus ? 'var(--bronze)' : 'var(--separator)'}`,
      transition: 'border-color 200ms ease',
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.24em',
        textTransform: 'uppercase', color: focus ? 'var(--bronze)' : 'var(--ink-faint)',
        transition: 'color 200ms ease',
      }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          border: 0, background: 'transparent', outline: 'none', padding: 0,
          fontFamily: 'var(--font-sans)', fontSize: 16, color: 'var(--ink)',
          fontWeight: 400, letterSpacing: '-0.005em',
        }}
      />
    </label>
  );
};

// Bronze pill button — matches medallion grammar.
const EnterButton = ({ children, disabled = false, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      width: '100%',
      padding: '15px 18px',
      marginTop: 24,
      borderRadius: 999,
      border: '1px solid var(--bronze)',
      background: 'linear-gradient(180deg, rgba(201,165,107,0.16), rgba(201,165,107,0.04))',
      color: 'var(--bronze)',
      fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.3em',
      textTransform: 'uppercase', fontWeight: 500,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      boxShadow: 'var(--glow-bronze)',
      transition: 'transform 180ms ease, box-shadow 200ms ease',
    }}
  >{children}</button>
);

// Header — logo medallion + wordmark + italic tagline.
const AuthHeader = ({ mark = 'aperture', tagline, eyebrow = 'Obsidian Temple', compact = false }) => {
  const Mark = mark === 'orbit' ? LogoOrbit : mark === 'stele' ? LogoStele : LogoAperture;
  const titleSize = compact ? 32 : 38;
  return (
    <div style={{ textAlign: 'center', padding: compact ? '24px 0 18px' : '36px 0 22px' }}>
      <div className={`medallion bronzed ${compact ? 'lg' : 'xl'}`} style={{ margin: `0 auto ${compact ? 14 : 18}px` }}>
        <Mark size={compact ? 38 : 50} />
      </div>
      <div className="eyebrow center" style={{ marginBottom: 10 }}>{eyebrow}</div>
      <h1 style={{
        margin: 0,
        fontFamily: 'var(--font-sans)',
        fontWeight: 500,
        fontSize: titleSize,
        letterSpacing: '-0.02em',
        color: 'var(--ink)',
        lineHeight: 1,
      }}>
        Elys<span className="ital" style={{ fontSize: titleSize }}>ium</span>
      </h1>
      {tagline && (
        <p style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic',
          fontSize: 15, color: 'var(--ink-muted)', margin: '14px auto 0',
          maxWidth: '26ch', lineHeight: 1.4,
        }}>{tagline}</p>
      )}
    </div>
  );
};

const Reassurance = ({ children }) => (
  <div style={{
    textAlign: 'center', padding: '18px 24px 22px',
    fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.18em',
    textTransform: 'uppercase', color: 'var(--ink-faint)', lineHeight: 1.6,
  }}>{children}</div>
);

const QuietLink = ({ children, onClick, accent = false }) => (
  <button onClick={onClick} style={{
    background: 'none', border: 0, padding: '8px 6px',
    fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.22em',
    textTransform: 'uppercase', color: accent ? 'var(--bronze)' : 'var(--ink-muted)',
    cursor: 'pointer',
  }}>{children}</button>
);

// ─────────────────────────────────────────────────────────────
// SIGN-IN — Layout A (Sanctuary)
// Centered medallion, wordmark, italic tagline, two hairline fields,
// bronze enter. The default direction — most legible, most reusable.
// ─────────────────────────────────────────────────────────────
const SignInSanctuary = ({ theme = 'obsidian', mark = 'aperture', tagline = 'A quiet place to keep your rituals.' }) => {
  const [email, setEmail] = useStateAuth('');
  const [password, setPassword] = useStateAuth('');
  return (
    <AuthStage theme={theme} label="Sign-in · Sanctuary">
      <div className="screen-scroll" style={{ padding: '0 28px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AuthHeader mark={mark} tagline={tagline} />
        <div style={{ marginTop: 4 }}>
          <HairlineField label="email" type="email" autoComplete="email" placeholder="your@address"
                         value={email} onChange={(e) => setEmail(e.target.value)} />
          <HairlineField label="password" type="password" autoComplete="current-password" placeholder="••••••••"
                         value={password} onChange={(e) => setPassword(e.target.value)} />
          <EnterButton>Enter the temple</EnterButton>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0 4px' }}>
          <QuietLink>Create an account</QuietLink>
          <QuietLink>Forgot</QuietLink>
        </div>
        <Reassurance>Synced quietly · encrypted at rest</Reassurance>
      </div>
    </AuthStage>
  );
};

// ─────────────────────────────────────────────────────────────
// SIGN-IN — Layout B (Threshold)
// Italic "sky quote" at the top, mark + wordmark anchored mid,
// fields anchored bottom. A more cinematic / "arriving" framing.
// ─────────────────────────────────────────────────────────────
const SignInThreshold = ({ theme = 'obsidian', mark = 'aperture' }) => {
  const [email, setEmail] = useStateAuth('');
  const [password, setPassword] = useStateAuth('');
  return (
    <AuthStage theme={theme} label="Sign-in · Threshold">
      <div style={{ padding: '0 28px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 6 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontFamily: 'var(--font-display)', fontStyle: 'italic',
              fontSize: 17, color: 'var(--ink-muted)', margin: 0,
              lineHeight: 1.5, maxWidth: '22ch',
            }}>
              The first hour is the temple. The rest is the day.
            </p>
            <div style={{
              width: 1, height: 36, background: 'var(--separator-strong)',
              margin: '22px auto 0',
            }} />
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '6px 0 14px' }}>
          <div className="medallion bronzed lg" style={{ margin: '0 auto 12px' }}>
            {mark === 'orbit' ? <LogoOrbit size={36} /> : mark === 'stele' ? <LogoStele size={36} /> : <LogoAperture size={36} />}
          </div>
          <h1 style={{
            margin: 0, fontFamily: 'var(--font-sans)', fontWeight: 500,
            fontSize: 28, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1,
          }}>
            Elys<span className="ital" style={{ fontSize: 28 }}>ium</span>
          </h1>
        </div>
        <div>
          <HairlineField label="email" type="email" placeholder="your@address"
                         value={email} onChange={(e) => setEmail(e.target.value)} />
          <HairlineField label="password" type="password" placeholder="••••••••"
                         value={password} onChange={(e) => setPassword(e.target.value)} />
          <EnterButton>Enter</EnterButton>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0 0' }}>
            <QuietLink accent>New · create</QuietLink>
            <QuietLink>Forgot</QuietLink>
          </div>
        </div>
        <Reassurance>Encrypted · private · yours</Reassurance>
      </div>
    </AuthStage>
  );
};

// ─────────────────────────────────────────────────────────────
// SIGN-UP — single screen, same vocabulary, one extra optional field.
// ─────────────────────────────────────────────────────────────
const SignUpScreen = ({ theme = 'obsidian', mark = 'aperture' }) => {
  const [name, setName] = useStateAuth('');
  const [email, setEmail] = useStateAuth('');
  const [password, setPassword] = useStateAuth('');
  return (
    <AuthStage theme={theme} label="Sign-up">
      <div className="screen-scroll" style={{ padding: '0 28px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AuthHeader mark={mark} tagline="A quiet practice begins here. A few minutes a day is enough." compact />
        <div style={{ marginTop: 0 }}>
          <HairlineField label="name · optional" type="text" placeholder="What to call you"
                         value={name} onChange={(e) => setName(e.target.value)} />
          <HairlineField label="email" type="email" placeholder="your@address"
                         value={email} onChange={(e) => setEmail(e.target.value)} />
          <HairlineField label="password" type="password" placeholder="At least eight quiet characters"
                         value={password} onChange={(e) => setPassword(e.target.value)} />
          <EnterButton>Begin</EnterButton>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ textAlign: 'center', padding: '14px 0 4px' }}>
          <QuietLink>Have an account · sign in</QuietLink>
        </div>
        <Reassurance>You can change anything later · nothing is shared</Reassurance>
      </div>
    </AuthStage>
  );
};

Object.assign(window, {
  AuthStage, HairlineField, EnterButton, AuthHeader, Reassurance, QuietLink,
  SignInSanctuary, SignInThreshold, SignUpScreen,
});
