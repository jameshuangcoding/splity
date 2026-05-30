import type { StoreReceipt, StoreLineItem } from "@/types";

const r2 = (n: number) => Math.round(n * 100) / 100;

function getNum(obj: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "number" && isFinite(v)) return v;
    if (typeof v === "string") {
      const n = parseFloat(v);
      if (!isNaN(n)) return n;
    }
  }
  return 0;
}

// Maps raw Tabscanner JSON → StoreReceipt shape.
// Handles both top-level fields and the nested-under-result variant.
// Does NOT include total — callers must derive it from the other fields.
export function normalizeOcrResponse(raw: unknown): Partial<StoreReceipt> {
  if (!raw || typeof raw !== "object") return {};
  const top = raw as Record<string, unknown>;

  const data =
    top.result && typeof top.result === "object"
      ? (top.result as Record<string, unknown>)
      : top;

  const rawItems = Array.isArray(data.lineItems) ? data.lineItems : [];
  const items: StoreLineItem[] = [];
  rawItems.forEach((li: unknown, i: number) => {
    if (!li || typeof li !== "object") return;
    const row = li as Record<string, unknown>;
    // Tabscanner uses "desc"; other variants use "description" or "name".
    const name = String(row.desc ?? row.description ?? row.name ?? `Item ${i + 1}`);
    const price = r2(getNum(row, "lineTotal", "unitPrice", "price"));
    if (price > 0) items.push({ id: `ocr-${i}`, name, price });
  });

  const subtotal = r2(getNum(data, "subTotal", "subtotal"));
  const tax = r2(getNum(data, "tax", "taxAmount"));
  const tip = r2(getNum(data, "tip", "tipAmount"));
  const discount = r2(getNum(data, "discount", "discountAmount"));

  let place = "";
  // Tabscanner uses top-level "establishment" + "date"; some variants nest under "merchant".
  const establishmentName =
    typeof data.establishment === "string"
      ? data.establishment.trim()
      : data.merchant && typeof data.merchant === "object"
        ? String((data.merchant as Record<string, unknown>).name ?? "").trim()
        : "";
  const receiptDate =
    typeof data.date === "string"
      ? data.date.split(" ")[0]
      : data.merchant && typeof data.merchant === "object"
        ? String((data.merchant as Record<string, unknown>).date ?? "").trim()
        : "";
  place = [establishmentName, receiptDate].filter(Boolean).join(" · ");

  return { subtotal, tax, tip, discount, place, items };
}
