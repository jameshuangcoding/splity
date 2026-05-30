/**
 * @jest-environment node
 *
 * Real Tabscanner integration tests — skipped unless TABSCANNER_API_KEY is set.
 * These consume one credit per receipt; run deliberately, not in CI.
 *
 * Usage:
 *   TABSCANNER_API_KEY=<key> npx jest tabscanner.integration
 */

import * as fs from "fs";
import * as path from "path";
import { normalizeOcrResponse } from "@/lib/ocr";

const API_KEY = process.env.TABSCANNER_API_KEY;
const BASE = "https://api.tabscanner.com";
const FIXTURES = path.join(__dirname, "../fixtures/receipts");
const MAX_POLL = 10;
const POLL_MS = 1500;

async function pollResult(token: string): Promise<Record<string, unknown>> {
  for (let i = 0; i < MAX_POLL; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, POLL_MS));
    const res = await fetch(`${BASE}/api/result/${token}`, {
      headers: { apikey: API_KEY! },
    });
    if (!res.ok) continue;
    const data = (await res.json()) as Record<string, unknown>;
    if (data.status === "done") return data;
    if (data.status === "error") throw new Error("Tabscanner: processing error");
  }
  throw new Error("Tabscanner: timed out waiting for result");
}

async function scanFixture(filename: string): Promise<Record<string, unknown>> {
  const filePath = path.join(FIXTURES, filename);
  const buffer = fs.readFileSync(filePath);
  const file = new File([buffer], filename, { type: "image/jpeg" });

  const body = new FormData();
  body.append("file", file);

  const res = await fetch(`${BASE}/api/2/process`, {
    method: "POST",
    headers: { apikey: API_KEY! },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tabscanner upload failed (${res.status}): ${text}`);
  }

  const upload = (await res.json()) as Record<string, unknown>;
  if (!upload.success) {
    throw new Error(`Tabscanner rejected upload: ${upload.message}`);
  }

  return pollResult(upload.token as string);
}

const itIfKey = API_KEY ? it : it.skip;

describe("Tabscanner integration", () => {
  jest.setTimeout(30_000);

  itIfKey("receipt-1.jpeg — returns OCR data with line items", async () => {
    const raw = await scanFixture("receipt-1.jpeg");
    const normalized = normalizeOcrResponse(raw);

    expect(normalized.items!.length).toBeGreaterThan(0);
    normalized.items!.forEach((item) => {
      expect(typeof item.name).toBe("string");
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.price).toBeGreaterThan(0);
    });
  });

  itIfKey("receipt-2.jpeg — normalizer extracts subtotal and totals", async () => {
    const raw = await scanFixture("receipt-2.jpeg");
    const normalized = normalizeOcrResponse(raw);

    expect(normalized.subtotal).toBeGreaterThanOrEqual(0);
    // Total is not included in normalized output (derived by the store).
    expect(normalized.total).toBeUndefined();
  });

  itIfKey("receipt-3.jpeg — normalizer extracts place name", async () => {
    const raw = await scanFixture("receipt-3.jpeg");
    const normalized = normalizeOcrResponse(raw);

    // Place may be empty for some receipts, but should always be a string.
    expect(typeof normalized.place).toBe("string");
  });
});
