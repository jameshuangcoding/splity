# Handoff: Splity — Bill Split Flow (Phase 1 MVP)

## Overview
Splity is a mobile-first web app that splits a restaurant/group bill **down to the cent**.
This bundle documents the **Phase 1 "Linear Stepper" flow**: a guided, 6-step wizard that
takes a user from a scanned receipt to per-person totals and payment requests.

The whole point of the product is **accuracy + transparency**: tax and tip rates are *derived
from the printed receipt amounts* (never assumed percentages), allocated proportionally to each
person's assigned items, with rounding remainders absorbed by the payer so the sum always equals
the receipt total exactly.

The 6 steps: **Home → Receipt Review → People → Assign → Summary → Send.**

## About the Design Files
The files in this bundle are **design references built in HTML/React (via in-browser Babel)** —
prototypes that demonstrate the intended look, layout, math, and behavior. **They are not meant
to ship as-is.** The task is to **recreate these designs in the target codebase's environment.**

Per the product PRD the intended stack is **Next.js 14 (App Router) + Tailwind + shadcn/ui +
Zustand for the 6-step flow state**, with Supabase/Prisma on the backend. Implement the UI using
those established patterns. If you are working in a different environment, use its conventions —
the visual spec and the calculation engine below are framework-agnostic.

> ⚠️ The prototype uses plain CSS variables + hand-written components only because it runs as a
> single static HTML file. In the real app, map the **Design Tokens** section to your
> Tailwind/theme config and the **Components** to shadcn primitives.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, motion, and interactions are all specified.
Recreate the UI pixel-faithfully using the codebase's component library. Both **dark** and
**light** themes are designed and must be supported (dark is the default).

---

## Screens / Views

> Device target: **390–402px wide** mobile viewport (iPhone). The prototype renders inside a
> 402×874 device frame. All screens share a fixed chrome: a top bar (back chevron · 6-segment
> progress · theme toggle) and a bottom "dock" holding the primary CTA over a fade-to-background
> gradient. Body content scrolls between them.

### Shared chrome
- **Top bar** — pinned ~52px from top. Left: circular back button (hidden on Home). Center:
  6 progress segments (`height 4px`, `gap 5px`, radius 3px); completed + current = filled accent,
  upcoming = `--hairline-2`. Right: circular theme toggle (sun icon in dark, moon in light).
- **Dock** — bottom, `padding: 12px 18px 30px`, background `linear-gradient(to top, var(--bg) 56%, transparent)`.
  Holds 1–2 full-width CTAs.

### 1 · Home
- **Purpose**: Name the expense, start by scanning a receipt or entering manually.
- **Layout**: Brand row (logo mark + "Splity" wordmark + "no account needed" chip). Large headline
  "Split a bill, down to the cent." (`38px / 800`). Sub-paragraph (`15px`, `--text-dim`).
  A "This bill" **card** containing the expense-name input (large, `19px/700`) and a 3-up stat row
  (Items / People / Total). An info line ("Under 2 minutes from scan to settled.").
- **Dock**: `Scan a receipt` (primary, camera icon) + `Enter manually` (ghost, edit icon). Both
  advance to step 2 in the prototype.

### 2 · Receipt Review
- **Purpose**: Confirm/correct OCR output before calculating.
- **Layout**: Eyebrow "STEP 2 · REVIEW", title "Check the receipt", sub. A **source card**
  (receipt thumbnail placeholder + place/date + "Retake" button). An **items card**: one row per
  line item — name (`15px/600`) · edit-pencil affordance · price (mono, right-aligned). A
  **totals card**: Subtotal, Tax (+ derived-rate chip e.g. `8.8%`), Tip (+ rate chip e.g. `19.8%`),
  Discount (shown negative, accent color), divider, **Total** (bold `20px`). An info note explaining
  rates are derived from printed amounts.
- **Dock**: `Looks right →` (advances).
- **Editability (real app)**: every value here must be tappable-to-edit (items, subtotal, tax, tip,
  discount). Total is read-only/derived. The prototype shows the affordance but doesn't wire editing.

### 3 · People
- **Purpose**: Add the participants. "You" is the payer.
- **Layout**: Title "Who's splitting?", sub. An add-name input + square accent "+" button. A
  **people card**: one row per person — colored avatar, name (`16px/700`), and either a `payer`
  chip (for You) or a remove "×". A "Recent" section with quick-add name chips.
- **Dock**: `Next · assign items →`.

### 4 · Assign  *(the core screen)*
- **Purpose**: Assign each line item to one or more people; see totals update live.
- **Layout**: Compact header (eyebrow + "Who had what?" + `n/m` assigned chip). A horizontal
  **live rail**: each person as an avatar with their running total beneath it (mono, animates).
  An **items card**: each row is a button — item name + price (and `· $X.XX ea` when split),
  with the assigned avatars shown as an overlapping **avatar stack** on the right; unassigned rows
  show a `tap to assign` accent chip instead. When not all items are assigned, a
  `Split the remaining N evenly` line button appears.
