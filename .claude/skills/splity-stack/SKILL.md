---
name: splity-stack
description: >
  Defines the exact tech stack, file conventions, and setup patterns for the Splity
  application. Use this skill before creating any new file, installing any package,
  configuring any service, or making any architectural decision in the Splity codebase.
  Trigger on: project setup, new route creation, new component creation, package installs,
  environment config, Supabase setup, Prisma config, Zustand stores, Tailwind/shadcn usage,
  or any time you are unsure which pattern to follow in this project.
---

# Splity Stack

Splity is a **Next.js 14 App Router** full-stack web app. Always use App Router patterns —
never Pages Router. When in doubt about a pattern, this skill is the source of truth.

---

## Stack at a Glance

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14.x |
| Language | TypeScript | 5.x (strict mode) |
| Database | PostgreSQL via Supabase | latest |
| ORM | Prisma | 5.x |
| Auth | Supabase Auth | latest |
| Styling | Tailwind CSS + shadcn/ui | Tailwind 3.x |
| State | Zustand | 4.x |
| OCR | Tabscanner API | via Next.js API route |
| Hosting | Vercel (frontend + API) + Supabase (DB + Auth) | — |

---

## Project Structure

```
splity/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (fonts, providers, dark mode)
│   ├── page.tsx                # Home: start new bill
│   ├── bill/
│   │   └── [billId]/
│   │       ├── receipt/page.tsx    # Step 2: review OCR output
│   │       ├── people/page.tsx     # Step 3: add participants
│   │       ├── assign/page.tsx     # Step 4: assign items to people
│   │       ├── summary/page.tsx    # Step 5: per-person breakdown
│   │       └── send/page.tsx       # Step 6: payment links + CSV export
│   └── api/
│       ├── ocr/route.ts            # POST: proxy to Tabscanner
│       ├── bills/
│       │   ├── route.ts            # POST: create bill
│       │   └── [billId]/
│       │       ├── route.ts        # GET, PATCH, DELETE bill
│       │       ├── receipts/route.ts
│       │       ├── people/route.ts
│       │       └── assignments/route.ts
│       └── auth/[...supabase]/route.ts
├── components/
│   ├── ui/                     # shadcn/ui primitives (never modify directly)
│   └── splity/                 # app-specific components
├── lib/
│   ├── prisma.ts               # Prisma client singleton
│   ├── supabase/
│   │   ├── client.ts           # browser Supabase client
│   │   └── server.ts           # server Supabase client (cookies)
│   ├── calculation/
│   │   └── engine.ts           # pure calculation functions (see splity-calculation-engine)
│   └── utils.ts                # shared helpers (cn, formatCurrency, etc.)
├── stores/
│   └── bill-store.ts           # Zustand store for active bill session
├── types/
│   └── index.ts                # shared TypeScript types (derived from Prisma)
├── prisma/
│   └── schema.prisma           # source of truth for DB schema
└── .env.local                  # environment variables (never commit)
```

---

## Critical Patterns

### Next.js App Router

```typescript
// ✅ Server Component (default) — fetch data here
// app/bill/[billId]/summary/page.tsx
export default async function SummaryPage({ params }: { params: { billId: string } }) {
  const bill = await getBill(params.billId)  // direct DB call or fetch
  return <SummaryView bill={bill} />
}

// ✅ Client Component — interactivity only
'use client'
import { useState } from 'react'

// ❌ Never use getServerSideProps, getStaticProps — those are Pages Router
// ❌ Never import from 'next/router' — use 'next/navigation'
import { useRouter } from 'next/navigation'  // ✅
```

### Prisma Client (singleton)

```typescript
// lib/prisma.ts — always import from here, never instantiate directly
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Supabase Clients

```typescript
// lib/supabase/server.ts — for Server Components and API routes
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookieStore.get(n)?.value } }
  )
}

// lib/supabase/client.ts — for Client Components only
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Zustand Store

```typescript
// stores/bill-store.ts
import { create } from 'zustand'
import type { BillSession } from '@/types'

interface BillStore {
  session: BillSession | null
  setSession: (s: BillSession) => void
  clearSession: () => void
}

export const useBillStore = create<BillStore>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  clearSession: () => set({ session: null }),
}))
```

### Tailwind + shadcn/ui

```typescript
// Always use the cn() utility for conditional classes
import { cn } from '@/lib/utils'

// shadcn/ui components live in components/ui/ — never modify them
// App-specific components live in components/splity/
// Install shadcn: npx shadcn@latest add <component>

// Mobile-first breakpoints (Tailwind default — always write mobile first)
// sm: 640px  md: 768px  lg: 1024px  xl: 1280px
// Example: 'text-sm md:text-base' — small on mobile, base on tablet+
```

---

## Environment Variables

```bash
# .env.local
DATABASE_URL="postgresql://..."           # Supabase direct connection
DIRECT_URL="postgresql://..."             # Supabase direct (for migrations)
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."           # server-side only, never expose to client
TABSCANNER_API_KEY="..."                  # server-side only, used in /api/ocr
```

---

## Auth — Phase 1 Behavior

Auth is **scaffolded but not enforced** in Phase 1. This means:

- Supabase Auth is fully wired up (login/signup routes exist).
- `userId` on Bill is nullable — all Phase 1 bills are anonymous.
- No middleware blocks unauthenticated users in Phase 1.
- API routes do NOT require a session token in Phase 1.
- In Phase 2, add a single middleware check — no re-architecture needed.

---

## Decimal Handling

All monetary values use Prisma's `Decimal` type (maps to PostgreSQL `NUMERIC`).
Always convert to `number` using `parseFloat(value.toString())` before arithmetic.
Never use JavaScript's native floating-point math on raw Decimal objects.
Format for display using:

```typescript
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}
```

---

## PWA

Splity is a Progressive Web App. The `app/manifest.ts` and `public/` icons must be kept
up to date. The camera API (`getUserMedia` / `<input type="file" accept="image/*" capture>`)
is used for receipt scanning — test on a real device, not just desktop browser.