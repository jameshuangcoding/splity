// screens-a.jsx — Approach A · Linear Stepper (guided wizard, one decision per screen)

function A_Home() {
  return (
    <Phone>
      <div className="screen" style={{ justifyContent: 'space-between', padding: '6px 6px 4px' }}>
        <div>
          <Steps now={0} />
          <div style={{ textAlign: 'center', marginTop: 26 }}>
            <h1 style={{ fontSize: 40 }}>splity</h1>
            <div className="lbl" style={{ marginTop: 4 }}>split a bill, fairly.</div>
          </div>
          <ImgSlot label="〰 hero / receipt doodle 〰" h={120} style={{ margin: '22px 4px' }} />
          <Field label="NAME THIS EXPENSE" value="East Asia dinner" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Btn primary block>⊡  Scan a receipt</Btn>
          <Btn block>Enter manually</Btn>
          <Note style={{ textAlign: 'center', marginTop: 2 }}>no login needed →</Note>
        </div>
      </div>
    </Phone>
  );
}

function A_Receipt() {
  return (
    <Phone>
      <Steps now={1} />
      <AppBar title="Review receipt" right={<span className="chip">retake</span>} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '0 4px 6px' }}>
        <ImgSlot label="receipt photo" h={52} style={{ width: 52, flex: '0 0 52px' }} />
        <Note>OCR filled this in — tap any value to fix a misread.</Note>
      </div>
      <div className="sk box" style={{ padding: '4px 10px', margin: '0 2px' }}>
        <Item name="Tonkotsu ramen ✎" price="14.50" />
        <Item name="Gyoza (6) ✎" price="7.00" />
        <Item name="Karaage ✎" price="9.25" />
        <Item name="Sapporo x2 ✎" price="12.00" />
        <Item name="Matcha cake ✎" price="6.50" />
      </div>
      <div className="sk box" style={{ padding: '6px 10px', margin: '8px 2px 0' }}>
        <Item name="Subtotal ✎" price="49.25" />
        <Item name="Tax ✎" price="4.31" />
        <Item name="Tip ✎" price="9.75" />
        <Item name="Discount ✎" price="−5.00" />
        <div className="rowline" style={{ borderTop: '2px solid var(--line)', borderBottom: 'none', marginTop: 2 }}>
          <span style={{ flex: 1, fontWeight: 700 }}>TOTAL</span>
          <Money accent style={{ fontSize: 18 }}>$58.31</Money>
        </div>
      </div>
      <div style={{ flex: 1 }}></div>
      <Btn primary block>Looks right →</Btn>
    </Phone>
  );
}

function A_People() {
  return (
    <Phone>
      <Steps now={2} />
      <AppBar title="Who's in?" />
      <div style={{ padding: '4px 4px' }}>
        <Field label="ADD A PERSON" value="" placeholder="type a name + ↵" />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '8px 4px' }}>
        {['You', 'Mara', 'Kenji', 'Priya'].map(n => (
          <span key={n} className="chip on"><Ava name={n[0]} sm /> {n} ✕</span>
        ))}
      </div>
      <Note style={{ padding: '6px 6px' }}>“You” is the payer — collects the reimbursements.</Note>
      <ImgSlot label="〰 add from contacts (later) 〰" h={60} style={{ margin: '8px 4px' }} />
      <div style={{ flex: 1 }}></div>
      <Btn primary block>Next: assign items →</Btn>
    </Phone>
  );
}