- **Picker sheet**: tapping a row opens a **bottom sheet** — item name + price + split note
  ("split N ways · $X.XX each" / "whole item" / "unassigned"); a 2-column grid of person toggles
  (selected = accent tint + border + check, deselected = muted avatar); footer `Everyone` (ghost)
  + `Done` (primary). Selecting people updates assignments → recomputes everything.
- **Dock**: `See the breakdown →`.

### 5 · Summary
- **Purpose**: Show the full per-person math; verify it sums to the receipt.
- **Layout**: Title "Here's the split", sub. A **hero total card** (subtle accent-tint→surface
  gradient): expense name eyebrow, grand total (`40px/800`, animated count-up), a green
  `✓ matches receipt` chip, and "place · split N ways". Then one **expandable card per person**:
  avatar (lg) + name (+ `payer` chip) + item count + total (`22px/700`) + chevron. Expanded shows:
  each assigned item (with `÷N` when shared) and its per-person share; a dashed divider; then
  `Item subtotal`, `+ tax · X.X%`, `+ tip · X.X%`, `− discount`; and for the payer an info note:
  "Absorbs rounding remainder so the split sums exactly." First person is expanded by default.
- **Dock**: `Send payment requests` (send icon).

### 6 · Send
- **Purpose**: Generate payment requests + export.
- **Layout**: Title "Collect what you're owed". A `memo · "<expense name>"` accent chip. One
  **card per non-payer**: avatar + name + amount (`21px/700`); below, a button row
  `Venmo` · `Zelle` · `Copy` (icon-only). After an action the row shows a green `✓ <method> sent`
  status. An info note about pre-filled links / stored handles / no accounts in Phase 1.
- **Dock**: `Export to CSV` (ghost, functional) + `Done · new bill` (primary, restarts).
- **Toast**: actions flash a transient toast near the bottom.

---

## Interactions & Behavior
- **Navigation**: linear. Primary dock CTA advances; back chevron decrements. Progress segments
  reflect current step (0-indexed internally; shown as 6 segments).
- **Assignment**: tap item row → sheet → toggle people / `Everyone` → `Done`. Multi-select =
  **equal N-way split** of that item (custom % is Phase 2). Assignments are
  `{ itemId: [personId, …] }`.
- **Live recompute**: any assignment change recomputes all per-person totals; the Assign rail and
  Summary numbers animate (count-up, ease-out cubic, ~520ms).
- **CSV export**: generated **client-side** from current state, downloaded as a Blob
  (`<expense-name>.csv`). Columns: Person, Items, Subtotal, Tax, Tip, Discount, Total owed.
- **Copy**: writes `"<expense name> — $X.XX"` to clipboard.
- **Theme**: toggled in-app; persists for the session. **Snap instantly — do NOT CSS-transition
  theme color/background** (see Implementation Notes).
- **Payment links (real app)**: Venmo deep link
  `venmo://paycharge?txn=pay&recipients=@user&amount=XX.XX&note=<expense name>`; Zelle = pre-filled
  share message. Memo defaults to the expense name. The prototype simulates these with a toast.

## State Management
Single flow store (Zustand in the target stack). Needed state:
- `step` (0–5)
- `theme` ('dark' | 'light')
- `name` (expense name string)
- `receipt` { subtotal, tax, tip, discount, total, place, items[] }
- `people` [{ id, name, initial, color, payer }]
- `assignments` { itemId: [personId, …] }
- Derived (memoized): `compute(receipt, items, people, assignments)` → see engine below.

PRD note: bill sessions are persisted to the DB from day one (auth scaffolded, not enforced in Phase 1).

## Calculation Engine  *(implement exactly — this is the product)*
Derive rates from the **printed receipt amounts**, not assumptions:
```
taxRate = receipt.tax / receipt.subtotal
tipRate = receipt.tip / receipt.subtotal

// per person, summed over their assigned items (shared item price ÷ #people on it)
personItemSub = Σ (item.price / item.assignees.length)

personDiscount = receipt.discount × (personItemSub / receipt.subtotal)   // proportional

personTotal = personItemSub
            + personItemSub × taxRate
            + personItemSub × tipRate
            − personDiscount
```
**Rounding**: round every *non-payer* total to the nearest cent; the **payer absorbs the
remainder** so `Σ personTotal === receipt.total` exactly:
```
payerTotal = round2( receipt.total − Σ(other rounded totals) )
```
Discounts are proportional by default; an item-specific discount override is allowed at the
receipt-edit step (Phase 1 scope note). Custom-percentage shared splits are Phase 2.

The reference implementation lives in **`splity-data.jsx`** (`compute()` and `toCSV()`), and is
plain framework-agnostic JS you can lift directly.

---

## Design Tokens

### Colors — Dark (default)
| Token | Value |
|---|---|
| `--bg` | `#0c0e12` (radial grad to `#161a22` at top) |
| `--surface` | `#14181f` |
| `--surface-2` | `#1c212b` |
| `--surface-hi` | `#232a36` |
| `--hairline` | `rgba(255,255,255,0.08)` |
| `--hairline-2` | `rgba(255,255,255,0.14)` |
| `--text` | `#f3f5f8` |
| `--text-dim` | `#99a2af` |
| `--text-faint` | `#5f6873` |
| `--accent` | `#ff7a4d` |
| `--accent-press` | `#ff6a36` |
| `--accent-ink` (accent text) | `#ff9069` |
| `--accent-tint` | `rgba(255,122,77,0.15)` |
| `--pos` (credit/green) | `#3ddc97` |

