/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/bills/[billId]/receipts/route";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: { receipt: { create: jest.fn() } },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const params = { params: { billId: "clbill1" } };

const mockReceipt = {
  id: "clreceipt1",
  billId: "clbill1",
  totalAmount: 58.31,
  subtotal: 49.25,
  taxAmount: 4.31,
  tipAmount: 9.75,
  taxRate: 0.0875,
  tipRate: 0.1979,
  label: null,
  ocrRaw: null,
  position: 0,
  createdAt: new Date(),
  lineItems: [],
};

beforeEach(() => jest.clearAllMocks());

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/bills/clbill1/receipts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/bills/[billId]/receipts", () => {
  it("creates a receipt and returns 201", async () => {
    (mockPrisma.receipt.create as jest.Mock).mockResolvedValue(mockReceipt);
    const res = await POST(
      makeRequest({
        totalAmount: 58.31,
        subtotal: 49.25,
        taxAmount: 4.31,
        tipAmount: 9.75,
        lineItems: [{ name: "Ramen", price: 14.5, isDiscount: false, position: 0 }],
      }),
      params
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.totalAmount).toBe(58.31);
  });

  it("returns 400 when totalAmount is missing", async () => {
    const res = await POST(
      makeRequest({ subtotal: 20, lineItems: [] }),
      params
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when totalAmount is negative", async () => {
    const res = await POST(
      makeRequest({ totalAmount: -5, lineItems: [] }),
      params
    );
    expect(res.status).toBe(400);
  });

  it("accepts a receipt with no tax or tip (flat)", async () => {
    (mockPrisma.receipt.create as jest.Mock).mockResolvedValue({
      ...mockReceipt,
      taxAmount: null,
      tipAmount: null,
    });
    const res = await POST(
      makeRequest({ totalAmount: 20, lineItems: [] }),
      params
    );
    expect(res.status).toBe(201);
  });
});