function A_Assign() {
  return (
    <Phone>
      <Steps now={3} />
      <AppBar title="Assign items" right={<span className="chip">9 / 14</span>} />
      <Note style={{ padding: '0 6px 6px' }}>Tap an item, then tap who had it.</Note>
      <div className="sk box" style={{ padding: '4px 10px', margin: '0 2px' }}>
        <Item name="Tonkotsu ramen" price="14.50" avas={<Ava name="K" sm on />} />
        <Item name="Gyoza (6)" price="7.00" avas={<div style={{ display: 'flex', gap: 2 }}><Ava name="Y" sm on /><Ava name="M" sm on /></div>} />
        {/* active item with picker */}
        <div className="rowline accent-soft" style={{ flexWrap: 'wrap', borderRadius: 8, padding: '7px 6px' }}>
          <span style={{ flex: 1, fontWeight: 700 }}>Karaage</span>
          <Money>9.25</Money>
          <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 8, justifyContent: 'center' }}>
            <Ava name="Y" /><Ava name="M" on /><Ava name="K" /><Ava name="P" />
            <span className="chip">all</span>
          </div>
        </div>
        <Item name="Sapporo x2" price="12.00" avas={<span className="micro accent-tx">tap to assign</span>} dim />
        <Item name="Matcha cake" price="6.50" avas={<Ava name="P" sm on />} />
      </div>
      <div style={{ flex: 1 }}></div>
      <Btn primary block>See the breakdown →</Btn>
    </Phone>
  );
}

function A_Summary() {
  return (
    <Phone>
      <Steps now={4} />
      <AppBar title="Who owes what" />
      {/* expanded person */}
      <div className="sk box accent-soft" style={{ padding: '8px 10px', margin: '0 2px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ava name="K" on />
          <span style={{ flex: 1, fontWeight: 700 }}>Kenji</span>
          <Money accent style={{ fontSize: 20 }}>$19.04</Money>
        </div>
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1.6px dashed var(--ink-3)' }}>
          <div className="rowline micro" style={{ padding: '3px 0' }}><span style={{ flex: 1 }}>ramen + ½ gyoza</span><Money>14.00</Money></div>
          <div className="rowline micro" style={{ padding: '3px 0' }}><span style={{ flex: 1 }}>+ tax (8.7%)</span><Money>1.22</Money></div>
          <div className="rowline micro" style={{ padding: '3px 0' }}><span style={{ flex: 1 }}>+ tip (19.8%)</span><Money>2.77</Money></div>
          <div className="rowline micro" style={{ padding: '3px 0', borderBottom: 'none' }}><span style={{ flex: 1 }}>− discount</span><Money>−0.95</Money></div>
        </div>
      </div>
      {[['Y', 'You · payer', '$16.81'], ['M', 'Mara', '$13.92'], ['P', 'Priya', '$8.54']].map(([i, n, t]) => (
        <div key={n} className="rowline" style={{ padding: '8px 6px' }}>
          <Ava name={i} /><span style={{ flex: 1, fontWeight: 700 }}>{n}</span>
          <Money style={{ fontSize: 17 }}>{t}</Money><span className="dim">⌄</span>
        </div>
      ))}
      <Note style={{ textAlign: 'center', padding: '6px 0' }}>sums to $58.31 — exactly the receipt ✓</Note>
      <Btn primary block>Send payment requests →</Btn>
    </Phone>
  );
}

function A_Send() {
  return (
    <Phone>
      <Steps now={5} />
      <AppBar title="Send requests" />
      <div className="chip on" style={{ margin: '0 4px 8px' }}>memo: “East Asia dinner”</div>
      {[['K', 'Kenji', '$19.04'], ['M', 'Mara', '$13.92'], ['P', 'Priya', '$8.54']].map(([i, n, t]) => (
        <div key={n} className="sk box" style={{ padding: '8px 10px', margin: '0 2px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
            <Ava name={i} /><span style={{ flex: 1, fontWeight: 700 }}>{n}</span>
            <Money accent style={{ fontSize: 17 }}>{t}</Money>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn sm primary style={{ flex: 1 }}>Venmo</Btn>
            <Btn sm style={{ flex: 1 }}>Zelle</Btn>
            <Btn sm style={{ flex: 1 }}>Copy</Btn>
          </div>
        </div>
      ))}
      <div style={{ flex: 1 }}></div>
      <Btn block>⤓ Export CSV</Btn>
    </Phone>
  );
}

Object.assign(window, { A_Home, A_Receipt, A_People, A_Assign, A_Summary, A_Send });
