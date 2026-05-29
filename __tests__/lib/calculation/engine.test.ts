import {
  round2,
  compute,
  toCSV,
  type EngineReceipt,
  type EngineLineItem,
  type EnginePerson,
  type EngineAssignments,
} from "@/lib/calculation/engine";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const RECEIPT: EngineReceipt = {
  subtotal: 49.25,
  tax: 4.31,
  tip: 9.75,
  discount: 5.0,
  total: 58.31, // 49.25 + 4.31 + 9.75 - 5.00
};

const ITEMS: EngineLineItem[] = [
  { id: "i1", name: "Tonkotsu ramen", price: 14.5 },
  { id: "i2", name: "Gyoza (6 pc)", price: 7.0 },
  { id: "i3", name: "Chicken karaage", price: 9.25 },
  { id: "i4", name: "Sapporo ×2", price: 12.0 },
  { id: "i5", name: "Matcha tiramisu", price: 6.5 },
];

const PEOPLE: EnginePerson[] = [
  { id: "you", name: "You", payer: true },
  { id: "mara", name: "Mara", payer: false },
  { id: "kenji", name: "Kenji", payer: false },
  { id: "priya", name: "Priya", payer: false },
];

const ASSIGNMENTS: EngineAssignments = {
  i1: ["kenji"],
  i2: ["you", "mara"], // shared equally
  i3: ["mara"],
  i4: ["you"],
  i5: ["priya"],
};

// ─── round2 ──────────────────────────────────────────────────────────────────

describe("round2", () => {
  it("rounds to 2 decimal places", () => {
    // Use unambiguous values (1.005 is 1.00499... in IEEE 754)
    expect(round2(1.006)).toBe(1.01);
    expect(round2(1.004)).toBe(1.0);
    expect(round2(1.234)).toBe(1.23);
    expect(round2(1.235)).toBe(1.24);
  });

  it("handles negative numbers", () => {
    expect(round2(-1.005)).toBe(-1.0);
    expect(round2(-1.235)).toBe(-1.24);
  });

  it("leaves already-rounded numbers unchanged", () => {
    expect(round2(10.5)).toBe(10.5);
    expect(round2(0)).toBe(0);
  });
});

// ─── compute — happy path ─────────────────────────────────────────────────────

describe("compute — full sample split", () => {
  const result = compute(RECEIPT, ITEMS, PEOPLE, ASSIGNMENTS);

  it("derives correct tax and tip rates", () => {
    expect(result.taxRate).toBeCloseTo(4.31 / 49.25, 8);
    expect(result.tipRate).toBeCloseTo(9.75 / 49.25, 8);
  });

  it("reports correct assignment counts", () => {
    expect(result.itemCount).toBe(5);
    expect(result.assignedCount).toBe(5);
    expect(result.fullyAssigned).toBe(true);
  });

  it("identifies the payer", () => {
    expect(result.payerId).toBe("you");
    expect(result.breakdown["you"].remainder).toBe(true);
  });

  it("computes per-person item subtotals correctly", () => {
    // You: i2 half (3.5) + i4 (12) = 15.5
    expect(result.breakdown["you"].sub).toBe(15.5);
    // Mara: i2 half (3.5) + i3 (9.25) = 12.75
    expect(result.breakdown["mara"].sub).toBe(12.75);
    // Kenji: i1 (14.5)
    expect(result.breakdown["kenji"].sub).toBe(14.5);
    // Priya: i5 (6.5)
    expect(result.breakdown["priya"].sub).toBe(6.5);
  });

  it("non-payer totals round to the nearest cent", () => {
    expect(result.breakdown["mara"].total).toBe(15.1);
    expect(result.breakdown["kenji"].total).toBe(17.17);
    expect(result.breakdown["priya"].total).toBe(7.7);
  });

  it("payer total absorbs remainder so sum equals receipt total exactly", () => {
    const allTotals = PEOPLE.map((p) => result.breakdown[p.id].total);
    const sum = round2(allTotals.reduce((a, b) => a + b, 0));
    expect(sum).toBe(RECEIPT.total);
  });

  it("all person totals are non-negative", () => {
    PEOPLE.forEach((p) => {
      expect(result.breakdown[p.id].total).toBeGreaterThanOrEqual(0);
    });
  });
});

// ─── compute — edge cases ─────────────────────────────────────────────────────

