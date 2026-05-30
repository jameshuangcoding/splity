# Splity MVP — Implementation Checklist

Work through these phases in order. Each phase is a self-contained unit — get approval before starting the next one.

**Status key:** 🔲 Not started · 🔄 In progress · ✅ Done

> **TDD rule (all phases from here on):** write tests first, implement to green, then commit. Minimum 80% coverage per phase. Run `npm test` before every PR.

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

**Tests (retrofitted):**
- [x] Jest + Playwright infra configured (`jest.config.ts`, `playwright.config.ts`, `npm test` / `test:coverage` / `test:e2e` scripts)
- [x] `stores/bill-store` — step clamping, theme toggle, name, reset (11 tests)

---

## Phase 1 — Data Layer ✅

> Schema and API skeletons before any UI. After this phase Prisma Studio shows correct tables and `compute()` is testable with sample data.

- [x] Write `prisma/schema.prisma`: `Bill`, `LineItem`, `Person`, `Assignment` models with correct relations
- [x] `npx prisma migrate dev` against Supabase Postgres
- [x] Lift `compute()` + `toCSV()` from `prototype/splity-data.jsx` into `lib/calculation/engine.ts` (TypeScript port, no logic changes)
- [x] API route skeleton: `app/api/bills/route.ts` (GET/POST stubs)
- [x] API route skeleton: `app/api/ocr/route.ts` (POST stub)
- [x] API route skeleton: `app/api/auth/route.ts` (stub)
- [x] `lib/supabase.ts` — Supabase client singleton
- [x] Supabase Auth scaffold: `/login` and `/signup` pages exist (no feature gates in Phase 1)

**Tests (retrofitted — 85 tests, 97.8% statements, 83.3% branches):**
- [x] `lib/calculation/engine` — `round2`, `compute` (happy path + 6 edge cases), `toCSV` (24 tests)
- [x] `lib/utils` — `cn`, `formatCurrency`, `handleError` (all 4 error types) (10 tests)
- [x] `app/api/bills` — POST valid/invalid (5 tests)
- [x] `app/api/bills/[billId]` — GET/PATCH/DELETE + 404 handling (7 tests)
- [x] `app/api/bills/[billId]/assignments` — PUT valid/invalid/unassign + DELETE (5 tests)
- [x] `app/api/bills/[billId]/people` + `[personId]` — POST/PATCH/DELETE (7 tests)
- [x] `app/api/bills/[billId]/receipts` + `[receiptId]` — POST/PATCH/DELETE (7 tests)
- [x] `app/api/ocr` — no file / no key / success / 502 (4 tests)
- [x] `e2e/smoke.spec.ts` — Playwright config + smoke tests wired up

---

## Phase 2 — UI Foundation ✅

> Build the chrome and shared atoms used by every screen. After this phase the app shell renders with correct TopBar, theme toggle, and dock.

- [x] `stores/bill-store.ts` — Zustand store with full shape: `step`, `theme`, `name`, `receipt`, `people`, `assignments` (already complete from Phase 0)
- [x] `components/splity/TopBar.tsx` — 6 progress segments + back chevron + theme toggle (sun/moon)
- [x] `components/splity/Ava.tsx` — gradient avatar with `shade()` helper; sm / lg / ghost / off variants; overlapping stack
- [x] `components/splity/Money.tsx` — animated count-up, cubic ease 520ms, respects `prefers-reduced-motion`
- [x] `components/splity/ScreenHead.tsx` — eyebrow / title / sub block
- [x] `components/splity/Dock.tsx` — bottom CTA dock with gradient fade-to-background
- [x] `components/splity/Icon.tsx` — full SVG icon set (back, fwd, camera, edit, sun, moon, send, etc.)
- [x] `app/layout.tsx` — theme toggle wires to `data-theme` on `<html>` (**instant snap — no CSS color transitions**)
- [x] `app/page.tsx` — `<StepRouter>` client component that reads `step` from store and renders the correct screen
- [x] **Tests:** TopBar renders correct segments; Ava gradient; Money count-up; theme snap (no CSS transition); component renders at 390px viewport (45 tests, all passing)