### Colors — Light
| Token | Value |
|---|---|
| `--bg` | `#eef0f3` (radial grad to white at top) |
| `--surface` | `#ffffff` |
| `--surface-2` | `#f3f5f8` |
| `--hairline` | `rgba(17,23,32,0.08)` |
| `--hairline-2` | `rgba(17,23,32,0.13)` |
| `--text` | `#14171c` |
| `--text-dim` | `#5d6573` |
| `--text-faint` | `#9aa1ac` |
| `--accent` | `#ff7a4d` |
| `--accent-ink` (accent text) | `#cf4d22` |
| `--accent-tint` | `rgba(255,122,77,0.13)` |
| `--pos` | `#12a06a` |

### Person avatar palette
You `#ff7a4d` (accent/payer) · Mara `#3ddc97` · Kenji `#5b8cff` · Priya `#c084fc`.
Rendered as a circle with a 155° gradient to a darker shade of the hue + subtle inset ring.

### Typography
- **UI / display**: `Hanken Grotesk` (400/500/600/700/800).
- **Numbers / money**: `JetBrains Mono` (`font-feature-settings: "tnum" 1, "zero" 1`,
  `letter-spacing: -.02em`). Use tabular figures for ALL currency.
- Scale: headline `30–38px/800`; section title `17px/700`; body `15px`; eyebrow `12px/700`
  uppercase `.14em` tracking; micro `11–12.5px`. Big totals `22–40px`.

### Radius / shadow / spacing
- Radius: `--r-lg 22px`, `--r-md 16px`, `--r-sm 11px`; pills `999px`; avatars `50%`.
- Shadow (dark): `0 12px 38px rgba(0,0,0,.46)`; (light): `0 14px 40px rgba(20,26,40,.14)`;
  small variants for cards/buttons. Accent glow on primary CTA:
  `0 6px 22px rgba(255,122,77,0.34)`.
- Screen horizontal padding `18px`. Card row padding `14px 16px` with `1px --hairline` dividers.
- Primary CTA: full-width, `padding 16px`, `17px/700`, white text, radius `--r-md`, accent glow.

### Motion
- Subtle, premium. Entrance: gentle `translateY(12px)→0` rise (~420ms, staggered ~50ms).
- Money **count-up** on value change: ease-out cubic, ~520ms.
- Bottom sheet: scale `.965→1` from bottom origin + scrim fade.
- Button press: `scale(.92–.98)`.
- Respect `prefers-reduced-motion` (skip entrance/count-up).

## Assets
- **Icons**: a small custom stroke-icon set (`currentColor`, 24px grid, ~1.9 stroke) in
  `splity-icons.jsx` — back, fwd, arrow, camera, edit, plus, check, x, scan, download, copy, sun,
  moon, info, users, receipt, chevdown, send, dollar. Replace with your icon library
  (e.g. lucide-react) — names map closely.
- **Logo mark**: simple "split circle" SVG in `splity-screens-1.jsx` (`Mark`).
- **Receipt image**: a striped placeholder (`.imgslot`). Real app uses the scanned photo.
- No external image assets. Fonts via Google Fonts (Hanken Grotesk, JetBrains Mono).
- Device frame (`ios-frame.jsx`) is a prototyping scaffold — **not** part of the product UI.

## Files
| File | Contents |
|---|---|
| `Splity Prototype.html` | App shell: flow state, theme, device frame, step router |
| `splity-theme.css` | All design tokens (dark+light) + component classes + keyframes |
| `splity-data.jsx` | **Calc engine** (`compute`), sample bill data, `toCSV` — lift directly |
| `splity-ui.jsx` | Shared components: `Ava`, `Money` (count-up), `TopBar`, `ScreenHead`, `Stat` |
| `splity-icons.jsx` | Icon set |
| `splity-screens-1.jsx` | Home, Receipt Review, People |
| `splity-screens-2.jsx` | Assign (+ picker sheet), Summary, Send |
| `ios-frame.jsx` | Device-frame scaffold (prototype only — ignore for production) |
| `Splity Wireframes.html` | *(reference)* the 3 lo-fi flow explorations this hi-fi came from |

## Implementation Notes / gotchas
- **Theme must snap, not transition.** Do not put CSS transitions on `color`/`background` of the
  themed root — interpolating inherited color caused a stuck-state bug in the static prototype.
  Tailwind `dark:` class swap (instant) is the correct pattern.
- The prototype is **seeded with a complete sample split** so it always lands on real numbers.
  Names/items/values are not yet editable in the prototype (tappable-nav scope) — wiring inline
  editing, the add-person input, and live receipt edits are first implementation tasks.
- Keep money in cents or use the `round2` helper consistently; the payer-remainder rule depends on
  rounding others first.
