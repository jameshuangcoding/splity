import type {
  Bill,
  Receipt,
  LineItem,
  Person,
  Assignment,
  BillStatus,
} from "@prisma/client";

// Re-export Prisma types
export type { Bill, Receipt, LineItem, Person, Assignment, BillStatus };

// ─── Nested types used in API responses ──────────────────────────────────────

export type LineItemWithAssignments = LineItem & {
  assignments: Assignment[];
};

export type ReceiptWithItems = Receipt & {
  lineItems: LineItemWithAssignments[];
};

export type PersonWithAssignments = Person & {
  assignments: Assignment[];
};

export type BillWithRelations = Bill & {
  receipts: ReceiptWithItems[];
  people: PersonWithAssignments[];
};

// ─── Calculation engine output types ─────────────────────────────────────────
// See lib/calculation/engine.ts for how these are produced.

export type PersonReceiptResult = {
  personId: string;
  itemSubtotal: number;
  taxAllocated: number;
  tipAllocated: number;
  discountAllocated: number;
  total: number;
};

export type PersonBillResult = {
  personId: string;
  name: string;
  isPayer: boolean;
  receiptBreakdown: PersonReceiptResult[];
  grandTotal: number;
};

// ─── Zustand store types ──────────────────────────────────────────────────────

export type Theme = "dark" | "light";
export type InputMode = "scan" | "manual";

export interface StorePerson {
  id: string;
  name: string;
  initial: string;
  color: string;
  payer: boolean;
}

export interface StoreLineItem {
  id: string;
  name: string;
  price: number;
  isDiscount?: boolean;
}

export interface StoreReceipt {
  subtotal: number;
  tax: number;
  tip: number;
  discount: number;
  total: number;
  place: string;
  items: StoreLineItem[];
}

export type Assignments = Record<string, string[]>;

// ─── API request shapes ───────────────────────────────────────────────────────

export type CreateBillInput = {
  name: string;
};

export type CreateReceiptInput = {
  label?: string;
  subtotal?: number | null;
  taxAmount?: number | null;
  tipAmount?: number | null;
  totalAmount: number;
  ocrRaw?: unknown;
  lineItems: CreateLineItemInput[];
};

export type CreateLineItemInput = {
  name: string;
  price: number;
  isDiscount: boolean;
  position: number;
};

export type CreatePersonInput = {
  name: string;
  isPayer: boolean;
  venmoHandle?: string;
  zelleContact?: string;
};

export type UpsertAssignmentsInput = {
  lineItemId: string;
  personIds: string[];
};
