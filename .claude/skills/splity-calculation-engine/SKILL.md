---
name: splity-calculation-engine
description: >
  Defines the exact calculation logic for Splity's bill splitting engine. Use this skill
  any time you are implementing or modifying split calculations, tax allocation, tip
  allocation, discount distribution, rounding, per-person totals, or the CSV export
  data shape. This skill must be consulted before writing any math in this codebase.
  Never re-derive these formulas from scratch — use the canonical implementations here.
  Trigger on: calculation functions, split logic, tax/tip math, rounding, PersonBillResult,
  PersonReceiptResult, calculateBill, engine.ts, or any file in lib/calculation/.
---

# Splity Calculation Engine

The engine lives in `lib/calculation/engine.ts`. It is **pure TypeScript** — no database
calls, no side effects. Takes plain objects in, returns plain objects out. This makes it
fully testable in isolation and safe to run client-side.

---

## Core Principle

All rates are **derived from actual receipt values**, never assumed:

```
taxRate = taxAmount ÷ subtotal
tipRate = tipAmount ÷ subtotal
```

A 20% tip on a $47.38 subtotal may be $9.50 — the real rate is 20.05%, not 20%.
Using the derived rate ensures every person's allocation sums exactly to the receipt total.

---

## Calculation Flow

Two passes:

1. **Per Receipt** — for each receipt, calculate each person's share of items, then
   allocate tax/tip/discount proportionally. Apply rounding per receipt.
2. **Per Bill** — sum each person's receipt totals into a grand total.

---

## Full Implementation

```typescript
// lib/calculation/engine.ts

import type {
  Receipt,
  LineItem,
  Person,
  Assignment,
  PersonReceiptResult,
  PersonBillResult,
} from '@/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert a Prisma Decimal (or null/undefined) to a JS number. */
export function toNum(d: { toString(): string } | null | undefined): number {
  if (d == null) return 0
  return parseFloat(d.toString())
}

/** Round to exactly 2 decimal places. */
export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// ─── Rate Derivation ─────────────────────────────────────────────────────────

export type ReceiptRates = {
  taxRate: number  // 0 if receipt has no tax
  tipRate: number  // 0 if receipt has no tip
}

/**
 * Derive tax and tip rates from a receipt's stored amounts.
 * Falls back to 0 for any null field (flat receipts, loans, uber fares, etc).
 */
export function deriveRates(receipt: Receipt): ReceiptRates {
  const sub = toNum(receipt.subtotal)
  return {
    taxRate: sub > 0 && receipt.taxAmount != null
      ? toNum(receipt.taxAmount) / sub
      : 0,
    tipRate: sub > 0 && receipt.tipAmount != null
      ? toNum(receipt.tipAmount) / sub
      : 0,
  }
}

// ─── Item Subtotal ────────────────────────────────────────────────────────────

/**
 * Sum of a person's assigned items for one receipt.
 *
 * Split logic: the number of Assignment rows for a lineItemId determines the
 * equal split count. 2 rows = $price ÷ 2 each. 3 rows = $price ÷ 3 each.
 * Discount items (isDiscount: true) are excluded here — handled separately.
 */
export function getPersonItemSubtotal(
  personId: string,
  lineItems: LineItem[],
  assignments: Assignment[]
): number {
  return lineItems
    .filter(li => !li.isDiscount)
    .reduce((sum, item) => {
      const itemAssignments = assignments.filter(a => a.lineItemId === item.id)
      const isAssigned = itemAssignments.some(a => a.personId === personId)
      if (!isAssigned) return sum
      const splitCount = itemAssignments.length
      return sum + toNum(item.price) / splitCount
    }, 0)
}

// ─── Discount Allocation ──────────────────────────────────────────────────────

/**
 * Calculate a person's share of all discounts for one receipt.
 *
 * Two cases:
 * - Discount with NO assignments → proportional to all (by item subtotal share).
 * - Discount WITH assignments → split equally among only the assigned people.
 *
 * receiptSubtotal is the sum of all non-discount items (used as the denominator
 * for proportional allocation).
 */
export function getPersonDiscountShare(
  personId: string,
  lineItems: LineItem[],
  assignments: Assignment[],
  personItemSubtotal: number,
  receiptSubtotal: number
): number {
  return lineItems
    .filter(li => li.isDiscount)
    .reduce((sum, item) => {
      const itemAssignments = assignments.filter(a => a.lineItemId === item.id)
      const discountAmount = toNum(item.price)

      if (itemAssignments.length === 0) {
        // Proportional across all people
        if (receiptSubtotal === 0) return sum
        return sum + discountAmount * (personItemSubtotal / receiptSubtotal)
      } else {
        // Item-specific: only assigned people
        const isAssigned = itemAssignments.some(a => a.personId === personId)
        if (!isAssigned) return sum
        return sum + discountAmount / itemAssignments.length
      }
    }, 0)
}

// ─── Per-Person Receipt Result ────────────────────────────────────────────────

/**
 * Calculate one person's unrounded result for one receipt.
 * Used internally — call calculateBill() from outside this module.
 */
function calcPersonReceiptRaw(
  personId: string,
  receipt: Receipt,
  lineItems: LineItem[],
  assignments: Assignment[],
  rates: ReceiptRates,
  receiptSubtotal: number
): PersonReceiptResult {
  const itemSubtotal = getPersonItemSubtotal(personId, lineItems, assignments)
  const discountAllocated = getPersonDiscountShare(
    personId, lineItems, assignments, itemSubtotal, receiptSubtotal
  )
  const taxAllocated = itemSubtotal * rates.taxRate
  const tipAllocated = itemSubtotal * rates.tipRate
  const total = itemSubtotal + taxAllocated + tipAllocated - discountAllocated

  return { personId, itemSubtotal, taxAllocated, tipAllocated, discountAllocated, total }
}

// ─── Rounding ─────────────────────────────────────────────────────────────────

/**
 * Round all person totals for a receipt so their sum equals the receipt total exactly.
 *
 * Rule: all non-payers round to 2 decimal places first.
 * The payer's total is set to (receiptTotal - sum of non-payer rounded totals),
 * absorbing any cent-level remainder.
 *
 * Rationale: the payer typically earns credit card points/cashback on the full
 * amount, so a 1–2¢ rounding benefit to them is appropriate.
 */
export function applyRounding(
  results: PersonReceiptResult[],
  payerId: string,
  receiptTotal: number
): PersonReceiptResult[] {
  const nonPayers = results.filter(r => r.personId !== payerId)
  const payer     = results.find(r => r.personId === payerId)

  const roundedNonPayers = nonPayers.map(r => ({ ...r, total: round2(r.total) }))
  const nonPayerSum = roundedNonPayers.reduce((s, r) => s + r.total, 0)
  const payerTotal  = round2(receiptTotal - nonPayerSum)

  return [
    ...roundedNonPayers,
    ...(payer ? [{ ...payer, total: payerTotal }] : []),
  ]
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

/**
 * Calculate the full bill: per-person totals across all receipts.
 *
 * @param people        All Person records for the bill
 * @param receipts      All Receipt records for the bill, in order
 * @param lineItemsByReceipt   Map of receiptId → LineItem[]
 * @param assignmentsByReceipt Map of receiptId → Assignment[]
 * @param payerId       Person.id of who physically paid
 * @returns             One PersonBillResult per person
 */
export function calculateBill(
  people: Person[],
  receipts: Receipt[],
  lineItemsByReceipt: Record<string, LineItem[]>,
  assignmentsByReceipt: Record<string, Assignment[]>,
  payerId: string
): PersonBillResult[] {
  return people.map(person => {
    const receiptBreakdown = receipts.map(receipt => {
      const lineItems   = lineItemsByReceipt[receipt.id]   ?? []
      const assignments = assignmentsByReceipt[receipt.id] ?? []
      const rates       = deriveRates(receipt)
      // Use subtotal if present; fall back to totalAmount for flat receipts
      const sub = toNum(receipt.subtotal ?? receipt.totalAmount)

      // Calculate for all people, then extract this person's rounded result
      const allRaw = people.map(p =>
        calcPersonReceiptRaw(p.id, receipt, lineItems, assignments, rates, sub)
      )
      const allRounded = applyRounding(allRaw, payerId, toNum(receipt.totalAmount))
      return allRounded.find(r => r.personId === person.id)!
    })

    const grandTotal = receiptBreakdown.reduce((s, r) => s + r.total, 0)

    return {
      personId:         person.id,
      name:             person.name,
      isPayer:          person.isPayer,
      receiptBreakdown,
      grandTotal:       round2(grandTotal),
    }
  })
}
```

