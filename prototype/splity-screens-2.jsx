// splity-screens-2.jsx — Assign, Summary, Send (the interactive core)
const { useState: useS2 } = React;

// ---------- 4 · ASSIGN ----------
function AssignSheet({ item, people, assigned, onApply, onClose }) {
  const [sel, setSel] = useS2(assigned);
  const toggle = (id) => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const all = () => setSel(people.map(p => p.id));
  const splitNote = sel.length > 1 ? `split ${sel.length} ways · ${money(item.price / sel.length)} each` : sel.length === 1 ? 'whole item' : 'unassigned';
  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-grab" />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 19, fontWeight: 800, flex: 1 }}>{item.name}</span>
          <span className="num" style={{ fontWeight: 600 }}>{money(item.price)}</span>
        </div>
        <div className="t-dim" style={{ fontSize: 13, marginBottom: 16 }}>{splitNote}</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {people.map(p => {
            const on = sel.includes(p.id);
            return (
              <button key={p.id} onClick={() => toggle(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', cursor: 'pointer',
                  background: on ? 'var(--accent-tint)' : 'var(--surface-2)',
                  border: '1.5px solid ' + (on ? 'var(--accent)' : 'var(--hairline)'),
                  borderRadius: 14, color: 'var(--text)', font: 'inherit',
                }}>
                <Ava p={p} size="sm" off={!on} />
                <span style={{ fontWeight: 700, fontSize: 14.5, flex: 1, textAlign: 'left' }}>{p.name}</span>
                {on && <span style={{ color: 'var(--accent-ink)' }}><Icon name="check" size={17} /></span>}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="cta ghost" onClick={all} style={{ flex: 1 }}><Icon name="users" size={18} /> Everyone</button>
          <button className="cta" onClick={() => onApply(sel)} style={{ flex: 1 }}>Done</button>
        </div>
      </div>
    </div>
  );
}

function ScrAssign({ ctx }) {
  const [sheet, setSheet] = useS2(null);
  const { people, assignments, calc } = ctx;

  const autoSplitRest = () => {
    const next = { ...assignments };
    ITEMS.forEach(it => { if (!(next[it.id] || []).length) next[it.id] = people.map(p => p.id); });
    ctx.setAssignments(next);
  };

  return (
    <React.Fragment>
      <Body anim={false}>
        <div style={{ paddingTop: 6, paddingBottom: 14, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div className="h-eyebrow" style={{ marginBottom: 8 }}>Step 4 · Assign</div>
            <div className="h-title">Who had what?</div>
          </div>
          <span className="chip accent num" style={{ fontSize: 13 }}>{calc.assignedCount}/{calc.itemCount}</span>
        </div>

        {/* live per-person rail */}
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '2px 2px 16px' }}>
          {people.map(p => (
            <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 52 }}>
              <Ava p={p} off={!calc.breakdown[p.id].sub} />
              <Money value={calc.breakdown[p.id].total} className="t-dim" style={{ fontSize: 12.5, fontWeight: 600 }} />
            </div>
          ))}
        </div>

        <div className="card">
          {ITEMS.map(it => {
            const who = assignments[it.id] || [];
            return (
              <button key={it.id} className="row" onClick={() => setSheet(it)}
                style={{ width: '100%', background: 'none', border: 'none', borderBottom: '1px solid var(--hairline)', font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{it.name}</div>
                  <div className="num t-faint" style={{ fontSize: 12.5, marginTop: 2 }}>{money(it.price)}{who.length > 1 ? ` · ${money(it.price / who.length)} ea` : ''}</div>
                </div>
                {who.length
                  ? <div className="ava-stack">{who.map(id => <Ava key={id} p={people.find(p => p.id === id)} size="sm" />)}</div>
                  : <span className="chip accent">tap to assign</span>}
              </button>
            );
          })}
        </div>

        {!calc.fullyAssigned && (
          <button className="btn-line" onClick={autoSplitRest} style={{ marginTop: 14 }}>
            <Icon name="users" size={16} /> Split the remaining {calc.itemCount - calc.assignedCount} evenly
          </button>
        )}
      </Body>

      <div className="sp-dock">
        <button className="cta" onClick={ctx.next}>See the breakdown <Icon name="arrow" size={19} /></button>
      </div>

      {sheet && (
        <AssignSheet item={sheet} people={people} assigned={assignments[sheet.id] || []}
          onClose={() => setSheet(null)}
          onApply={(arr) => { ctx.setAssignments({ ...assignments, [sheet.id]: arr }); setSheet(null); }} />
      )}
    </React.Fragment>
  );
}

// ---------- 5 · SUMMARY ----------
function PersonSummary({ p, b, calc, items, assignments, open, onToggle }) {
  const its = items.filter(it => (assignments[it.id] || []).includes(p.id));
  return (
    <div className="card" style={{ marginBottom: 12, overflow: 'hidden' }}>
      <button className="row" onClick={onToggle}
        style={{ width: '100%', background: 'none', border: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer', padding: '15px 16px' }}>
        <Ava p={p} size="lg" />
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{p.name}{p.payer && <span className="chip accent" style={{ marginLeft: 8, verticalAlign: 'middle' }}>payer</span>}</div>
          <div className="t-faint" style={{ fontSize: 12.5, marginTop: 2 }}>{its.length} item{its.length !== 1 ? 's' : ''}</div>
        </div>
        <Money value={b.total} style={{ fontSize: 22, fontWeight: 700 }} />
        <span className="t-faint" style={{ marginLeft: 8, transform: open ? 'rotate(180deg)' : 'none' }}><Icon name="chevdown" size={18} /></span>
      </button>
      {open && (
        <div style={{ padding: '4px 16px 16px' }}>
          <hr className="dash" style={{ marginBottom: 10 }} />
          {its.map(it => {
            const n = (assignments[it.id] || []).length;
            return (
              <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13.5, padding: '4px 0', color: 'var(--text-dim)' }}>
                <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}{n > 1 ? ` · ÷${n}` : ''}</span>
                <span className="num" style={{ flexShrink: 0 }}>{money(it.price / n)}</span>
              </div>
            );
          })}
          <hr className="dash" style={{ margin: '8px 0' }} />
          {[['Item subtotal', b.sub], [`+ tax · ${(calc.taxRate * 100).toFixed(1)}%`, b.tax], [`+ tip · ${(calc.tipRate * 100).toFixed(1)}%`, b.tip], ['− discount', -b.disc]].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13.5, padding: '3px 0' }}>
              <span className="t-dim" style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l}</span>
              <span className="num" style={{ flexShrink: 0 }}>{v < 0 ? '−' : ''}{money(Math.abs(v))}</span>
            </div>
          ))}
          {b.remainder && (
            <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginTop: 9, fontSize: 11.5, color: 'var(--text-faint)' }}>
              <Icon name="info" size={13} /> Absorbs rounding remainder so the split sums exactly.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScrSummary({ ctx }) {
  const [open, setOpen] = useS2(ctx.people[0].id);
  const { people, calc } = ctx;
  return (
    <React.Fragment>
      <Body anim={false}>
        <ScreenHead eyebrow="Step 5 · Summary" title="Here's the split" sub="Every number shown — tap a person to see their math." />

        <div className="card" style={{ padding: 20, marginBottom: 18, background: 'linear-gradient(160deg, var(--accent-tint), var(--surface) 70%)' }}>
          <div className="h-eyebrow">{ctx.name}</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 6 }}>
            <Money value={RECEIPT.total} style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.03em' }} />
            <span className="chip" style={{ marginBottom: 8, background: 'var(--pos-tint)', color: 'var(--pos)', border: 'none' }}><Icon name="check" size={14} /> matches receipt</span>
          </div>
          <div className="t-dim" style={{ fontSize: 13, marginTop: 4 }}>{RECEIPT.place} · split {people.length} ways</div>
        </div>

        {people.map(p => (
          <PersonSummary key={p.id} p={p} b={calc.breakdown[p.id]} calc={calc}
            items={ITEMS} assignments={ctx.assignments}
            open={open === p.id} onToggle={() => setOpen(open === p.id ? null : p.id)} />
        ))}
      </Body>

      <div className="sp-dock">
        <button className="cta" onClick={ctx.next}><Icon name="send" size={18} /> Send payment requests</button>
      </div>
    </React.Fragment>
  );
}

