# Splity — Product Requirements Document

**Version:** 0.3  
**Date:** May 2026  
**Status:** In Review  
**Platform:** Web (mobile-first, PWA)

---

## 1. Overview

Splity is a mobile-first web application that eliminates the manual, error-prone work of splitting bills and reconciling shared expenses. Inspired by Flighty's philosophy of making a complex, data-heavy process feel effortless and well-designed, Splity does the same for group expenses.

Starting as a personal bill calculator, it grows into a full group expense manager capable of handling multi-payer trip settlements, receipt scanning with OCR, direct payment link generation via Venmo and Zelle, and CSV export for spreadsheet workflows.

The core insight: splitting a bill accurately requires more than division. Tax, tip, and discounts must be derived from the actual printed receipt values — never assumed percentages — and allocated proportionally to each person's item subtotal. Splity makes this automatic, transparent, and editable.

---

## 2. Problem Statement

Current approaches to splitting bills are broken in predictable ways:

- Manually dividing totals ignores per-item tax/tip allocation, producing unfair splits.
- Spreadsheets (Excel/Google Sheets) require significant formatting work, are not scannable, and are not mobile-friendly.
- Existing apps (Splitwise, Venmo) lack receipt OCR with editable line-item parsing, or require all parties to have accounts.
- Most tools apply tip/tax as a flat assumed percentage rather than deriving the actual rate from the receipt — this is mathematically inaccurate.
- After a group trip, the organizer spends hours cross-referencing receipts, running formulas, and chasing people for payment.

---

## 3. Goals & Non-Goals

### Goals

- Replace personal spreadsheet workflows with a fast, accurate, and enjoyable bill calculator.
- Support receipt scanning with full OCR: line items, subtotal, tax, tip broken out and editable.
- Derive tip and tax rates from actual receipt amounts — not assumed percentages.
- Allow any OCR value to be manually corrected before calculation.
- Assign line items to individuals with proportional allocation of tax/tip/discount.
- Generate Venmo and Zelle payment links pre-filled with the correct amount and memo.
- Export any bill or event to CSV for use in Google Sheets.
- Full-stack application: PostgreSQL database, REST API, authentication scaffolded from day one.
- Be fully usable without a login enforced for Phase 1 (auth wired up but not gated).
- Scale to a public multi-user product in future phases.

### Non-Goals (Phase 1)

- Native iOS / Android app (web + PWA only; native conversion is Phase 3).
- Auth enforced / login required (scaffolded but not gated in Phase 1).
- Bank or card integrations.
- Real-time collaborative editing (Phase 2+).
- Currency conversion or international tax rules.
- Custom percentage splits on shared items (Phase 2+).
- Session persistence / draft saving (Phase 2).

---

## 4. Target Users

### Phase 1 — Personal Use
A single user who regularly pays for group dinners and trips, then calculates who owes what. This user scans receipts, assigns items to people, and sends payment requests. The goal is to fully replace their Google Sheets workflow.

### Phase 2 — Small Groups
Groups of 2–10 people sharing expenses on trips or recurring occasions. Multiple people may pay for different things; the app settles net balances with the minimum number of transactions.

### Phase 3 — Public Product
A general-purpose bill splitting product with accounts, history, group management, and social payment integrations.

---

## 5. Feature Specification — Phase 1 (MVP)

### 5.1 Receipt Scanning & OCR

The user photographs or uploads a receipt image. The system sends it to the OCR API and returns structured data, which the user reviews and edits before proceeding.

**OCR Output Fields**

| Field | Description | Editable? |
|---|---|---|
| Line Items | Name + price for each item on the receipt | Yes |
| Subtotal | Sum of all line items before tax/tip | Yes |
| Tax Amount | Dollar amount of tax as printed | Yes |
| Tip Amount | Dollar amount of tip as printed | Yes |
| Discount(s) | Any discount lines (negative values) | Yes |
| Total | Final total (calculated, used for validation) | Read-only |

After scan, every field is editable. The user can correct misreads, add missed items, or remove erroneous lines before proceeding.

**Supported input types:**
- Camera capture (mobile) — primary use case
- Image upload (JPG, PNG, HEIC)
- PDF upload

**Fallback:** Manual entry mode when no receipt is available (enter items, subtotal, tax, tip by hand).

**OCR Vendor Decision: Tabscanner (MVP) → Google Document AI (at scale)**

See Section 9 (OCR Vendor Evaluation) for the full analysis. Summary:

- **Phase 1:** Tabscanner — free tier of 200 scans/month, purpose-built for receipts, structured JSON output, fastest integration, under 2 seconds per scan.
- **Phase 2+:** Migrate to Google Document AI — 1,000 free pages/month permanent free tier, 92% field accuracy, and better long-term scalability at $1.50/1,000 pages.

---

