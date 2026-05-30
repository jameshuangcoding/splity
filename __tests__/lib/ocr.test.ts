import { normalizeOcrResponse } from "@/lib/ocr";

describe("normalizeOcrResponse", () => {
  it("returns empty object for null", () => {
    expect(normalizeOcrResponse(null)).toEqual({});
  });

  it("returns empty object for non-object", () => {
    expect(normalizeOcrResponse("string")).toEqual({});
    expect(normalizeOcrResponse(42)).toEqual({});
  });

  it("returns empty object for empty object", () => {
    const result = normalizeOcrResponse({});
    expect(result.subtotal).toBe(0);
    expect(result.tax).toBe(0);
    expect(result.tip).toBe(0);
    expect(result.discount).toBe(0);
    expect(result.items).toEqual([]);
  });

  it("maps top-level lineItems to items", () => {
    const raw = {
      lineItems: [
        { description: "Ramen", lineTotal: 14.50 },
        { description: "Gyoza", lineTotal: 7.00 },
      ],
      subTotal: 21.50,
      tax: 1.93,
      tip: 4.30,
      total: 27.73,
    };
    const result = normalizeOcrResponse(raw);
    expect(result.items).toHaveLength(2);
    expect(result.items![0]).toMatchObject({ name: "Ramen", price: 14.50 });
    expect(result.items![1]).toMatchObject({ name: "Gyoza", price: 7.00 });
  });

  it("reads subTotal (camelCase) field", () => {
    const result = normalizeOcrResponse({ subTotal: 49.25 });
    expect(result.subtotal).toBe(49.25);
  });

  it("reads subtotal (lowercase) field as fallback", () => {
    const result = normalizeOcrResponse({ subtotal: 30.00 });
    expect(result.subtotal).toBe(30.00);
  });

  it("maps tax and tip", () => {
    const result = normalizeOcrResponse({ tax: 4.31, tip: 9.75 });
    expect(result.tax).toBe(4.31);
    expect(result.tip).toBe(9.75);
  });

  it("reads taxAmount and tipAmount as fallbacks", () => {
    const result = normalizeOcrResponse({ taxAmount: 2.50, tipAmount: 5.00 });
    expect(result.tax).toBe(2.50);
    expect(result.tip).toBe(5.00);
  });

  it("maps discount", () => {
    const result = normalizeOcrResponse({ discount: 5.00 });
    expect(result.discount).toBe(5.00);
  });

  it("handles nested result object (Tabscanner v2 format)", () => {
    const raw = {
      token: "abc123",
      status: "done",
      result: {
        lineItems: [{ description: "Pizza", lineTotal: 12.00 }],
        subTotal: 12.00,
        tax: 1.08,
        tip: 2.40,
        total: 15.48,
        merchant: { name: "Pizzeria", date: "2024-01-01" },
      },
    };
    const result = normalizeOcrResponse(raw);
    expect(result.subtotal).toBe(12.00);
    expect(result.tax).toBe(1.08);
    expect(result.items).toHaveLength(1);
    expect(result.items![0].name).toBe("Pizza");
  });

  it("maps Tabscanner 'desc' field to item name", () => {
    const raw = {
      lineItems: [{ desc: "Pad Thai", lineTotal: 14.0 }],
    };
    const result = normalizeOcrResponse(raw);
    expect(result.items![0].name).toBe("Pad Thai");
  });

  it("prefers 'desc' over 'description' and 'name'", () => {
    const raw = {
      lineItems: [{ desc: "From desc", description: "From description", name: "From name", lineTotal: 5.0 }],
    };
    expect(normalizeOcrResponse(raw).items![0].name).toBe("From desc");
  });

  it("builds place from top-level 'establishment' and 'date' (Tabscanner v2 format)", () => {
    const raw = {
      status: "done",
      result: {
        establishment: "Amphawa Thai",
        date: "2026-03-21 08:47:00",
        lineItems: [],
        subTotal: 0,
      },
    };
    const result = normalizeOcrResponse(raw);
    expect(result.place).toBe("Amphawa Thai · 2026-03-21");
  });

  it("builds place from merchant name and date (legacy format)", () => {
    const result = normalizeOcrResponse({
      merchant: { name: "Ippudo", date: "Apr 14" },
    });
    expect(result.place).toBe("Ippudo · Apr 14");
  });

  it("builds place from merchant name only when date missing", () => {
    const result = normalizeOcrResponse({ merchant: { name: "Sushi Bar" } });
    expect(result.place).toBe("Sushi Bar");
  });

  it("skips line items with zero price", () => {
    const raw = {
      lineItems: [
        { description: "Paid item", lineTotal: 5.00 },
        { description: "Free item", lineTotal: 0 },
      ],
    };
    const result = normalizeOcrResponse(raw);
    expect(result.items).toHaveLength(1);
    expect(result.items![0].name).toBe("Paid item");
  });

  it("uses unitPrice fallback when lineTotal missing", () => {
    const raw = {
      lineItems: [{ description: "Item", unitPrice: 8.50 }],
    };
    const result = normalizeOcrResponse(raw);
    expect(result.items![0].price).toBe(8.50);
  });

  it("rounds values to 2 decimal places", () => {
    const result = normalizeOcrResponse({ subTotal: 10.005 });
    expect(result.subtotal).toBe(10.01);
  });

  it("does NOT include total in the output", () => {
    const result = normalizeOcrResponse({ total: 99.99 });
    expect(result.total).toBeUndefined();
  });

  it("generates unique ids for each item", () => {
    const raw = {
      lineItems: [
        { description: "A", lineTotal: 1.00 },
        { description: "B", lineTotal: 2.00 },
      ],
    };
    const result = normalizeOcrResponse(raw);
    const ids = result.items!.map((it) => it.id);
    expect(new Set(ids).size).toBe(2);
  });

  it("handles string number values gracefully", () => {
    const result = normalizeOcrResponse({ subTotal: "49.25", tax: "4.31" });
    expect(result.subtotal).toBe(49.25);
    expect(result.tax).toBe(4.31);
  });
});
