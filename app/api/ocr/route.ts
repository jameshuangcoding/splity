// Proxies receipt images to Tabscanner — keeps TABSCANNER_API_KEY server-side.
// Uses the v2 synchronous endpoint; falls back to polling if pending.

import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/server-utils";

const BASE = "https://api.tabscanner.com";
const MAX_POLL = 8;
const POLL_MS = 1500;

async function pollResult(token: string, apiKey: string): Promise<unknown> {
  for (let i = 0; i < MAX_POLL; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, POLL_MS));
    const res = await fetch(`${BASE}/api/result/${token}`, {
      headers: { apikey: apiKey },
    });
    if (!res.ok) continue;
    const data = (await res.json()) as Record<string, unknown>;
    if (data.status === "done") return data;
    if (data.status === "error") throw new Error("OCR processing failed");
  }
  throw new Error("OCR timed out after polling");
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("receipt") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const apiKey = process.env.TABSCANNER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OCR service not configured" },
        { status: 503 }
      );
    }

    const body = new FormData();
    body.append("apikey", apiKey);
    body.append("file", file);

    // /api/2/process is the synchronous endpoint — returns results in one shot.
    const response = await fetch(`${BASE}/api/2/process`, {
      method: "POST",
      body,
    });

    if (!response.ok) {
      console.error("Tabscanner error:", response.status, await response.text());
      return NextResponse.json(
        { error: "OCR service error" },
        { status: 502 }
      );
    }

    const data = (await response.json()) as Record<string, unknown>;

    // Defensive: if v2 somehow returns pending, poll v1 result endpoint.
    if (data.status === "pending" && typeof data.token === "string") {
      const result = await pollResult(data.token, apiKey);
      return NextResponse.json(result);
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}
