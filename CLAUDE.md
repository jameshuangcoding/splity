# CLAUDE.md

## Project Status
Splity is in **pre-implementation phase**. Design handoff is complete; Next.js codebase not yet scaffolded. `prototype/` is the visual/logic source of truth — not code to ship.

## Tech Stack
Next.js 14 (App Router) · PostgreSQL via Supabase · Prisma 6 ORM · Supabase Auth · Tailwind CSS v4 + shadcn/ui · Zustand 5 · Tabscanner OCR (proxied) · Vercel hosting

## Architecture

**API routes:** All external keys are server-side only. `/api/ocr` → Tabscanner, `/api/bills` → Prisma/Supabase, `/api/auth` → Supabase Auth.

**Zustand store (6-step flow):**
```ts
{
  step: 0–5,
  theme: 'dark' | 'light',
  name: string,
  receipt: { subtotal, tax, tip, discount, total, place, items: [{ id, name, price }] },
  people: [{ id, name, initial, color, payer: bool }],
  assignments: { itemId: [personId, …] },
}
```

**Flow:** `Home → Receipt Review → People → Assign → Summary → Send`

## Calculation Engine
**Do not re-derive.** Lift `compute()` and `toCSV()` directly from `prototype/splity-data.jsx` into `lib/calculation/engine.ts`.

```
taxRate = receipt.tax / receipt.subtotal
tipRate = receipt.tip / receipt.subtotal
personItemSub = Σ (item.price / item.assignees.length)
personDiscount = receipt.discount × (personItemSub / receipt.subtotal)
personTotal = personItemSub × (1 + taxRate + tipRate) − personDiscount
payerTotal = round2(receipt.total − Σ(other rounded totals))  // absorbs rounding remainder
```

## Critical Gotchas
- **Theme must snap, not transition.** Never add CSS transitions on themed color/background — causes stuck-state bug.
- **Payment deep links:** Venmo `venmo://paycharge?txn=pay&recipients=@user&amount=XX.XX&note=<name>`. Expense name is always the memo.
- **Multi-assign = equal N-way split only.** Custom % splits are Phase 2.
- **Auth is scaffolded, not enforced in Phase 1.** Don't gate any feature behind login. Sessions persist to DB from day one.
- **OCR:** Free tier = 200 scans/month. Always proxy via `/api/ocr`.

## GitHub Standards
- Use conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`)

## Skills — Check Before Working
| Area | Skill |
|---|---|
| Files / packages / architecture | `splity-stack` |
| Prisma queries / TS types | `splity-data-model` |
| Split math | `splity-calculation-engine` |
| API routes | `splity-api-conventions` |
| UI components | `splity-frontend-design` |
