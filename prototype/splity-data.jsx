// splity-data.jsx — sample bill + calculation engine (PRD §5.2 math)

// person palette — distinct hues that read in both themes
const PEOPLE = [
  { id: 'you',   name: 'You',   initial: 'Y', color: '#ff7a4d', payer: true },
  { id: 'mara',  name: 'Mara',  initial: 'M', color: '#3ddc97' },
  { id: 'kenji', name: 'Kenji', initial: 'K', color: '#5b8cff' },
  { id: 'priya', name: 'Priya', initial: 'P', color: '#c084fc' },
];

const ITEMS = [
  { id: 'i1', name: 'Tonkotsu ramen', price: 14.50 },
  { id: 'i2', name: 'Gyoza (6 pc)',   price: 7.00 },
  { id: 'i3', name: 'Chicken karaage', price: 9.25 },
  { id: 'i4', name: 'Sapporo · ×2',    price: 12.00 },
  { id: 'i5', name: 'Matcha tiramisu', price: 6.50 },
];

const RECEIPT = {
  name: 'East Asia dinner',
  place: 'Ippudo · Apr 14',
  subtotal: 49.25,
  tax: 4.31,
  tip: 9.75,
  discount: 5.00, // positive = amount off
};
RECEIPT.total = +(RECEIPT.subtotal + RECEIPT.tax + RECEIPT.tip - RECEIPT.discount).toFixed(2);

// pre-seeded assignment so the demo lands on a complete split
const SEED_ASSIGN = {
  i1: ['kenji'],
  i2: ['you', 'mara'],
  i3: ['mara'],
  i4: ['you'],
  i5: ['priya'],
};

const round2 = (n) => Math.round(n * 100) / 100;
const money = (n) => (n < 0 ? '-$' : '$') + Math.abs(n).toFixed(2);

// Core engine. assignments: { itemId: [personId,...] } (shared = equal split)
function compute(receipt, items, people, assignments) {
  const sub = receipt.subtotal || items.reduce((a, it) => a + it.price, 0);
  const taxRate = sub ? receipt.tax / sub : 0;
  const tipRate = sub ? receipt.tip / sub : 0;

  // per-person item subtotal
  const itemSub = {};
  people.forEach(p => { itemSub[p.id] = 0; });
  let assignedSub = 0;
  items.forEach(it => {
    const who = assignments[it.id] || [];
    if (!who.length) return;
    const share = it.price / who.length;
    who.forEach(pid => { if (itemSub[pid] != null) { itemSub[pid] += share; } });
    assignedSub += it.price;
  });

  // raw per-person totals
  const raw = {};
  people.forEach(p => {
    const s = itemSub[p.id];
    const disc = sub ? receipt.discount * (s / sub) : 0;
    raw[p.id] = {
      sub: s,
      tax: s * taxRate,
      tip: s * tipRate,
      disc,
      total: s + s * taxRate + s * tipRate - disc,
    };
  });

  // rounding: everyone to the cent, payer absorbs remainder so Σ == receipt total
  const payer = people.find(p => p.payer) || people[0];
  const breakdown = {};
  let othersTotal = 0;
  people.forEach(p => {
    const r = raw[p.id];
    const row = { sub: round2(r.sub), tax: round2(r.tax), tip: round2(r.tip), disc: round2(r.disc), total: round2(r.total) };
    breakdown[p.id] = row;
    if (p.id !== payer.id) { othersTotal += row.total; }
  });
  breakdown[payer.id].total = round2(receipt.total - othersTotal);
  breakdown[payer.id].remainder = true;

  const assignedCount = items.filter(it => (assignments[it.id] || []).length).length;
  return {
    sub, taxRate, tipRate, breakdown, payerId: payer.id,
    assignedCount, itemCount: items.length,
    fullyAssigned: assignedCount === items.length,
  };
}

// CSV (PRD §5.5)
function toCSV(receipt, items, people, assignments, calc) {
  const rows = [['Person', 'Items', 'Subtotal', 'Tax', 'Tip', 'Discount', 'Total owed']];
  people.forEach(p => {
    const its = items.filter(it => (assignments[it.id] || []).includes(p.id)).map(it => it.name).join('; ');
    const b = calc.breakdown[p.id];
    rows.push([p.name, its, b.sub.toFixed(2), b.tax.toFixed(2), b.tip.toFixed(2), b.disc.toFixed(2), b.total.toFixed(2)]);
  });
  return rows.map(r => r.map(c => /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c).join(',')).join('\n');
}

Object.assign(window, { PEOPLE, ITEMS, RECEIPT, SEED_ASSIGN, compute, toCSV, round2, money });