describe("compute — edge cases", () => {
  it("handles no assignments — all subtotals are 0", () => {
    const result = compute(RECEIPT, ITEMS, PEOPLE, {});
    PEOPLE.forEach((p) => {
      expect(result.breakdown[p.id].sub).toBe(0);
    });
    expect(result.assignedCount).toBe(0);
    expect(result.fullyAssigned).toBe(false);
  });

  it("handles single person receiving everything", () => {
    const solo: EnginePerson[] = [{ id: "solo", name: "Solo", payer: true }];
    const allToSolo: EngineAssignments = Object.fromEntries(
      ITEMS.map((it) => [it.id, ["solo"]])
    );
    const result = compute(RECEIPT, ITEMS, solo, allToSolo);
    // Payer gets everything — must equal receipt total
    expect(result.breakdown["solo"].total).toBe(RECEIPT.total);
  });

  it("handles zero tax and tip", () => {
    const flatReceipt: EngineReceipt = {
      subtotal: 20,
      tax: 0,
      tip: 0,
      discount: 0,
      total: 20,
    };
    const twoItems: EngineLineItem[] = [
      { id: "a", name: "A", price: 10 },
      { id: "b", name: "B", price: 10 },
    ];
    const twoPeople: EnginePerson[] = [
      { id: "p1", name: "P1", payer: true },
      { id: "p2", name: "P2", payer: false },
    ];
    const result = compute(flatReceipt, twoItems, twoPeople, {
      a: ["p1"],
      b: ["p2"],
    });
    expect(result.breakdown["p1"].total).toBe(10);
    expect(result.breakdown["p2"].total).toBe(10);
    expect(round2(result.breakdown["p1"].total + result.breakdown["p2"].total)).toBe(20);
  });

  it("applies discount proportionally across people", () => {
    // Both people have equal item subtotals → equal discount allocation
    const equalReceipt: EngineReceipt = {
      subtotal: 20,
      tax: 0,
      tip: 0,
      discount: 4,
      total: 16,
    };
    const items: EngineLineItem[] = [
      { id: "a", name: "A", price: 10 },
      { id: "b", name: "B", price: 10 },
    ];
    const people: EnginePerson[] = [
      { id: "p1", name: "P1", payer: true },
      { id: "p2", name: "P2", payer: false },
    ];
    const result = compute(equalReceipt, items, people, {
      a: ["p1"],
      b: ["p2"],
    });
    expect(result.breakdown["p1"].disc).toBe(2);
    expect(result.breakdown["p2"].disc).toBe(2);
    expect(round2(result.breakdown["p1"].total + result.breakdown["p2"].total)).toBe(16);
  });

  it("splits a shared item equally among assignees", () => {
    const receipt: EngineReceipt = {
      subtotal: 30,
      tax: 0,
      tip: 0,
      discount: 0,
      total: 30,
    };
    const items: EngineLineItem[] = [{ id: "shared", name: "Shared", price: 30 }];
    const people: EnginePerson[] = [
      { id: "a", name: "A", payer: true },
      { id: "b", name: "B", payer: false },
      { id: "c", name: "C", payer: false },
    ];
    const result = compute(receipt, items, people, { shared: ["a", "b", "c"] });
    // Each person gets exactly 10 (30 / 3)
    expect(result.breakdown["b"].sub).toBe(10);
    expect(result.breakdown["c"].sub).toBe(10);
  });

  it("uses items subtotal when receipt.subtotal is 0", () => {
    const noSubtotal: EngineReceipt = {
      subtotal: 0,
      tax: 0,
      tip: 0,
      discount: 0,
      total: 20,
    };
    const items: EngineLineItem[] = [
      { id: "x", name: "X", price: 20 },
    ];
    const people: EnginePerson[] = [{ id: "p", name: "P", payer: true }];
    const result = compute(noSubtotal, items, people, { x: ["p"] });
    // sub derived from items sum = 20
    expect(result.sub).toBe(20);
  });
});

// ─── toCSV ────────────────────────────────────────────────────────────────────

describe("toCSV", () => {
  const result = compute(RECEIPT, ITEMS, PEOPLE, ASSIGNMENTS);

  it("produces correct CSV headers", () => {
    const csv = toCSV("Dinner", ITEMS, PEOPLE, ASSIGNMENTS, result);
    const lines = csv.split("\n");
    expect(lines[0]).toBe(
      "Person,Items,Subtotal,Tax,Tip,Discount,Total owed"
    );
  });

  it("produces one row per person", () => {
    const csv = toCSV("Dinner", ITEMS, PEOPLE, ASSIGNMENTS, result);
    const lines = csv.split("\n");
    // 1 header + 4 people
    expect(lines).toHaveLength(5);
  });

  it("includes each person's name in their row", () => {
    const csv = toCSV("Dinner", ITEMS, PEOPLE, ASSIGNMENTS, result);
    expect(csv).toContain("You");
    expect(csv).toContain("Mara");
    expect(csv).toContain("Kenji");
    expect(csv).toContain("Priya");
  });

  it("escapes values containing commas with double quotes", () => {
    const items: EngineLineItem[] = [
      { id: "x", name: "Steak, well done", price: 20 },
    ];
    const people: EnginePerson[] = [{ id: "p", name: "P", payer: true }];
    const r = compute(
      { subtotal: 20, tax: 0, tip: 0, discount: 0, total: 20 },
      items,
      people,
      { x: ["p"] }
    );
    const csv = toCSV("Test", items, people, { x: ["p"] }, r);
    expect(csv).toContain('"Steak, well done"');
  });
});