// ---------- 6 · SEND ----------
function ScrSend({ ctx }) {
  const { people, calc } = ctx;
  const [toast, setToast] = useS2(null);
  const [sent, setSent] = useS2({});
  const others = people.filter(p => !p.payer);

  const flash = (msg) => { setToast(msg); clearTimeout(window.__spt); window.__spt = setTimeout(() => setToast(null), 1900); };
  const pay = (p, method) => { setSent(s => ({ ...s, [p.id]: method })); flash(`${method} request to ${p.name} · ${money(calc.breakdown[p.id].total)}`); };
  const copyOne = (p) => {
    const txt = `${ctx.name} — ${money(calc.breakdown[p.id].total)}`;
    if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {});
    flash(`Copied: ${txt}`);
  };
  const exportCSV = () => {
    const csv = toCSV(RECEIPT, ITEMS, people, ctx.assignments, calc);
    try {
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = ctx.name.replace(/\s+/g, '-').toLowerCase() + '.csv';
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e) {}
    flash('CSV exported');
  };

  return (
    <React.Fragment>
      <Body>
        <ScreenHead eyebrow="Step 6 · Send" title="Collect what you're owed" />
        <div className="chip accent" style={{ marginBottom: 16 }}><Icon name="receipt" size={14} /> memo · "{ctx.name}"</div>

        {others.map(p => {
          const b = calc.breakdown[p.id]; const done = sent[p.id];
          return (
            <div className="card" key={p.id} style={{ padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 13 }}>
                <Ava p={p} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{p.name}</div>
                  {done && <div className="t-pos" style={{ fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}><Icon name="check" size={13} /> {done} sent</div>}
                </div>
                <Money value={b.total} style={{ fontSize: 21, fontWeight: 700 }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-line" style={{ flex: 1, justifyContent: 'center' }} onClick={() => pay(p, 'Venmo')}>Venmo</button>
                <button className="btn-line" style={{ flex: 1, justifyContent: 'center' }} onClick={() => pay(p, 'Zelle')}>Zelle</button>
                <button className="btn-line" style={{ flex: '0 0 auto', justifyContent: 'center' }} onClick={() => copyOne(p)}><Icon name="copy" size={16} /></button>
              </div>
            </div>
          );
        })}

        <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginTop: 4, color: 'var(--text-faint)', fontSize: 12 }}>
          <Icon name="info" size={14} /> Links pre-fill the amount &amp; memo. Handles stored on the bill — no accounts in Phase 1.
        </div>
      </Body>

      <div className="sp-dock" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="cta ghost" onClick={exportCSV}><Icon name="download" size={18} /> Export to CSV</button>
        <button className="cta" onClick={ctx.restart}><Icon name="check" size={18} /> Done · new bill</button>
      </div>

      {toast && (
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 150, zIndex: 40, background: 'var(--surface-hi)', border: '1px solid var(--hairline-2)', borderRadius: 14, padding: '12px 16px', boxShadow: 'var(--shadow)', fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 9, animation: 'sp-in .25s var(--ease) both' }}>
          <span className="t-pos"><Icon name="check" size={17} /></span>{toast}
        </div>
      )}
    </React.Fragment>
  );
}

Object.assign(window, { ScrAssign, ScrSummary, ScrSend, AssignSheet });
