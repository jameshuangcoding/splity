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

  it("polls for the result when Tabscanner returns a token", async () => {
    process.env.TABSCANNER_API_KEY = "test-key";
    const uploadResponse = { success: true, status: "success", token: "tok123" };
    const doneResponse = {
      status: "done",
      result: { lineItems: [], subTotal: 10 },
    };
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => uploadResponse } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => doneResponse } as Response);

    const file = new File(["fake image data"], "receipt.jpg", { type: "image/jpeg" });
    const res = await POST(makeFileRequest(file));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(doneResponse);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/2/process");
    expect((global.fetch as jest.Mock).mock.calls[1][0]).toContain("/api/result/tok123");
  });

  it("sends apikey as a header, not a form field", async () => {
    process.env.TABSCANNER_API_KEY = "secret-key";
    const doneResponse = { status: "done", result: { lineItems: [], subTotal: 0 } };
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ token: "t" }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => doneResponse } as Response);

    const file = new File(["img"], "r.jpg", { type: "image/jpeg" });
    await POST(makeFileRequest(file));

    const [, uploadOptions] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    expect((uploadOptions.headers as Record<string, string>).apikey).toBe("secret-key");
    // Body should NOT contain the apikey form field
    const bodyStr = uploadOptions.body?.toString() ?? "";
    expect(bodyStr).not.toContain("secret-key");
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
