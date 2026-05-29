/**
 * @jest-environment node
 */
import { cn, formatCurrency, handleError } from "@/lib/utils";
import { ZodError, z } from "zod";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

// ─── cn ───────────────────────────────────────────────────────────────────────

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("deduplicates conflicting Tailwind classes (last wins)", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("ignores falsy values", () => {
    expect(cn("foo", false && "bar", undefined, null, "baz")).toBe("foo baz");
  });
});

// ─── formatCurrency ───────────────────────────────────────────────────────────

describe("formatCurrency", () => {
  it("formats positive dollars", () => {
    expect(formatCurrency(12.5)).toBe("$12.50");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats large amounts with comma separator", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });
});

// ─── handleError ──────────────────────────────────────────────────────────────

describe("handleError", () => {
  async function status(res: NextResponse) {
    return res.status;
  }
  async function body(res: NextResponse) {
    return res.json();
  }

  it("returns 400 with VALIDATION_ERROR for ZodError", async () => {
    const schema = z.object({ name: z.string().min(1) });
    let zodError: ZodError | null = null;
    try {
      schema.parse({ name: "" });
    } catch (e) {
      zodError = e as ZodError;
    }

    const res = handleError(zodError!);
    expect(await status(res)).toBe(400);
    const data = await body(res);
    expect(data.code).toBe("VALIDATION_ERROR");
    expect(typeof data.error).toBe("string");
  });

  it("returns 404 with NOT_FOUND for Prisma P2025", async () => {
    const err = new Prisma.PrismaClientKnownRequestError("Record not found", {
      code: "P2025",
      clientVersion: "6.0.0",
    });
    const res = handleError(err);
    expect(await status(res)).toBe(404);
    const data = await body(res);
    expect(data.code).toBe("NOT_FOUND");
  });

  it("returns 409 with CONFLICT for Prisma P2002", async () => {
    const err = new Prisma.PrismaClientKnownRequestError("Unique constraint", {
      code: "P2002",
      clientVersion: "6.0.0",
    });
    const res = handleError(err);
    expect(await status(res)).toBe(409);
    const data = await body(res);
    expect(data.code).toBe("CONFLICT");
  });

  it("returns 500 with INTERNAL_ERROR for unknown errors", async () => {
    const res = handleError(new Error("something went wrong"));
    expect(await status(res)).toBe(500);
    const data = await body(res);
    expect(data.code).toBe("INTERNAL_ERROR");
  });

  it("returns 500 for non-Error throws", async () => {
    const res = handleError("unexpected string throw");
    expect(await status(res)).toBe(500);
  });
});
