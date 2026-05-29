// Proxies receipt images to Tabscanner — keeps TABSCANNER_API_KEY server-side.

import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/server-utils";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("receipt") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!process.env.TABSCANNER_API_KEY) {
      return NextResponse.json(
        { error: "OCR service not configured" },
        { status: 503 }
      );
    }

    const tabscannerForm = new FormData();
    tabscannerForm.append("apikey", process.env.TABSCANNER_API_KEY);
    tabscannerForm.append("file", file);
    tabscannerForm.append(
      "outputFields",
      "lineItems,subtotal,tax,tip,total,merchant"
    );

    const response = await fetch("https://api.tabscanner.com/api/process", {
      method: "POST",
      body: tabscannerForm,
    });

    if (!response.ok) {
      console.error("Tabscanner error:", response.status, await response.text());
      return NextResponse.json(
        { error: "OCR service error" },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}
