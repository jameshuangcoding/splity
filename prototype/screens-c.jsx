// screens-c.jsx — Approach C · Drag-to-Bucket (items are cards you drag into people's bins)

// a draggable item card
function Card({ name, price, drag, ghost, rot = -2, style }) {
  return (
    <div className="sk box" style={{
      padding: '5px 9px', display: 'flex', alignItems: 'center', gap: 6,
      transform: `rotate(${rot}deg)`,
      boxShadow: drag ? '4px 7px 0 rgba(42,38,32,0.18)' : 'none',
      background: ghost ? 'var(--paper-2)' : 'var(--paper)',
      borderStyle: ghost ? 'dashed' : 'solid',
      ...style,
    }}>
      <span className="dim" style={{ fontSize: 12, letterSpacing: '-2px' }}>⋮⋮</span>
      <span style={{ flex: 1, fontSize: 13 }}>{name}</span>
      <Money style={{ fontSize: 12 }}>{price}</Money>
    </div>
  );
}

// a person bucket / bin
function Bin({ name, items, total, drop }) {
  return (
    <div className={'sk box' + (drop ? ' accent-soft' : '')} style={{
      padding: '6px 8px', borderStyle: 'dashed', minHeight: 92, display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Ava name={name[0]} sm on={drop} />
        <span style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>{name}</span>
        <Money className="num" style={{ fontSize: 13 }}>{total}</Money>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {items.map((it, k) => <span key={k} className="chip" style={{ fontSize: 10, padding: '1px 6px' }}>{it}</span>)}
        {drop && <span className="micro accent-tx" style={{ alignSelf: 'center' }}>drop here ↓</span>}
      </div>
    </div>
  );
}

function C_Home() {
  return (
    <Phone>
      <div className="screen" style={{ justifyContent: 'space-between', padding: '8px 8px 4px' }}>
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <h1 style={{ fontSize: 38 }}>splity</h1>
          <Note style={{ marginTop: 4 }}>drag each dish to whoever ate it.</Note>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'flex-end', margin: '4px 0' }}>
          <Card name="ramen" price="14.50" drag rot={-7} style={{ width: 110 }} />
          <span style={{ fontSize: 22 }}>↘</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Bin name="You" items={['ramen']} total="14.5" drop />
          <Bin name="Mara" items={[]} total="0.00" />
        </div>
        <Field label="EXPENSE" value="East Asia dinner" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <Btn primary block>⊡  Scan receipt</Btn>
          <Btn block>Enter manually</Btn>
        </div>
      </div>
    </Phone>
  );
}

function C_Receipt() {
  return (
    <Phone>
      <AppBar title="Your items" right={<span className="chip">retake</span>} />
      <Note style={{ padding: '0 6px 6px' }}>each line became a card — tap to fix, these are what you'll drag.</Note>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '2px 4px' }}>
        <Card name="Tonkotsu ramen ✎" price="14.50" rot={-2} style={{ width: '47%' }} />
        <Card name="Gyoza (6) ✎" price="7.00" rot={2} style={{ width: '47%' }} />
        <Card name="Karaage ✎" price="9.25" rot={1} style={{ width: '47%' }} />
        <Card name="Sapporo x2 ✎" price="12.00" rot={-1} style={{ width: '47%' }} />
        <Card name="Matcha cake ✎" price="6.50" rot={-2} style={{ width: '47%' }} />
      </div>
      <div className="sk box" style={{ padding: '6px 10px', margin: '12px 2px 0' }}>
        <div className="rowline micro" style={{ borderBottom: 'none' }}>
          <span style={{ flex: 1 }}>sub 49.25 · tax 4.31 · tip 9.75 · −5.00</span>
        </div>
        <div className="rowline" style={{ borderBottom: 'none' }}><span style={{ flex: 1, fontWeight: 700 }}>TOTAL</span><Money accent style={{ fontSize: 17 }}>$58.31</Money></div>
      </div>
      <div style={{ flex: 1 }}></div>
      <Btn primary block>Next →</Btn>
    </Phone>
  );
}