---

## Phase 3 — Home Screen (Step 0) ✅

> User can name the expense and advance to receipt capture.

- [x] Brand row: Splity logo mark SVG + "Splity" wordmark + "no account needed" chip
- [x] Hero headline: "Split a bill, down to the cent." (38px / 800)
- [x] "This bill" card: large expense-name input (19px/700) + 3-up stat row (Items · People · Total)
- [x] Info line: "Under 2 minutes from scan to settled."
- [x] Dock: "Scan a receipt" CTA (camera icon, primary) + "Enter manually" CTA (ghost, edit icon)
- [x] Both CTAs advance `step` to 1; expense name writes to Zustand `name`
- [x] **Tests:** 19 tests, 100% coverage (statements/branches/functions/lines)

---

## Phase 4 — Receipt Review Screen (Step 1) + OCR ✅

> User scans or manually enters a receipt; all values are editable before proceeding.

- [x] `app/api/ocr/route.ts` — POST multipart image → Tabscanner → return structured JSON (API key stays server-side)
- [x] Camera capture: `<input type="file" accept="image/*" capture="environment">` for mobile
- [x] File upload fallback (JPG, PNG, HEIC, PDF)
- [x] Receipt image slot with place name and item count
- [x] Editable items list: tap to edit name or price inline; add / delete items
- [x] Totals card: Subtotal (editable) · Tax + rate chip `8.8%` (editable amount, derived rate) · Tip + rate chip (editable amount, derived rate) · Discount (editable, shown negative in accent) · Total (read-only, derived)
- [x] Tax/tip rate chips update live as amounts change: `(amount / subtotal * 100).toFixed(1)%`
- [x] Manual entry mode: all fields entered by hand with no image
- [x] Info note: "Rates derived from printed amounts, not assumed percentages."
- [x] All values write back to Zustand `receipt`; dock CTA "Looks right →" advances to step 2
- [x] `lib/ocr.ts` — `normalizeOcrResponse()` maps Tabscanner JSON → StoreReceipt (handles nested result, fallback field names, string numbers, zero-price filtering)
- [x] **Tests:** 48 screen tests + 19 OCR normalizer tests; 201 total passing

---

## Phase 5 — People Screen (Step 2) ✅

> User adds participants. "You" is always the payer.

- [x] Add-name text input + square accent "+" button
- [x] People list card: colored `<Ava>` + name (16px/700) + `payer` chip (for You) or × remove button
- [x] "You" row always present, payer flag set, cannot be removed
- [x] New people assigned next color from palette: `#ff7a4d · #3ddc97 · #5b8cff · #c084fc` (cycle)
- [x] "Recent" section: quick-add name chips (e.g. Diego, Sam, Aisha, Theo)
- [x] People array writes to Zustand `people`; dock CTA "Next · assign items →" advances to step 3
- [x] **Tests:** 23 tests, 100% coverage (statements/branches/functions/lines)

---

## Phase 6 — Assign Screen (Step 3) ✅

> The core screen. Every assignment triggers a live recalculation.

- [x] Compact header: eyebrow + "Who had what?" + `n/m assigned` chip
- [x] Horizontal live rail: each person as `<Ava>` + `<Money>` running total beneath (animates on change)
- [x] Items card: each row = item name + price + avatar stack (assigned) or "tap to assign" chip (unassigned); `÷N ea` label when split
- [x] Tap item row → open `AssignSheet` bottom sheet
- [x] `AssignSheet`: item name + price + split note; 2-col grid of person toggles (selected = accent tint + check); "Everyone" ghost button + "Done" primary button
- [x] "Everyone" selects all people in one tap
- [x] "Done" applies selection → recomputes via `compute()` → updates Zustand `assignments`
- [x] "Split the remaining N evenly" line button appears when `!calc.fullyAssigned`
- [x] Sheet entrance animation: `scale(0.965 → 1)` from bottom + scrim fade
- [x] Dock CTA "See the breakdown →" advances to step 4
- [x] **Tests:** `AssignScreen` + `AssignSheet` — 34 tests, 98.6% statement / 93.75% branch coverage