---

## Worked Example

See the PRD (splity_prd.md) for the full "Tokyo Night 1" walkthrough.
Short version:

- Receipt: Yakitori $22 (You + Alex shared), Ramen $18 (Jordan), Gyoza $10 (Alex), Beer $16 (You)
- Subtotal $66, Tax $5.86 (rate: 0.088788), Tip $13.20 (rate: 0.20000)
- You: items $27.00 + tax $2.40 + tip $5.40 = **$34.80**
- Alex: items $21.00 + tax $1.86 + tip $4.20 = **$27.06**
- Jordan: items $18.00 + tax $1.60 + tip $3.60 = **$23.20**
- Sum: $85.06 ✓ matches receipt total exactly, no rounding remainder

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Receipt has no tax | `taxAmount: null` → `taxRate = 0` → `taxAllocated = 0` |
| Receipt has no tip | `tipAmount: null` → `tipRate = 0` → `tipAllocated = 0` |
| Receipt has no subtotal (flat/loan) | Falls back to `totalAmount` as base for proportional splits |
| Item assigned to no one | Excluded from all person subtotals; warning shown in UI |
| Item shared equally (N people) | `price ÷ N` per person via assignment row count |
| Discount with no assignment | Distributed proportionally by item subtotal share |
| Discount assigned to specific person(s) | Only those people's totals are reduced |
| Rounding remainder | Always goes to the payer (person where `isPayer: true`) |
| All items unassigned | `calculateBill` still runs cleanly — all totals are $0 |

---

## CSV Export Shape

The export is generated **client-side** from `PersonBillResult[]` — no API call needed.

```typescript
// Generate CSV rows from calculation results
export function toCSVRows(results: PersonBillResult[]): string[][] {
  const header = ['Name', 'Items', 'Subtotal', 'Tax', 'Tip', 'Discount', 'Total Owed']
  const rows = results
    .filter(r => !r.isPayer)  // payer row is informational only
    .map(r => [
      r.name,
      r.receiptBreakdown.map(rb => `$${round2(rb.itemSubtotal)}`).join(' + '),
      `$${round2(r.receiptBreakdown.reduce((s, rb) => s + rb.itemSubtotal, 0))}`,
      `$${round2(r.receiptBreakdown.reduce((s, rb) => s + rb.taxAllocated, 0))}`,
      `$${round2(r.receiptBreakdown.reduce((s, rb) => s + rb.tipAllocated, 0))}`,
      `$${round2(r.receiptBreakdown.reduce((s, rb) => s + rb.discountAllocated, 0))}`,
      `$${r.grandTotal}`,
    ])
  return [header, ...rows]
}

export function toCSVString(rows: string[][]): string {
  return rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n')
}

// Trigger browser download
export function downloadCSV(csvString: string, filename: string): void {
  const blob = new Blob([csvString], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
```