### 5.2 Tax, Tip & Discount Calculation Logic

This is the core calculation engine. All rates are derived from actual receipt values — never assumed or defaulted.

#### Tip Rate

```
Tip Rate = Tip Amount (from receipt) ÷ Subtotal
```

This is the only accurate method. The printed tip amount reflects the exact gratuity left, and back-calculating the rate from it ensures proportional allocation matches reality. A 20% tip on a $47.38 subtotal may yield a "real" tip rate of 19.83% — using the actual amount rather than an assumed 20% keeps the math precise.

#### Tax Rate

```
Tax Rate = Tax Amount (from receipt) ÷ Subtotal
```

Applied proportionally per person using the same method.

#### Per-Person Total Formula

```
Person Total =
  (Person Item Subtotal)
  + (Person Item Subtotal × Tax Rate)
  + (Person Item Subtotal × Tip Rate)
  − (Allocated Discount)
```

#### Discount Handling

Discounts are always applied **proportionally** — the discount reduces each person's share based on their item subtotal as a percentage of the total subtotal. This is consistent with how tax and tip are applied and requires no UI decision from the user.

```
Person Discount = Total Discount × (Person Item Subtotal ÷ Total Subtotal)
```

Exception: if a discount is clearly tied to a specific line item (e.g. a coupon for one item), the user can mark it as item-specific during the receipt edit step, and it is applied only to that item's assigned person.

#### Rounding

Cent-level remainders from proportional allocation are assigned to **the payer** (the person who paid the bill and is collecting reimbursements). Rationale: the payer typically receives credit card points or cashback on the full amount, making a 1–2¢ rounding benefit appropriate. All other participants' totals round to the nearest cent; the payer absorbs any remainder so the sum always equals the receipt total exactly.

---

### 5.3 Item-to-Person Assignment

After the receipt is confirmed, the user adds the names of people in the group. Each line item is then assigned to one or more people.

**Assignment rules:**
- Default: all items unassigned (visual warning shown).
- Tap/click a line item → assign to one person.
- Multi-assign: an item can be marked as shared among multiple people — always split equally among them (custom percentage is Phase 2+).
- A "split among all" shortcut assigns an item equally to everyone in the group.
- Progress indicator: "9 of 14 items assigned."
- Unassigned items at calculation time: user is prompted to either assign them or auto-split equally among all.

---

### 5.4 Summary & Payment Requests

Once items are assigned, the app displays a per-person breakdown and generates payment links.

**Per-person summary shows:**
- List of items assigned to them
- Their item subtotal
- Their allocated tax
- Their allocated tip
- Their allocated discount (if any)
- **Their total owed**

**Payment links:**

| Method | Input Required | Output |
|---|---|---|
| Venmo | Venmo username or phone number | Deep link: `venmo://paycharge?txn=pay&recipients=@user&amount=XX.XX&note=...` |
| Zelle | Phone number or email | Pre-filled share message with amount and payment details |
| Copy | None | Amount + memo copied to clipboard |

**Memo / note content:** The default memo pre-filled in all payment links is the **name of the expense or event** as entered by the user (e.g. `East Asia Apr-May '26`). This makes it immediately recognizable in the recipient's payment app history.

Payment contact info (Venmo handle, phone, email) is stored in the database associated with the bill session — not ephemeral, but not exposed to other users in Phase 1.

---

### 5.5 CSV Export

Every completed bill can be exported as a CSV file, downloadable directly in the browser. This serves as the bridge to existing Google Sheets workflows and is a deliberate feature differentiator — most splitting apps have no data export.

**CSV columns:**
- Person name
- Item(s) assigned to them
- Item subtotal
- Allocated tax
- Allocated tip
- Allocated discount
- **Total owed**

The export is triggered from the summary screen and downloads instantly — no server round-trip needed (generated client-side from current state).

For Phase 2 events (multiple receipts), the CSV export will include a per-receipt breakdown and a net settlement summary row.

---

## 6. Feature Specification — Phase 2 (Group Events)

### 6.1 Events

An "Event" groups multiple receipts, multiple payers, and multiple participants. Example: a 5-day trip where 4 people each paid for various dinners, transport, and accommodation.

- Create an event with a name, date range, and participant list.
- Add receipts to the event; each receipt has one designated payer.
- Each receipt is itemized and assigned to participants.
- The app computes net balances and minimizes the number of transactions needed to settle all debts.

### 6.2 Balance Settlement (Debt Simplification)

After all receipts are entered, the app calculates the minimum set of payments to fully settle all balances (greedy debt-simplification algorithm). Each participant sees a clear summary:

> "You owe Alex $32.50"  
> "Jordan owes you $18.00"

### 6.3 Session Persistence / Drafts

Users can save an in-progress expense as a draft and resume it later — either via account login or a shareable draft link. Scoped to Phase 2 but the data model supports it from Phase 1.

