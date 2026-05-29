// wf-kit.jsx — shared sketchy wireframe components for Splity wireframes.
// Exported to window so screens-a/b/c can use them.
const { Fragment } = React;

// Phone frame with status bar. `tall` lets a screen grow if needed.
function Phone({ children, h }) {
  return (
    <div className="phone" style={h ? { height: h } : null}>
      <div className="notch"></div>
      <div className="statusbar">
        <span>9:41</span>
        <span className="dim" style={{ fontWeight: 700, letterSpacing: '.5px' }}>splity</span>
        <span className="dots">▮▮▮ ▰</span>
      </div>
      <div className="screen">{children}</div>
    </div>
  );
}

function AppBar({ title, back = true, right }) {
  return (
    <div className="appbar">
      {back && <span className="back">‹</span>}
      <h2 style={{ fontSize: 17 }}>{title}</h2>
      <span className="spacer"></span>
      {right}
    </div>
  );
}

// step dots, 6 steps, `now` = 0-indexed current
function Steps({ now }) {
  return (
    <div className="dots-prog" style={{ justifyContent: 'center', padding: '4px 0 8px' }}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <span key={i} className={'d' + (i < now ? ' on' : i === now ? ' now' : '')}></span>
      ))}
    </div>
  );
}

function Btn({ children, primary, block, sm, style }) {
  return (
    <div className={'btn' + (primary ? ' primary' : '') + (block ? ' block' : '') + (sm ? ' sm' : '')} style={style}>
      {children}
    </div>
  );
}

function Chip({ children, on }) {
  return <span className={'chip' + (on ? ' on' : '')}>{children}</span>;
}

function Ava({ name, on, sm }) {
  return <div className={'ava' + (on ? ' on' : '') + (sm ? ' sm' : '')}>{name}</div>;
}

function Money({ children, big, accent, style }) {
  return (
    <span className={'num' + (big ? ' big' : '') + (accent ? ' accent-tx' : '')} style={style}>{children}</span>
  );
}

function Field({ label, value, placeholder, under }) {
  return (
    <div>
      {label && <div className="micro" style={{ marginBottom: 3 }}>{label}</div>}
      <div className={'field' + (under ? ' under' : '')}>
        <span style={{ color: value ? 'var(--ink)' : 'var(--ink-3)' }}>{value || placeholder}</span>
      </div>
    </div>
  );
}

function ImgSlot({ label, h = 120, style }) {
  return <div className="sketch-img" style={{ height: h, ...style }}>{label}</div>;
}

// in-frame handwritten annotation
function Note({ children, style }) {
  return <div className="note" style={style}>{children}</div>;
}

// a receipt line: name + price, optionally with assignment avatars
function Item({ name, price, avas, dim, strike }) {
  return (
    <div className="rowline">
      <span style={{ flex: 1, textDecoration: strike ? 'line-through' : 'none', color: dim ? 'var(--ink-3)' : 'var(--ink)' }}>{name}</span>
      {avas}
      <Money style={{ minWidth: 48, textAlign: 'right' }}>{price}</Money>
    </div>
  );
}

Object.assign(window, { Phone, AppBar, Steps, Btn, Chip, Ava, Money, Field, ImgSlot, Note, Item, Fragment });
