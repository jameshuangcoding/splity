// Canonical calculation engine — ported directly from prototype/splity-data.jsx.
// All math is defined here; never re-derive these formulas elsewhere.

export interface EngineLineItem {
  id: string;
  name: string;
  price: number;
  isDiscount?: boolean;
}

export interface EnginePerson {
  id: string;
  name: string;
  payer: boolean; // absorbs rounding remainder
}

export interface EngineReceipt {
  subtotal: number;
  tax: number;
  tip: number;
  discount: number; // total discount amount (positive number)
  total: number;
}

export type EngineAssignments = Record<string, string[]>; // itemId → [personId]

export interface PersonBreakdown {
  sub: number;
  tax: number;
  tip: number;
  disc: number;
  total: number;
  remainder?: boolean; // true on the payer row
}

export interface CalcResult {
  sub: number;
  taxRate: number;
  tipRate: number;
  breakdown: Record<string, PersonBreakdown>;
  payerId: string;
  assignedCount: number;
  itemCount: number;
  fullyAssigned: boolean;
}

export const round2 = (n: number): number => Math.round(n * 100) / 100;

export function compute(
  receipt: EngineReceipt,
  items: EngineLineItem[],
  people: EnginePerson[],
  assignments: EngineAssignments
): CalcResult {
  // Non-discount items only for subtotal derivation
  const regularItems = items.filter((it) => !it.isDiscount);
  const sub =
    receipt.subtotal ||
    regularItems.reduce((a, it) => a + it.price, 0);

  const taxRate = sub ? receipt.tax / sub : 0;
  const tipRate = sub ? receipt.tip / sub : 0;

  // Per-person item subtotal
  const itemSub: Record<string, number> = {};
  people.forEach((p) => {
    itemSub[p.id] = 0;
  });

  regularItems.forEach((it) => {
    const who = assignments[it.id] || [];
    if (!who.length) return;
    const share = it.price / who.length;
    who.forEach((pid) => {
      if (itemSub[pid] != null) itemSub[pid] += share;
    });
  });

  // Raw per-person totals
  const raw: Record<string, PersonBreakdown> = {};
  people.forEach((p) => {
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

  // Rounding: round non-payer totals to the cent; payer absorbs remainder
  // so that Σ personTotal === receipt.total exactly.
  const payer = people.find((p) => p.payer) ?? people[0];
  const breakdown: Record<string, PersonBreakdown> = {};
  let othersTotal = 0;

  people.forEach((p) => {
    const r = raw[p.id];
    const row: PersonBreakdown = {
      sub: round2(r.sub),
      tax: round2(r.tax),
      tip: round2(r.tip),
      disc: round2(r.disc),
      total: round2(r.total),
    };
    breakdown[p.id] = row;
    if (p.id !== payer.id) othersTotal += row.total;
  });

  breakdown[payer.id].total = round2(receipt.total - othersTotal);
  breakdown[payer.id].remainder = true;

  const assignedCount = regularItems.filter(
    (it) => (assignments[it.id] || []).length > 0
  ).length;

  return {
    sub,
    taxRate,
    tipRate,
    breakdown,
    payerId: payer.id,
    assignedCount,
    itemCount: regularItems.length,
    fullyAssigned: assignedCount === regularItems.length,
  };
}

export function toCSV(
  expenseName: string,
  items: EngineLineItem[],
  people: EnginePerson[],
  assignments: EngineAssignments,
  calc: CalcResult
): string {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const rows: string[][] = [
    ["Person", "Items", "Subtotal", "Tax", "Tip", "Discount", "Total owed"],
  ];

  people.forEach((p) => {
    const assignedItems = items
      .filter(
        (it) => !it.isDiscount && (assignments[it.id] || []).includes(p.id)
      )
      .map((it) => it.name)
      .join("; ");

    const b = calc.breakdown[p.id];
    rows.push([
      p.name,
      assignedItems,
      b.sub.toFixed(2),
      b.tax.toFixed(2),
      b.tip.toFixed(2),
      b.disc.toFixed(2),
      b.total.toFixed(2),
    ]);
  });

  return rows.map((r) => r.map(escape).join(",")).join("\n");
}
