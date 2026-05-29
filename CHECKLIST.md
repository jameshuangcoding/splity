# Splity MVP — Implementation Checklist

Work through these phases in order. Each phase is a self-contained unit — get approval before starting the next one.

**Status key:** 🔲 Not started · 🔄 In progress · ✅ Done

---

## Phase 0 — Project Scaffolding ✅

> Stand up the repo from zero. After this phase `npm run dev` starts without errors and the design tokens render correctly in browser.

- [x] `npx create-next-app@14` with App Router, TypeScript, Tailwind CSS v4, ESLint
- [x] Design tokens in `app/globals.css` via Tailwind v4 `@theme` + `[data-theme]` dark/light vars
- [x] Add Google Fonts in `app/layout.tsx`: **Hanken Grotesk** (400–800) + **JetBrains Mono** (tabular nums)
- [x] Install and initialize **shadcn/ui** (v4 compatible)
- [x] Install **Zustand 5**, **Prisma 6**, **@supabase/ssr**
- [x] Create `.env.local.example` with all required variable names
- [x] Add PWA manifest at `public/manifest.json` with meta tags in `app/layout.tsx`
- [x] Security headers in `next.config.mjs`
- [x] Zustand store (`stores/bill-store.ts`), Prisma singleton, Supabase clients, shared types

---

## Phase 1 — Data Layer 🔄

> Schema and API skeletons before any UI. After this phase Prisma Studio shows correct tables and `compute()` is testable with sample data.

- [ ] Write `prisma/schema.prisma`: `Bill`, `LineItem`, `Person`, `Assignment` models with correct relations
- [ ] `npx prisma migrate dev` against Supabase Postgres
- [ ] Lift `compute()` + `toCSV()` from `prototype/splity-data.jsx` into `lib/calculation/engine.ts` (TypeScript port, no logic changes)
- [ ] API route skeleton: `app/api/bills/route.ts` (GET/POST stubs)
- [ ] API route skeleton: `app/api/ocr/route.ts` (POST stub)
- [ ] API route skeleton: `app/api/auth/route.ts` (stub)
- [ ] `lib/supabase.ts` — Supabase client singleton
- [ ] Supabase Auth scaffold: `/login` and `/signup` pages exist (no feature gates in Phase 1)

---

## Phase 2 — UI Foundation 🔲

> Build the chrome and shared atoms used by every screen. After this phase the app shell renders with correct TopBar, theme toggle, and dock.

- [ ] `lib/store.ts` — Zustand store with full shape: `step`, `theme`, `name`, `receipt`, `people`, `assignments`
- [ ] `components/TopBar.tsx` — 6 progress segments + back chevron + theme toggle (sun/moon)
- [ ] `components/Ava.tsx` — gradient avatar with `shade()` helper; sm / lg / ghost / off variants; overlapping stack
- [ ] `components/Money.tsx` — animated count-up, cubic ease 520ms, respects `prefers-reduced-motion`
- [ ] `components/ScreenHead.tsx` — eyebrow / title / sub block
- [ ] `components/Dock.tsx` — bottom CTA dock with gradient fade-to-background
- [ ] `app/layout.tsx` — theme toggle wires to `data-theme` on `<html>` (**instant snap — no CSS color transitions**)
- [ ] `app/page.tsx` — `<StepRouter>` client component that reads `step` from store and renders the correct screen

---

## Phase 3 — Home Screen (Step 0) 🔲

> User can name the expense and advance to receipt capture.

- [ ] Brand row: Splity logo mark SVG + "Splity" wordmark + "no account needed" chip
- [ ] Hero headline: "Split a bill, down to the cent." (38px / 800)
- [ ] "This bill" card: large expense-name input (19px/700) + 3-up stat row (Items · People · Total)
- [ ] Info line: "Under 2 minutes from scan to settled."
- [ ] Dock: "Scan a receipt" CTA (camera icon, primary) + "Enter manually" CTA (ghost, edit icon)
- [ ] Both CTAs advance `step` to 1; expense name writes to Zustand `name`

---

## Phase 4 — Receipt Review Screen (Step 1) + OCR 🔲

> User scans or manually enters a receipt; all values are editable before proceeding.

- [ ] `app/api/ocr/route.ts` — POST multipart image → Tabscanner → return structured JSON (API key stays server-side)
- [ ] Camera capture: `<input type="file" accept="image/*" capture="environment">` for mobile
- [ ] File upload fallback (JPG, PNG, HEIC, PDF)
- [ ] Receipt image slot with place name and item count
- [ ] Editable items list: tap to edit name or price inline; add / delete items
- [ ] Totals card: Subtotal (editable) · Tax + rate chip `8.8%` (editable amount, derived rate) · Tip + rate chip (editable amount, derived rate) · Discount (editable, shown negative in accent) · Total (read-only, derived)
- [ ] Tax/tip rate chips update live as amounts change: `(amount / subtotal * 100).toFixed(1)%`
- [ ] Manual entry mode: all fields entered by hand with no image
- [ ] Info note: "Rates derived from printed amounts, not assumed percentages."
- [ ] All values write back to Zustand `receipt`; dock CTA "Looks right →" advances to step 2