### 6.4 User Accounts (Auth Enforcement)

Auth is scaffolded in Phase 1 but not enforced. In Phase 2, users can log in to access expense history, saved groups, and stored payment info. Guest participation (link-based, no account required) is also supported.

---

## 7. UX & Design Principles

### Mobile-First

All screens are designed for a 390px viewport (iPhone 14) first. Desktop is an enhanced layout of the same design, not a redesign. Receipt scanning uses the native camera API on mobile. No feature is desktop-only.

### Flighty-Inspired Design Language

Like Flighty, Splity takes inherently complex, data-heavy content and presents it with clarity, confidence, and a premium feel. Key qualities:

- **Dense but not cluttered:** all the numbers are visible at once without overwhelming the user.
- **Clear visual hierarchy:** totals are prominent; line items recede; actions are obvious.
- **Immediate feedback:** every assignment, edit, or calculation updates the summary in real time.
- **Dark mode support** from day one.

### Core User Flow (Phase 1)

| Step | Screen | Action |
|---|---|---|
| 1 | Home | Start new bill — name the expense, scan or enter manually |
| 2 | Receipt Review | Edit OCR output: items, subtotal, tax, tip, discounts |
| 3 | People | Add names of participants |
| 4 | Assign | Tap items to assign to people |
| 5 | Summary | See per-person totals with all math shown |
| 6 | Send | Add Venmo/Zelle info, generate and share payment links, export CSV |

### Principles

- **Speed:** a simple dinner split should take under 2 minutes from scan to send.
- **Transparency:** every number is shown and explainable — no black boxes.
- **Editability:** every auto-detected value can be overridden at any time.
- **No friction:** Phase 1 does not require login to use.

---

## 8. Tech Stack

### Decision Summary

| Layer | Choice | Reasoning |
|---|---|---|
| Framework | Next.js 14 (App Router) | React-based, API routes built in, file-based routing, first-class Vercel support, best Claude Code compatibility |
| Database | PostgreSQL via Supabase | Managed Postgres, generous free tier, Row Level Security built in for future multi-user data isolation |
| ORM | Prisma | Type-safe queries, schema-as-source-of-truth, excellent migration tooling, Claude Code generates it well |
| Auth | Supabase Auth | Co-located with the database, handles email/password and OAuth (Google, Apple) with no extra infrastructure |
| Styling | Tailwind CSS + shadcn/ui | Mobile-first by default, fast to build with, shadcn gives polished primitives for the data-heavy UI |
| State | Zustand | Lightweight global store for the 6-step bill flow; avoids prop-drilling without Redux complexity |
| OCR | Tabscanner via Next.js API route | API key kept server-side in the API route; client never touches the key directly |
| Hosting | Vercel (frontend + API) + Supabase (DB + Auth) | Both have free tiers that cover personal use and early public launch; zero DevOps overhead |

### Architecture Overview

```
Browser (React / Next.js)
  ↓ fetch
Next.js API Routes (serverless)
  ├── /api/ocr        → proxies to Tabscanner (keeps API key server-side)
  ├── /api/bills      → CRUD for bill sessions (Prisma → Supabase Postgres)
  └── /api/auth       → Supabase Auth (scaffolded Phase 1, enforced Phase 2)

Supabase
  ├── PostgreSQL       → bills, line_items, people, assignments
  └── Auth             → user sessions (Phase 2 enforcement)
```

### Auth Strategy

Auth is **scaffolded in Phase 1, enforced in Phase 2.** This means:

- Supabase Auth is wired up and the login/signup UI exists from day one.
- In Phase 1, no feature is gated behind login — the app works fully without an account.
- Bill sessions are stored in the database from the start (not in-memory), so Phase 2 account linking is a data migration, not a rebuild.
- When Phase 2 ships, enforcement is a single middleware check, not a re-architecture.

### PWA Strategy

Splity ships as a Progressive Web App (PWA) from Phase 1. Native app conversion (React Native / Expo) is planned for Phase 3.

**Why PWA over native app first:**

| Factor | PWA | Native App |
|---|---|---|
| Accessibility | Shareable via URL, no download required | Requires App Store install |
| Updates | Deploy instantly, no review cycle | App Store review required |
| CSV export | Trivial browser download | More complex file handling |
| Camera | Works in mobile Safari + Chrome | Smoother native experience |
| Development speed | One codebase for web + mobile | Separate iOS/Android builds |
| Time to launch | Days | Weeks (App Store review) |

**Why not native-first (even though Flighty is app-only):**
Flighty requires deep iOS system integrations — Live Activities, lock screen widgets, calendar sync. Those are genuinely unavailable in PWAs. Splity's core loop (scan → assign → send) has no such requirement. PWA camera API is sufficient for receipt capture.

