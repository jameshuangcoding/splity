---
name: splity-data-model
description: >
  Defines the complete Prisma schema, TypeScript types, and data relationships for Splity.
  Use this skill any time you are reading from or writing to the database, creating or
  modifying Prisma queries, defining TypeScript types related to bills or expenses,
  writing API routes that touch bills/receipts/people/assignments, or whenever you need
  to understand how Splity's data is structured. This is the single source of truth for
  the data layer — always check here before writing any query or type.
---

# Splity Data Model

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─── Phase 2: groups multiple Bills ──────────────────────────────────────────
model Event {
  id        String    @id @default(cuid())
  name      String
  startDate DateTime?
  endDate   DateTime?
  userId    String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  bills     Bill[]
  user      User?     @relation(fields: [userId], references: [id])

  @@index([userId])
}

// ─── Top-level container ──────────────────────────────────────────────────────
model Bill {
  id        String     @id @default(cuid())
  name      String     // "Tokyo Night 1", "East Asia Apr-May '26" — used as payment memo
  status    BillStatus @default(DRAFT)
  eventId   String?    // null = standalone (Phase 1); linked = part of Event (Phase 2)
  userId    String?    // null Phase 1; linked to User in Phase 2
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  event     Event?     @relation(fields: [eventId], references: [id])
  user      User?      @relation(fields: [userId], references: [id])
  receipts  Receipt[]
  people    Person[]

  @@index([userId])
  @@index([eventId])
}

// ─── One scanned (or manually entered) receipt ────────────────────────────────
model Receipt {
  id          String    @id @default(cuid())
  billId      String
  label       String?   // optional: "Night 1 Dinner", "Uber Apr 22" — for multi-receipt bills
  subtotal    Decimal?  @db.Decimal(10, 2) // null for flat/loan receipts
  taxAmount   Decimal?  @db.Decimal(10, 2) // null if no tax
  tipAmount   Decimal?  @db.Decimal(10, 2) // null if no tip
  totalAmount Decimal   @db.Decimal(10, 2) // always required
  taxRate     Decimal?  @db.Decimal(8, 6)  // derived + stored: taxAmount ÷ subtotal
  tipRate     Decimal?  @db.Decimal(8, 6)  // derived + stored: tipAmount ÷ subtotal
  ocrRaw      Json?     // raw Tabscanner API response — kept for debugging
  position    Int       @default(0)        // display order within a bill
  createdAt   DateTime  @default(now())
  bill        Bill      @relation(fields: [billId], references: [id], onDelete: Cascade)
  lineItems   LineItem[]

  @@index([billId])
}

// ─── Individual line on a receipt ─────────────────────────────────────────────
model LineItem {
  id          String       @id @default(cuid())
  receiptId   String
  name        String
  price       Decimal      @db.Decimal(10, 2) // always stored positive
  isDiscount  Boolean      @default(false)    // true = subtract in calculation
  position    Int                             // preserves receipt print order
  receipt     Receipt      @relation(fields: [receiptId], references: [id], onDelete: Cascade)
  assignments Assignment[]

  @@index([receiptId])
}

// ─── Participant in a Bill ─────────────────────────────────────────────────────
model Person {
  id           String       @id @default(cuid())
  billId       String
  name         String
  isPayer      Boolean      @default(false) // who physically paid — absorbs rounding remainder
  venmoHandle  String?      // @username or phone number
  zelleContact String?      // phone or email
  bill         Bill         @relation(fields: [billId], references: [id], onDelete: Cascade)
  assignments  Assignment[]

  @@index([billId])
}

// ─── Item-to-person mapping ────────────────────────────────────────────────────
// One row per person per item. Split count = number of rows for a given lineItemId.
// Equal N-way split: item price ÷ count of assignments for that item.
model Assignment {
  id         String   @id @default(cuid())
  lineItemId String
  personId   String
  lineItem   LineItem @relation(fields: [lineItemId], references: [id], onDelete: Cascade)
  person     Person   @relation(fields: [personId], references: [id], onDelete: Cascade)

  @@unique([lineItemId, personId]) // one assignment per person per item
  @@index([lineItemId])
  @@index([personId])
}

// ─── Auth — scaffolded Phase 1, enforced Phase 2 ──────────────────────────────
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
  bills     Bill[]
  events    Event[]
}

enum BillStatus {
  DRAFT    // in progress — items may still be unassigned
  COMPLETE // all items assigned, totals calculated, ready to send
}
```

---

## TypeScript Types

These live in `types/index.ts`. They extend Prisma's generated types with
computed fields used by the UI and calculation engine.

```typescript
import type { Bill, Receipt, LineItem, Person, Assignment, BillStatus } from '@prisma/client'

