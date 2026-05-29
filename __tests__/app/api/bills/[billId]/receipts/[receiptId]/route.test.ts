/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { PATCH, DELETE } from "@/app/api/bills/[billId]/receipts/[receiptId]/route";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    receipt: {
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const params = { params: { billId: "clbill1", receiptId: "clreceipt1" } };

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

describe("PATCH /api/bills/[billId]/receipts/[receiptId]", () => {
  it("updates a receipt label and returns 200", async () => {
    (mockPrisma.receipt.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockReceipt);
    (mockPrisma.receipt.update as jest.Mock).mockResolvedValue({
      ...mockReceipt,
      label: "Night 1 Dinner",
    });
    const req = new NextRequest(
      "http://localhost/api/bills/clbill1/receipts/clreceipt1",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: "Night 1 Dinner" }),
      }
    );
    const res = await PATCH(req, params);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.label).toBe("Night 1 Dinner");
  });

  it("returns 400 when totalAmount is negative", async () => {
    const req = new NextRequest(
      "http://localhost/api/bills/clbill1/receipts/clreceipt1",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalAmount: -1 }),
      }
    );
    const res = await PATCH(req, params);
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/bills/[billId]/receipts/[receiptId]", () => {
  it("deletes a receipt and returns 200", async () => {
    (mockPrisma.receipt.delete as jest.Mock).mockResolvedValue(mockReceipt);
    const req = new NextRequest(
      "http://localhost/api/bills/clbill1/receipts/clreceipt1",
      { method: "DELETE" }
    );
    const res = await DELETE(req, params);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("returns 404 when receipt not found", async () => {
    (mockPrisma.receipt.delete as jest.Mock).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "6.0.0",
      })
    );
    const req = new NextRequest(
      "http://localhost/api/bills/clbill1/receipts/clreceipt1",
      { method: "DELETE" }
    );
    const res = await DELETE(req, params);
    expect(res.status).toBe(404);
  });
});
