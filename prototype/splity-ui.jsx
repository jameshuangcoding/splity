// splity-ui.jsx — shared presentational components
const { useState, useEffect, useRef } = React;

// Avatar with person color
function Ava({ p, size = '', off, ghost, children }) {
  if (ghost) return <div className={'ava ghost ' + size}>{children}</div>;
  return (
    <div className={'ava ' + size + (off ? ' off' : '')}
      style={{ background: `linear-gradient(155deg, ${p.color}, ${shade(p.color, -18)})` }}>
      {p.initial}
    </div>
  );
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Count-up money readout
function Money({ value, prefix = '$', className = '', style, dur = 520 }) {
  const [disp, setDisp] = useState(value);
  const from = useRef(value);
  const raf = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const a = from.current, b = value;
    cancelAnimationFrame(raf.current);
    const tick = (t) => {
      const k = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setDisp(a + (b - a) * e);
      if (k < 1) raf.current = requestAnimationFrame(tick);
      else from.current = b;
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  const neg = disp < -0.005;
  return (
    <span className={'num ' + className} style={style}>
      {neg ? '-' : ''}{prefix}{Math.abs(disp).toFixed(2)}
    </span>
  );
}

// Top bar: back, progress segments, theme toggle
function TopBar({ step, total, onBack, dark, onToggleTheme, showBack = true }) {
  return (
    <div className="topbar">
      <button className="iconbtn" onClick={onBack} style={{ visibility: showBack ? 'visible' : 'hidden' }} aria-label="Back">
        <Icon name="back" size={20} />
      </button>
      <div className="prog">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={'seg' + (i < step ? ' done' : i === step ? ' now' : '')}><i /></span>
        ))}
      </div>
      <button className="iconbtn" onClick={onToggleTheme} aria-label="Toggle theme">
        <Icon name={dark ? 'sun' : 'moon'} size={19} />
      </button>
    </div>
  );
}

// labelled header block used at top of each screen body
function ScreenHead({ eyebrow, title, sub }) {
  return (
    <div style={{ paddingTop: 6, paddingBottom: 18 }}>
      {eyebrow && <div className="h-eyebrow" style={{ marginBottom: 9 }}>{eyebrow}</div>}
      <div className="h-title">{title}</div>
      {sub && <div className="h-sub" style={{ marginTop: 7 }}>{sub}</div>}
    </div>
  );
}

// small stat pill (derived rate etc.)
function Stat({ label, children }) {
  return (
    <div style={{ flex: 1, padding: '11px 13px', background: 'var(--surface-2)', borderRadius: 13, border: '1px solid var(--hairline)' }}>
      <div className="t-faint" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</div>
      <div className="num" style={{ fontSize: 17, fontWeight: 600, marginTop: 3 }}>{children}</div>
    </div>
  );
}

Object.assign(window, { Ava, Money, TopBar, ScreenHead, Stat, shade });
