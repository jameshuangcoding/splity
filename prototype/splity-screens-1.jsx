// splity-screens-1.jsx — Home, Receipt Review, People
const Body = ({ children, anim = true }) => (
  <div className={'sp-scroll' + (anim ? ' sp-anim' : '')}>{children}</div>
);

// brand mark — split circle (simple geometry)
function Mark({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="none" stroke="var(--accent)" strokeWidth="2.4" />
      <path d="M16 2.5 A13.5 13.5 0 0 1 16 29.5 Z" fill="var(--accent)" opacity="0.9" />
      <circle cx="10" cy="16" r="2.1" fill="var(--accent)" />
      <circle cx="22" cy="16" r="2.1" fill="var(--bg)" />
    </svg>
  );
}

// ---------- 1 · HOME ----------
function ScrHome({ ctx }) {
  return (
    <React.Fragment>
      <Body>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, paddingTop: 10 }}>
          <Mark size={26} />
          <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.02em' }}>Splity</span>
          <span className="chip" style={{ marginLeft: 'auto' }}>no account needed</span>
        </div>

        <div style={{ paddingTop: 40 }}>
          <div className="h-title" style={{ fontSize: 38 }}>Split a bill,<br />down to the cent.</div>
          <div className="h-sub" style={{ marginTop: 12 }}>
            Scan the receipt and Splity allocates the real tax, tip and discounts — never assumed percentages.
          </div>
        </div>

        {/* hero receipt teaser */}
        <div className="card" style={{ marginTop: 24, padding: 18, position: 'relative', overflow: 'hidden' }}>
          <div className="h-eyebrow">This bill</div>
          <input className="field" style={{ marginTop: 10, fontSize: 19, fontWeight: 700, padding: '12px 14px' }}
            value={ctx.name} onChange={e => ctx.setName(e.target.value)} aria-label="Expense name" />
          <div style={{ display: 'flex', gap: 9, marginTop: 12 }}>
            <Stat label="Items">{ITEMS.length}</Stat>
            <Stat label="People">{ctx.people.length}</Stat>
            <Stat label="Total">{money(RECEIPT.total)}</Stat>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, color: 'var(--text-faint)' }}>
          <Icon name="info" size={15} />
          <span style={{ fontSize: 12.5 }}>Under 2 minutes from scan to settled.</span>
        </div>
      </Body>

      <div className="sp-dock" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="cta" onClick={ctx.next}><Icon name="camera" size={20} /> Scan a receipt</button>
        <button className="cta ghost" onClick={ctx.next}><Icon name="edit" size={18} /> Enter manually</button>
      </div>
    </React.Fragment>
  );
}

// ---------- 2 · RECEIPT REVIEW ----------
function TotalLine({ label, value, rate, strong, accent }) {
  return (
    <div className="row" style={{ padding: '13px 16px' }}>
      <span style={{ flex: 1, fontWeight: strong ? 800 : 600, fontSize: strong ? 17 : 15 }}>{label}</span>
      {rate && <span className="chip accent" style={{ marginRight: 10 }}>{rate}</span>}
      <span className={'num' + (accent ? ' t-accent' : '')} style={{ fontWeight: strong ? 700 : 600, fontSize: strong ? 20 : 15.5 }}>{value}</span>
    </div>
  );
}

function ScrReceipt({ ctx }) {
  const taxPct = (RECEIPT.tax / RECEIPT.subtotal * 100).toFixed(1) + '%';
  const tipPct = (RECEIPT.tip / RECEIPT.subtotal * 100).toFixed(1) + '%';
  return (
    <React.Fragment>
      <Body>
        <ScreenHead eyebrow="Step 2 · Review" title="Check the receipt"
          sub="OCR filled this in. Tap any value to fix a misread before we do the math." />

        <div className="card" style={{ padding: 13, display: 'flex', alignItems: 'center', gap: 13, marginBottom: 16 }}>
          <div className="imgslot" style={{ width: 54, height: 64, flex: '0 0 54px' }}>scan</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{RECEIPT.place}</div>
            <div className="t-dim" style={{ fontSize: 13, marginTop: 2 }}>5 items detected</div>
          </div>
          <button className="btn-line"><Icon name="camera" size={16} /> Retake</button>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          {ITEMS.map(it => (
            <div className="row" key={it.id}>
              <span style={{ flex: 1, fontWeight: 600, fontSize: 15 }}>{it.name}</span>
              <span className="t-faint" style={{ marginRight: 12 }}><Icon name="edit" size={15} /></span>
              <span className="num" style={{ fontSize: 15.5, minWidth: 56, textAlign: 'right' }}>{money(it.price)}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <TotalLine label="Subtotal" value={money(RECEIPT.subtotal)} />
          <TotalLine label="Tax" value={money(RECEIPT.tax)} rate={taxPct} />
          <TotalLine label="Tip" value={money(RECEIPT.tip)} rate={tipPct} />
          <TotalLine label="Discount" value={'−' + money(RECEIPT.discount)} accent />
          <hr className="divide" />
          <TotalLine label="Total" value={money(RECEIPT.total)} strong />
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 14, color: 'var(--text-dim)' }}>
          <Icon name="info" size={15} style={{ marginTop: 1, flex: '0 0 auto' }} />
          <span style={{ fontSize: 12.5, lineHeight: 1.45 }}>
            Rates are derived from the printed amounts — tax <b className="t-accent">{taxPct}</b>, tip <b className="t-accent">{tipPct}</b> — then applied to each person's items.
          </span>
        </div>
      </Body>

      <div className="sp-dock">
        <button className="cta" onClick={ctx.next}>Looks right <Icon name="arrow" size={19} /></button>
      </div>
    </React.Fragment>
  );
}

// ---------- 3 · PEOPLE ----------
function ScrPeople({ ctx }) {
  return (
    <React.Fragment>
      <Body>
        <ScreenHead eyebrow="Step 3 · People" title="Who's splitting?"
          sub="Add everyone at the table. You're the payer — you'll collect the reimbursements." />

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input className="field" placeholder="Add a name…" readOnly />
          <button className="iconbtn" style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--accent)', color: '#fff', border: 'none', boxShadow: 'var(--accent-glow)' }}>
            <Icon name="plus" size={22} />
          </button>
        </div>

        <div className="card">
          {ctx.people.map(p => (
            <div className="row" key={p.id}>
              <Ava p={p} />
              <span style={{ flex: 1, fontWeight: 700, fontSize: 16 }}>{p.name}</span>
              {p.payer
                ? <span className="chip accent">payer</span>
                : <span className="t-faint"><Icon name="x" size={17} /></span>}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="h-eyebrow" style={{ marginBottom: 9 }}>Recent</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Diego', 'Sam', 'Aisha', 'Theo'].map(n => (
              <span key={n} className="chip"><Icon name="plus" size={13} /> {n}</span>
            ))}
          </div>
        </div>
      </Body>

      <div className="sp-dock">
        <button className="cta" onClick={ctx.next}>Next · assign items <Icon name="arrow" size={19} /></button>
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { ScrHome, ScrReceipt, ScrPeople, Body, Mark });