**Native conversion path:**
React Native with Expo. Since the codebase is already React, the component logic and calculation engine transfer directly. The UI layer is rebuilt in React Native; the API, database, and business logic are untouched.

---

## 9. OCR Vendor Evaluation

### Candidates Evaluated

| Vendor | Type | Free Tier | Paid Pricing | Accuracy (receipts) | Integration Complexity |
|---|---|---|---|---|---|
| **Tabscanner** | Receipt-specialized | 200 scans/month, permanent | ~$0.001–0.002/scan at scale | 99%+ (receipt-specific AI, since 2017) | Low — single REST call, structured JSON |
| **Google Document AI** | General document | 1,000 pages/month, permanent | $1.50/1,000 pages | 92% field-level | Medium — GCP setup required |
| **AWS Textract** | General document | 1,000 pages/3 months (then paid) | $1.50/1,000 pages | 93% field-level | Medium — AWS account + IAM setup |
| **Mindee** | Document-specialized | 14-day trial only, then paid | €49–€649/month subscription | High (line-item focused) | Low-Medium — clean API, but pricey |
| **Veryfi** | Receipt-specialized | No meaningful free tier | Enterprise pricing | High | Low — but cost-prohibitive at small scale |
| **Tesseract (OSS)** | Raw OCR only | Free (self-hosted) | Free | ~70–80% on clean text; requires custom parsing | High — no structured output, build from scratch |

### Recommendation

**Phase 1 (MVP): Tabscanner** — permanent free tier (200 scans/month), purpose-built receipt AI, structured JSON output in under 2 seconds, lowest integration friction.

**Phase 2+: Google Document AI** — 1,000 free pages/month permanent tier, $1.50/1,000 pages at scale, strong accuracy. Migrate when monthly scans approach 150–180 (near Tabscanner's free limit).

---

## 10. Open Questions — Resolved

| # | Question | Decision |
|---|---|---|
| 1 | OCR vendor | **Tabscanner** for Phase 1. Migrate to **Google Document AI** at scale. |
| 2 | Tip/tax rounding | Remainder cents assigned to **the payer**. All others round to nearest cent; sum always matches receipt exactly. |
| 3 | Discount allocation | Always **proportional** by default. Item-specific override available during receipt edit. |
| 4 | Multi-assign split | Always **equal N-way split**. Custom % allocation is Phase 2+. |
| 5 | Session persistence | **Phase 2**. Data model supports drafts from Phase 1 so migration is lightweight. |
| 6 | Payment memo | **The expense name** entered by the user (e.g. `East Asia Apr-May '26`). Auto-filled in all payment links. |
| 7 | Auth enforcement | **Scaffolded Phase 1, enforced Phase 2.** App works without login; database stores sessions from day one. |
| 8 | PWA vs native | **PWA first** for accessibility and launch speed. React Native / Expo conversion in Phase 3. |
| 9 | CSV export | **Phase 1 feature.** Client-side generation, browser download. Bridge to existing Google Sheets workflow. |

---

## 11. Phased Roadmap

| Phase | Name | Key Deliverables | Estimated Timeline |
|---|---|---|---|
| 1 — MVP | Personal Calculator | Next.js + Supabase setup, Prisma schema, auth scaffolded, receipt OCR (Tabscanner), editable line items, tax/tip/discount logic, item assignment, Venmo/Zelle links, CSV export, PWA | ~10–12 days |
| 2 | Group Events | Auth enforced, multi-receipt events, multi-payer, debt simplification, draft persistence, OCR migration to Google Document AI | Month 2–3 |
| 3 | Public Product + Native | Onboarding, social graph, recurring groups, history, notifications, React Native / Expo app | Month 4+ |

**Why 10–12 days for Phase 1 (not 1 week):**
Adding a real database, REST API, and auth scaffolding adds ~2–3 days over a sessionless prototype. The extra investment means Phase 2 is an additive build, not a re-architecture. Breakdown:
- Day 1: Stack setup, Supabase config, Prisma schema, auth skeleton
- Day 2: OCR integration + receipt review screen
- Day 3: People + assignment screen
- Day 4: Calculation engine + summary screen
- Day 5: Payment links + CSV export
- Day 6–7: End-to-end flow, PWA config, real receipt testing on device
- Day 8–10: Polish, edge cases, bug fixes, deployment

---

## 12. Success Metrics

### Phase 1
- Bill split calculated end-to-end in under 2 minutes from scan.
- OCR accuracy: > 90% of line items extracted without manual correction.
- Zero spreadsheet sessions needed for dinners or trips.
- CSV export produces a clean, importable file matching the receipt data.

### Phase 2+
- Correct net balances and minimum-transaction settlement for group events.
- Users return for the next group event without prompting.
- > 70% of splits result in a Venmo/Zelle link sent.

---

*End of Document — v0.3*