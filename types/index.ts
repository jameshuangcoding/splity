// Shared TypeScript types — derived from Prisma schema (Phase 1 adds more here)

export type Theme = "dark" | "light";

export interface Person {
  id: string;
  name: string;
  initial: string;
  color: string;
  payer: boolean;
}

export interface LineItem {
  id: string;
  name: string;
  price: number;
}

export interface Receipt {
  subtotal: number;
  tax: number;
  tip: number;
  discount: number;
  total: number;
  place: string;
  items: LineItem[];
}

export type Assignments = Record<string, string[]>;

export interface PersonBreakdown {
  sub: number;
  tax: number;
  tip: number;
  disc: number;
  total: number;
  remainder?: boolean;
}

export interface CalcResult {
  sub: number;
  taxRate: number;
  tipRate: number;
  breakdown: Record<string, PersonBreakdown>;
  payerId: string;
  assignedCount: number;
  itemCount: number;
  fullyAssigned: boolean;
}
