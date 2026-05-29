/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/ocr/route";

const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

function makeFileRequest(file?: File) {
  const form = new FormData();
  if (file) form.append("receipt", file);
  return new NextRequest("http://localhost/api/ocr", {
    method: "POST",
    body: form,
  });
}

describe("POST /api/ocr", () => {
  it("returns 400 when no file is provided", async () => {
    const req = makeFileRequest();
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/no file/i);
  });

  it("returns 503 when TABSCANNER_API_KEY is not set", async () => {
    delete process.env.TABSCANNER_API_KEY;
    const file = new File(["fake image data"], "receipt.jpg", {
      type: "image/jpeg",
    });
    const req = makeFileRequest(file);
    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it("proxies to Tabscanner and returns data on success", async () => {
    process.env.TABSCANNER_API_KEY = "test-key";
    const mockResponse = { lineItems: [], subtotal: 10, total: 10 };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const file = new File(["fake image data"], "receipt.jpg", {
      type: "image/jpeg",
    });
    const req = makeFileRequest(file);
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(mockResponse);
  });

  it("returns 502 when Tabscanner responds with an error", async () => {
    process.env.TABSCANNER_API_KEY = "test-key";
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => "Rate limited",
    } as unknown as Response);

    const file = new File(["fake image data"], "receipt.jpg", {
      type: "image/jpeg",
    });
    const req = makeFileRequest(file);
    const res = await POST(req);
    expect(res.status).toBe(502);
  });
});