---

## Phase 7 — Summary Screen (Step 4) ✅

> Full per-person math shown; totals must sum to receipt exactly.

- [x] Hero total card: subtle accent-tint→surface gradient; expense name eyebrow; grand total `<Money>` 40px/800 with count-up; green "✓ matches receipt" chip; place + "split N ways"
- [x] One expandable card per person: `<Ava>` (lg) + name + `payer` chip + item count + total (22px/700) + chevron
- [x] Chevron rotates on expand; first person expanded by default
- [x] Expanded content: each assigned item with `÷N` share and per-person price; dashed divider; Item subtotal / +tax X.X% / +tip X.X% / −discount lines; payer rounding note ("Absorbs rounding remainder so the split sums exactly.")
- [x] Dock CTA "Send payment requests" (send icon) advances to step 5
- [x] **Tests:** `SummaryScreen` — per-person totals sum to receipt total exactly; expand/collapse cards; payer rounding note present; `<Money>` count-up renders; dock CTA advances step to 5; 80%+ coverage (100% stmts/funcs/lines, 80% branches, 29 tests)

---

## Phase 8 — Send Screen (Step 5) ✅

> Generate payment requests and export.

- [x] Title "Collect what you're owed" + memo chip `memo · "<expense name>"`
- [x] Per non-payer card: `<Ava>` + name + amount (21px/700)
- [x] Button row per person: **Venmo** · **Zelle** · **Copy** (icon-only buttons)
- [x] Venmo: opens deep link `venmo://paycharge?txn=pay&recipients=@user&amount=XX.XX&note=<name>`; gates success chip on `window.open` return value
- [x] Zelle: Web Share API with pre-filled message; clipboard fallback; no false success when both APIs absent
- [x] Copy: writes `"<name> — $X.XX"` to clipboard; guards with existence check + try/catch
- [x] After action: row shows green "✓ venmo sent" / "✓ message ready" / "✓ copied" status
- [x] Toast notification: flashes near bottom, auto-dismisses after 1.9s; `aria-live="polite"` for screen readers
- [x] Dock: "Export to CSV" ghost CTA → `toCSV()` client-side → Blob download as `<expense-name>.csv`
- [x] Dock: "Done · new bill" primary CTA → resets Zustand store → back to step 0
- [x] **Tests:** 38 tests, 84.6% branch / 100% stmt coverage; Venmo deep link format, null gate, clipboard copy, clipboard guard, CSV download, toast a11y, store reset; 331 total passing

---

## Phase 9 — Persistence 🔲

> Bills are saved to Supabase so Phase 2 account-linking is a data migration, not a rebuild.

- [ ] `POST /api/bills` — saves bill (receipt + items + people + assignments) via Prisma → Supabase
- [ ] `GET /api/bills/[id]` — retrieves a saved bill by ID
- [ ] Trigger `POST /api/bills` on transition from Summary → Send (bill is fully assigned and complete)
- [ ] Store returned bill `id` in Zustand (useful for share links in Phase 2)
- [ ] Auth scaffold complete: `/login` and `/signup` pages functional via Supabase Auth; no feature in Phase 1 requires login
- [ ] **Tests:** `POST /api/bills` full payload (receipt + items + people + assignments); `GET /api/bills/[id]`; save triggered on Summary → Send transition; bill `id` written to Zustand; 80%+ coverage

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
- [ ] **Tests:** `prefers-reduced-motion` disables `<Money>` count-up; E2E full flow (Home → Send) with real data; CSV export produces correct importable file; 80%+ coverage
