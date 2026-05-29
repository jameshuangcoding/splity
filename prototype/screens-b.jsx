// screens-b.jsx — Approach B · Live Ledger (one dense surface, totals always visible)

// persistent live tally bar — the signature of this approach
function Tally({ people, label = 'LIVE TALLY' }) {
  return (
    <div className="sk box" style={{ margin: '0 2px', padding: '6px 8px 7px', background: 'var(--paper-2)' }}>
      <div className="micro" style={{ marginBottom: 5, letterSpacing: '1px' }}>{label} · updates as you tap</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
        {people.map(([i, amt, on]) => (
          <div key={i} style={{ textAlign: 'center', flex: 1 }}>
            <Ava name={i} on={on} sm />
            <div className="num accent-tx" style={{ fontSize: 13, marginTop: 2 }}>{amt}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// persistent top avatar rail
function Rail({ active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 4px 8px', overflow: 'hidden' }}>
      <span className="micro" style={{ marginRight: 2 }}>SPLIT&nbsp;WITH</span>
      {['Y', 'M', 'K', 'P'].map(n => <Ava key={n} name={n} sm on={active} />)}
      <div className="ava sm" style={{ borderStyle: 'dashed' }}>+</div>
    </div>
  );
}

function B_Home() {
  return (
    <Phone>
      <div className="screen" style={{ justifyContent: 'center', gap: 16, padding: '6px 8px' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 38 }}>splity</h1>
          <Note style={{ marginTop: 4 }}>one screen. live math. no steps.</Note>
        </div>
        <Field label="EXPENSE" value="East Asia dinner" />
        {/* tease the live surface */}
        <div style={{ opacity: .55 }}>
          <Tally people={[['Y', '$0.00'], ['M', '$0.00'], ['K', '$0.00'], ['P', '$0.00']]} label="YOUR LEDGER" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <Btn primary block>⊡  Scan receipt</Btn>
          <Btn block>Enter items manually</Btn>
        </div>
      </div>
    </Phone>
  );
}

function B_Receipt() {
  return (
    <Phone>
      <AppBar title="East Asia dinner" back={false} right={<span className="chip">edit</span>} />
      <Rail active={false} />
      <div className="micro" style={{ padding: '0 6px 4px', letterSpacing: '1px' }}>RECEIPT · tap a value to fix</div>
      <div className="sk box" style={{ padding: '2px 10px', margin: '0 2px' }}>
        <Item name="Tonkotsu ramen" price="14.50" />
        <Item name="Gyoza (6)" price="7.00" />
        <Item name="Karaage" price="9.25" />
        <Item name="Sapporo x2" price="12.00" />
        <Item name="Matcha cake" price="6.50" />
        <div className="rowline micro" style={{ borderTop: '1.6px solid var(--line)' }}><span style={{ flex: 1 }}>sub 49.25 · tax 4.31 · tip 9.75 · −5.00</span></div>
        <div className="rowline" style={{ borderBottom: 'none' }}><span style={{ flex: 1, fontWeight: 700 }}>TOTAL</span><Money accent style={{ fontSize: 17 }}>$58.31</Money></div>
      </div>
      <Note style={{ padding: '6px 6px 0' }}>tax 8.7% &amp; tip 19.8% derived from the receipt, not assumed.</Note>
      <div style={{ flex: 1 }}></div>
      <Tally people={[['Y', '$0.00'], ['M', '$0.00'], ['K', '$0.00'], ['P', '$0.00']]} />
    </Phone>
  );
}

function B_People() {
  return (
    <Phone>
      <AppBar title="East Asia dinner" back={false} />
      <div className="micro" style={{ padding: '0 6px 4px', letterSpacing: '1px' }}>WHO'S SPLITTING?</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, padding: '2px 4px 8px' }}>
        {['You', 'Mara', 'Kenji', 'Priya'].map(n => (
          <span key={n} className="chip on"><Ava name={n[0]} sm /> {n} ✕</span>
        ))}
        <span className="chip" style={{ borderStyle: 'dashed' }}>+ add</span>
      </div>
      <Field value="" placeholder="type a name + ↵" />
      <Note style={{ padding: '8px 6px 0' }}>the rail stays pinned to the top — add people any time without leaving the page.</Note>
      <div className="sk box" style={{ padding: '2px 10px', margin: '10px 2px 0', opacity: .5 }}>
        <Item name="Tonkotsu ramen" price="14.50" />
        <Item name="Gyoza (6)" price="7.00" />
        <Item name="…receipt below" price="" dim />
      </div>
      <div style={{ flex: 1 }}></div>
      <Tally people={[['Y', '$0.00'], ['M', '$0.00'], ['K', '$0.00'], ['P', '$0.00']]} />
    </Phone>
  );
}

function B_Assign() {
  return (
    <Phone>
      <AppBar title="East Asia dinner" back={false} right={<span className="chip">9/14</span>} />
      <Rail active={true} />
      <div className="micro" style={{ padding: '0 6px 3px', letterSpacing: '1px' }}>TAP AVATARS ON EACH LINE →</div>
      <div className="sk box" style={{ padding: '2px 8px', margin: '0 2px' }}>
        {[
          ['Tonkotsu ramen', '14.50', [0, 0, 1, 0]],
          ['Gyoza (6)', '7.00', [1, 1, 0, 0]],
          ['Karaage', '9.25', [0, 1, 0, 0]],
          ['Sapporo x2', '12.00', [0, 0, 0, 0]],
          ['Matcha cake', '6.50', [0, 0, 0, 1]],
        ].map(([n, p, sel]) => (
          <div key={n} style={{ padding: '5px 0', borderBottom: '1.6px dashed var(--ink-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ flex: 1, fontSize: 14 }}>{n}</span><Money style={{ fontSize: 13 }}>{p}</Money>
            </div>
            <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
              {['Y', 'M', 'K', 'P'].map((a, idx) => <Ava key={a} name={a} sm on={sel[idx] === 1} />)}
              <span className="micro" style={{ alignSelf: 'center', marginLeft: 'auto', color: sel.every(x => !x) ? 'var(--accent-ink)' : 'var(--ink-3)' }}>{sel.every(x => !x) ? 'unassigned' : 'split'}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1 }}></div>
      <Tally people={[['Y', '$8.27', true], ['M', '$11.4', true], ['K', '$17.2', true], ['P', '$7.71', true]]} />
    </Phone>
  );
}

function B_Summary() {
  return (
    <Phone>
      <AppBar title="East Asia dinner" back={false} right={<span className="chip">⤓ csv</span>} />
      <Rail active={true} />
      <div className="sk box" style={{ padding: '4px 10px', margin: '0 2px' }}>
        {[
          ['Y', 'You · payer', '$16.81', 'sub 13.5 +tax +tip'],
          ['M', 'Mara', '$13.92', 'sub 11.0 +tax +tip −d'],
          ['K', 'Kenji', '$19.04', 'sub 14.0 +tax +tip −d'],
          ['P', 'Priya', '$8.54', 'sub 6.5 +tax +tip −d'],
        ].map(([i, n, t, brk]) => (
          <div key={n} style={{ padding: '6px 0', borderBottom: '1.6px dashed var(--ink-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Ava name={i} sm on /><span style={{ flex: 1, fontWeight: 700, fontSize: 15 }}>{n}</span>
              <Money accent style={{ fontSize: 16 }}>{t}</Money>
            </div>
            <div className="micro" style={{ marginLeft: 29 }}>{brk}</div>
          </div>
        ))}
        <div style={{ display: 'flex', padding: '6px 0 2px' }}>
          <span style={{ flex: 1, fontWeight: 700 }}>Σ checks out</span><Money accent>$58.31</Money>
        </div>
      </div>
      <Note style={{ padding: '6px 6px 0' }}>remainder cents → the payer, so the sum is exact.</Note>
      <div style={{ flex: 1 }}></div>
      <Btn primary block>Send all requests →</Btn>
    </Phone>
  );
}

function B_Send() {
  return (
    <Phone>
      <AppBar title="East Asia dinner" back={false} />
      <div className="chip on" style={{ margin: '0 4px 6px' }}>memo auto: “East Asia dinner”</div>
      <div className="sk box" style={{ padding: '2px 10px', margin: '0 2px' }}>
        {[
          ['K', 'Kenji', '$19.04', 'venmo'],
          ['M', 'Mara', '$13.92', 'zelle'],
          ['P', 'Priya', '$8.54', 'venmo'],
        ].map(([i, n, t, m]) => (
          <div key={n} className="rowline" style={{ padding: '8px 0' }}>
            <Ava name={i} sm on /><span style={{ flex: 1, fontWeight: 700 }}>{n}</span>
            <Money style={{ fontSize: 15, marginRight: 6 }}>{t}</Money>
            <Btn sm primary>{m}</Btn>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 7, padding: '10px 2px 0' }}>
        <Btn block>⤓ CSV</Btn>
        <Btn block>Copy all</Btn>
      </div>
      <Note style={{ padding: '10px 6px 0' }}>handles stored on the bill — no accounts needed in Phase 1.</Note>
      <div style={{ flex: 1 }}></div>
      <Tally people={[['Y', 'paid', false], ['M', 'sent', true], ['K', 'sent', true], ['P', 'sent', true]]} label="STATUS" />
    </Phone>
  );
}

Object.assign(window, { B_Home, B_Receipt, B_People, B_Assign, B_Summary, B_Send });
