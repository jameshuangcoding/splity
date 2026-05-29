// Client-side fetch wrappers — always use these instead of calling fetch directly in components.

import type {
  BillWithRelations,
  CreateBillInput,
  CreateReceiptInput,
  CreatePersonInput,
  UpsertAssignmentsInput,
} from "@/types";

async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export function createBill(input: CreateBillInput) {
  return apiFetch<{ id: string; name: string }>("/api/bills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function getBill(billId: string) {
  return apiFetch<BillWithRelations>(`/api/bills/${billId}`);
}

export function updateBill(billId: string, data: { name?: string; status?: string }) {
  return apiFetch<BillWithRelations>(`/api/bills/${billId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function addReceipt(billId: string, input: CreateReceiptInput) {
  return apiFetch(`/api/bills/${billId}/receipts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function addPerson(billId: string, input: CreatePersonInput) {
  return apiFetch(`/api/bills/${billId}/people`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function upsertAssignments(billId: string, input: UpsertAssignmentsInput) {
  return apiFetch(`/api/bills/${billId}/assignments`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function scanReceipt(file: File) {
  const form = new FormData();
  form.append("receipt", file);
  return apiFetch("/api/ocr", { method: "POST", body: form });
}