function C_People() {
  return (
    <Phone>
      <AppBar title="Make the bins" />
      <Note style={{ padding: '0 6px 8px' }}>each person is a bin you'll drop dishes into.</Note>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, padding: '2px 4px' }}>
        <Bin name="You" items={['payer']} total="0.00" />
        <Bin name="Mara" items={[]} total="0.00" />
        <Bin name="Kenji" items={[]} total="0.00" />
        <div className="sk box" style={{ borderStyle: 'dashed', minHeight: 92, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
          <div className="ava" style={{ borderStyle: 'dashed' }}>+</div>
          <span className="micro">new bin</span>
        </div>
      </div>
      <Field value="" placeholder="name + ↵" />
      <div style={{ flex: 1 }}></div>
      <Btn primary block>Start dragging →</Btn>
    </Phone>
  );
}

function C_Assign() {
  return (
    <Phone>
      <AppBar title="Drag to split" right={<span className="chip">9/14</span>} />
      <div className="micro" style={{ padding: '0 6px 4px', letterSpacing: '1px' }}>UNASSIGNED POOL</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, padding: '0 4px 4px', position: 'relative' }}>
        <Card name="Sapporo x2" price="12.00" rot={-3} style={{ width: '46%' }} />
        <Card name="edamame" price="5.00" rot={2} style={{ width: '46%' }} />
        {/* card mid-drag */}
        <Card name="Karaage" price="9.25" drag rot={-9} style={{ width: '52%', position: 'relative', zIndex: 3 }} />
        <span style={{ position: 'absolute', right: 56, bottom: -10, fontSize: 20 }}>↓</span>
        <span className="chip" style={{ borderStyle: 'dashed', fontSize: 11 }}>⊞ split among all</span>
      </div>
      <div className="micro" style={{ padding: '6px 6px 4px', letterSpacing: '1px' }}>BINS</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 4px' }}>
        <Bin name="You" items={['gyoza½']} total="3.50" />
        <Bin name="Mara" items={['gyoza½', 'edam']} total="8.50" drop />
        <Bin name="Kenji" items={['ramen']} total="14.5" />
        <Bin name="Priya" items={['cake']} total="6.50" />
      </div>
      <div style={{ flex: 1 }}></div>
      <Btn primary block>Seal &amp; total →</Btn>
    </Phone>
  );
}

function C_Summary() {
  return (
    <Phone>
      <AppBar title="Sealed bins" />
      {[
        ['Kenji', '$19.04', 'ramen, ½ gyoza · +tax +tip −disc'],
        ['Mara', '$13.92', 'karaage, edamame · +tax +tip −disc'],
        ['Priya', '$8.54', 'matcha cake · +tax +tip −disc'],
        ['You · payer', '$16.81', 'sapporo, ½ gyoza · +tax +tip'],
      ].map(([n, t, brk]) => (
        <div key={n} className="sk box" style={{ padding: '7px 10px', margin: '0 2px 7px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ava name={n[0]} on />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{n}</div>
            <div className="micro">{brk}</div>
          </div>
          <Money accent style={{ fontSize: 18 }}>{t}</Money>
        </div>
      ))}
      <Note style={{ textAlign: 'center', padding: '2px 0' }}>4 bins · sums to $58.31 ✓</Note>
      <div style={{ flex: 1 }}></div>
      <Btn primary block>Send requests →</Btn>
    </Phone>
  );
}

function C_Send() {
  return (
    <Phone>
      <AppBar title="Collect" />
      <div className="chip on" style={{ margin: '0 4px 8px' }}>memo: “East Asia dinner”</div>
      {[
        ['Kenji', '$19.04'],
        ['Mara', '$13.92'],
        ['Priya', '$8.54'],
      ].map(([n, t]) => (
        <div key={n} className="sk box" style={{ padding: '8px 10px', margin: '0 2px 9px', transform: 'rotate(-0.6deg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
            <Ava name={n[0]} on /><span style={{ flex: 1, fontWeight: 700 }}>{n}</span>
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
      <Btn block>⤓ Export all bins to CSV</Btn>
    </Phone>
  );
}

Object.assign(window, { C_Home, C_Receipt, C_People, C_Assign, C_Summary, C_Send });
