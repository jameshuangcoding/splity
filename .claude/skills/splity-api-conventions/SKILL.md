---
name: splity-api-conventions
description: >
  Defines REST API conventions, route structure, request/response shapes, and error
  handling for Splity's Next.js API routes. Use this skill before creating or modifying
  any file in app/api/, writing any fetch() call to an internal endpoint, defining
  request or response types, or handling errors in API routes. This is the source of
  truth for how the Splity API is structured — always check here before writing a
  new route or calling an existing one.
---

# Splity API Conventions

All API routes live in `app/api/` and use **Next.js 14 App Router route handlers**.
Never use the Pages Router `pages/api/` directory.

---

## Route Map

```
POST   /api/bills                              Create a new bill
GET    /api/bills/[billId]                     Fetch full bill with all relations
PATCH  /api/bills/[billId]                     Update bill name or status
DELETE /api/bills/[billId]                     Delete bill and cascade

POST   /api/bills/[billId]/receipts            Add a receipt to a bill
PATCH  /api/bills/[billId]/receipts/[receiptId] Update receipt fields
DELETE /api/bills/[billId]/receipts/[receiptId] Delete receipt

POST   /api/bills/[billId]/people              Add a person to a bill
PATCH  /api/bills/[billId]/people/[personId]   Update person (name, payment info)
DELETE /api/bills/[billId]/people/[personId]   Remove person

PUT    /api/bills/[billId]/assignments         Replace all assignments for a line item
DELETE /api/bills/[billId]/assignments         Clear all assignments for a line item

POST   /api/ocr                                Proxy to Tabscanner OCR API
```

---

## Route Handler Pattern

```typescript
// app/api/bills/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// ✅ Always validate input with zod
const CreateBillSchema = z.object({
  name: z.string().min(1).max(100),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const input = CreateBillSchema.parse(body)  // throws ZodError if invalid

    const bill = await prisma.bill.create({
      data: { name: input.name },
    })

    return NextResponse.json(bill, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
```

---

## Standard Response Shapes

### Success

```typescript
// Single resource
NextResponse.json(resource, { status: 200 })        // GET, PATCH
NextResponse.json(resource, { status: 201 })        // POST (created)
NextResponse.json({ success: true }, { status: 200 }) // DELETE

// List
NextResponse.json({ data: items }, { status: 200 })
```

### Error

All errors return this shape:

```typescript
type ErrorResponse = {
  error: string    // human-readable message
  code?: string    // machine-readable code (optional)
}
```

---

## Error Handler

```typescript
// lib/utils.ts — shared across all routes
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

export function handleError(error: unknown): NextResponse {
  // Validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.errors[0].message, code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }
  // Prisma not-found
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    return NextResponse.json(
      { error: 'Not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }
  // Prisma unique constraint
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return NextResponse.json(
      { error: 'Already exists', code: 'CONFLICT' },
      { status: 409 }
    )
  }
  // Unknown
  console.error(error)
  return NextResponse.json(
    { error: 'Internal server error', code: 'INTERNAL_ERROR' },
    { status: 500 }
  )
}
```

---

## Route Examples

### GET with params

```typescript
// app/api/bills/[billId]/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: { billId: string } }
) {
  try {
    const bill = await prisma.bill.findUniqueOrThrow({
      where: { id: params.billId },
      include: {
        receipts: {
          include: { lineItems: { include: { assignments: true }, orderBy: { position: 'asc' } } },
          orderBy: { position: 'asc' },
        },
        people: { include: { assignments: true } },
      },
    })
    return NextResponse.json(bill)
  } catch (error) {
    return handleError(error)
  }
}
```

### OCR Proxy Route

```typescript
// app/api/ocr/route.ts
// Keeps TABSCANNER_API_KEY server-side — never expose to client
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('receipt') as File
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const tabscannerForm = new FormData()
    tabscannerForm.append('apikey', process.env.TABSCANNER_API_KEY!)
    tabscannerForm.append('file', file)
    tabscannerForm.append('outputFields', 'lineItems,subtotal,tax,tip,total,merchant')

    const response = await fetch('https://api.tabscanner.com/api/process', {
      method: 'POST',
      body: tabscannerForm,
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'OCR service error' }, { status: 502 })
    }

    const data = await response.json()
    // Return raw response — client maps to CreateReceiptInput shape
    return NextResponse.json(data)
  } catch (error) {
    return handleError(error)
  }
}
```

### Assignments (PUT replaces all)

```typescript
// app/api/bills/[billId]/assignments/route.ts
const AssignmentSchema = z.object({
  lineItemId: z.string().cuid(),
  personIds:  z.array(z.string().cuid()),  // empty array = unassign
})

export async function PUT(
  req: NextRequest,
  { params }: { params: { billId: string } }
) {
  try {
    const body  = await req.json()
    const input = AssignmentSchema.parse(body)

    // Atomic replace: delete existing, insert new
    const [, assignments] = await prisma.$transaction([
      prisma.assignment.deleteMany({ where: { lineItemId: input.lineItemId } }),
      prisma.assignment.createMany({
        data: input.personIds.map(personId => ({
          lineItemId: input.lineItemId,
          personId,
        })),
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleError(error)
  }
}
```

---

## Client-Side Fetching

Use these thin wrappers in `lib/api.ts` — never call `fetch` directly in components.

```typescript
// lib/api.ts
export async function createBill(name: string) {
  const res = await fetch('/api/bills', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export async function getBill(billId: string) {
  const res = await fetch(`/api/bills/${billId}`)
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export async function scanReceipt(file: File) {
  const form = new FormData()
  form.append('receipt', file)
  const res = await fetch('/api/ocr', { method: 'POST', body: form })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export async function upsertAssignments(billId: string, lineItemId: string, personIds: string[]) {
  const res = await fetch(`/api/bills/${billId}/assignments`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lineItemId, personIds }),
  })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}
```

---

## Auth Middleware (Phase 1: inactive)

```typescript
// middleware.ts — at project root
// Phase 1: passes all requests through (no enforcement)
// Phase 2: uncomment the redirect block

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Phase 2: enforce auth on bill routes
  // const supabase = createServerClient(...)
  // const { data: { session } } = await supabase.auth.getSession()
  // if (!session && request.nextUrl.pathname.startsWith('/bill')) {
  //   return NextResponse.redirect(new URL('/login', request.url))
  // }

  return response
}

export const config = {
  matcher: ['/bill/:path*', '/api/bills/:path*'],
}
```

---

## Rules

- Always validate request bodies with **zod** before touching the database.
- Always wrap route handlers in **try/catch** and return `handleError(error)`.
- Never put `TABSCANNER_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in client-side code.
- Use `findUniqueOrThrow` (not `findUnique`) — Prisma throws a catchable error on missing records.
- Assignments use **PUT** (idempotent replace), not POST or PATCH.
- All monetary values in request/response bodies are **numbers** (JavaScript), not strings.
  Prisma Decimal → `parseFloat(d.toString())` before sending; number → stored as Decimal by Prisma.