// Re-export Prisma types for convenience
export type { Bill, Receipt, LineItem, Person, Assignment, BillStatus }

// ─── Nested types used in API responses ──────────────────────────────────────

export type LineItemWithAssignments = LineItem & {
  assignments: Assignment[]
}

export type ReceiptWithItems = Receipt & {
  lineItems: LineItemWithAssignments[]
}

export type PersonWithAssignments = Person & {
  assignments: Assignment[]
}

export type BillWithRelations = Bill & {
  receipts: ReceiptWithItems[]
  people: PersonWithAssignments[]
}

// ─── Calculation engine output types ─────────────────────────────────────────
// See splity-calculation-engine for how these are produced.

export type PersonReceiptResult = {
  personId:         string
  itemSubtotal:     number
  taxAllocated:     number
  tipAllocated:     number
  discountAllocated: number
  total:            number
}

export type PersonBillResult = {
  personId:          string
  name:              string
  isPayer:           boolean
  receiptBreakdown:  PersonReceiptResult[]
  grandTotal:        number  // sum of all receipt totals, post-rounding
}

// ─── API request/response shapes ─────────────────────────────────────────────

export type CreateBillInput = {
  name: string
}

export type CreateReceiptInput = {
  label?:      string
  subtotal?:   number | null
  taxAmount?:  number | null
  tipAmount?:  number | null
  totalAmount: number
  ocrRaw?:     unknown
  lineItems:   CreateLineItemInput[]
}

export type CreateLineItemInput = {
  name:       string
  price:      number
  isDiscount: boolean
  position:   number
}

export type CreatePersonInput = {
  name:         string
  isPayer:      boolean
  venmoHandle?: string
  zelleContact?: string
}

export type UpsertAssignmentsInput = {
  lineItemId: string
  personIds:  string[]  // replaces all current assignments for this item
}
```

---

## Key Relationships

```
Bill (1) ──── (many) Receipt
Bill (1) ──── (many) Person
Receipt (1) ──── (many) LineItem
LineItem (many) ──── (many) Person  [via Assignment]
```

- **People are scoped to a Bill**, not a Receipt. A person participates in
  the whole bill and can have items assigned from any receipt in that bill.
- **Assignments link LineItem ↔ Person.** The split count for an item is
  derived by counting `assignments` rows for that `lineItemId`.
- **Tax/tip fields are nullable on Receipt.** Flat receipts (loans, uber fares
  with no tax) simply have `null` — the calculation engine treats null as 0.
- **Discounts are LineItems** with `isDiscount: true` and a positive `price`.
  The engine subtracts them. This keeps the receipt display unified.

---

## Common Prisma Queries

```typescript
import { prisma } from '@/lib/prisma'

// Fetch a full bill with everything needed for the calculation engine
const bill = await prisma.bill.findUniqueOrThrow({
  where: { id: billId },
  include: {
    receipts: {
      include: {
        lineItems: {
          include: { assignments: true },
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { position: 'asc' },
    },
    people: {
      include: { assignments: true },
    },
  },
})

// Create a bill with its first receipt and line items (single transaction)
const bill = await prisma.bill.create({
  data: {
    name: input.name,
    receipts: {
      create: {
        totalAmount: input.receipt.totalAmount,
        subtotal:    input.receipt.subtotal,
        taxAmount:   input.receipt.taxAmount,
        tipAmount:   input.receipt.tipAmount,
        taxRate:     input.receipt.taxRate,
        tipRate:     input.receipt.tipRate,
        ocrRaw:      input.receipt.ocrRaw,
        lineItems: {
          create: input.receipt.lineItems.map((li, i) => ({
            name:       li.name,
            price:      li.price,
            isDiscount: li.isDiscount,
            position:   i,
          })),
        },
      },
    },
  },
  include: { receipts: { include: { lineItems: true } } },
})

// Upsert assignments for a line item (replace all existing)
await prisma.$transaction([
  prisma.assignment.deleteMany({ where: { lineItemId } }),
  prisma.assignment.createMany({
    data: personIds.map(personId => ({ lineItemId, personId })),
  }),
])

// Mark bill complete
await prisma.bill.update({
  where: { id: billId },
  data:  { status: 'COMPLETE' },
})
```

---

## Phase 2 Notes

- `Event` model is in the schema from day one but `eventId` is null for all Phase 1 bills.
- When Phase 2 ships, creating an Event and linking Bills to it is additive — no migration
  of existing data needed.
- Person matching across Bills within an Event is done by `name` (case-insensitive) for
  the debt simplification algorithm. A future phase may add a proper `EventParticipant`
  join table for more robust matching.