---

## Phase 5 — People Screen (Step 2) 🔲

> User adds participants. "You" is always the payer.

- [ ] Add-name text input + square accent "+" button
- [ ] People list card: colored `<Ava>` + name (16px/700) + `payer` chip (for You) or × remove button
- [ ] "You" row always present, payer flag set, cannot be removed
- [ ] New people assigned next color from palette: `#ff7a4d · #3ddc97 · #5b8cff · #c084fc` (cycle)
- [ ] "Recent" section: quick-add name chips (e.g. Diego, Sam, Aisha, Theo)
- [ ] People array writes to Zustand `people`; dock CTA "Next · assign items →" advances to step 3

---

## Phase 6 — Assign Screen (Step 3) 🔲

> The core screen. Every assignment triggers a live recalculation.

- [ ] Compact header: eyebrow + "Who had what?" + `n/m assigned` chip
- [ ] Horizontal live rail: each person as `<Ava>` + `<Money>` running total beneath (animates on change)
- [ ] Items card: each row = item name + price + avatar stack (assigned) or "tap to assign" chip (unassigned); `÷N ea` label when split
- [ ] Tap item row → open `AssignSheet` bottom sheet
- [ ] `AssignSheet`: item name + price + split note; 2-col grid of person toggles (selected = accent tint + check); "Everyone" ghost button + "Done" primary button
- [ ] "Everyone" selects all people in one tap
- [ ] "Done" applies selection → recomputes via `compute()` → updates Zustand `assignments`
- [ ] "Split the remaining N evenly" line button appears when `!calc.fullyAssigned`
- [ ] Sheet entrance animation: `scale(0.965 → 1)` from bottom + scrim fade
- [ ] Dock CTA "See the breakdown →" advances to step 4

---

## Phase 7 — Summary Screen (Step 4) 🔲

> Full per-person math shown; totals must sum to receipt exactly.

- [ ] Hero total card: subtle accent-tint→surface gradient; expense name eyebrow; grand total `<Money>` 40px/800 with count-up; green "✓ matches receipt" chip; place + "split N ways"
- [ ] One expandable card per person: `<Ava>` (lg) + name + `payer` chip + item count + total (22px/700) + chevron
- [ ] Chevron rotates on expand; first person expanded by default
- [ ] Expanded content: each assigned item with `÷N` share and per-person price; dashed divider; Item subtotal / +tax X.X% / +tip X.X% / −discount lines; payer rounding note ("Absorbs rounding remainder so the split sums exactly.")
- [ ] Dock CTA "Send payment requests" (send icon) advances to step 5

---

## Phase 8 — Send Screen (Step 5) 🔲

> Generate payment requests and export.

- [ ] Title "Collect what you're owed" + memo chip `memo · "<expense name>"`
- [ ] Per non-payer card: `<Ava>` + name + amount (21px/700)
- [ ] Button row per person: **Venmo** · **Zelle** · **Copy** (icon-only buttons)
- [ ] Venmo: opens deep link `venmo://paycharge?txn=pay&recipients=@user&amount=XX.XX&note=<name>`
- [ ] Zelle: Web Share API with pre-filled message; clipboard fallback
- [ ] Copy: writes `"<name> — $X.XX"` to clipboard
- [ ] After action: row shows green "✓ venmo sent" / "✓ zelle sent" / "✓ copied" status
- [ ] Toast notification: flashes near bottom, auto-dismisses after 1.9s
- [ ] Dock: "Export to CSV" ghost CTA → `toCSV()` client-side → Blob download as `<expense-name>.csv`
- [ ] Dock: "Done · new bill" primary CTA → resets Zustand store → back to step 0

---

## Phase 9 — Persistence 🔲

> Bills are saved to Supabase so Phase 2 account-linking is a data migration, not a rebuild.

- [ ] `POST /api/bills` — saves bill (receipt + items + people + assignments) via Prisma → Supabase
- [ ] `GET /api/bills/[id]` — retrieves a saved bill by ID
- [ ] Trigger `POST /api/bills` on transition from Summary → Send (bill is fully assigned and complete)
- [ ] Store returned bill `id` in Zustand (useful for share links in Phase 2)
- [ ] Auth scaffold complete: `/login` and `/signup` pages functional via Supabase Auth; no feature in Phase 1 requires login

---

## Phase 10 — Polish, PWA & Deploy 🔲

> Ship it.

- [ ] End-to-end flow test with real restaurant receipts on mobile (iPhone Safari)
- [ ] `prefers-reduced-motion`: disable `<Money>` count-up and entrance/sheet animations
- [ ] Service worker / offline shell (via `next-pwa` or Workbox)
- [ ] Vercel deployment: connect repo, configure env vars, Supabase Postgres connection string
- [ ] Lighthouse PWA audit ≥ 90
- [ ] Verify CSV export produces clean importable file matching receipt data
- [ ] Verify bill total always matches receipt total exactly (payer rounding rule)
