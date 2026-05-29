/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET, PATCH, DELETE } from "@/app/api/bills/[billId]/route";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    bill: {
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const params = { params: { billId: "cltest123" } };

const mockBill = {
  id: "cltest123",
  name: "Test Bill",
  status: "DRAFT",
  eventId: null,
  userId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  receipts: [],
  people: [],
};

beforeEach(() => jest.clearAllMocks());

describe("GET /api/bills/[billId]", () => {
  it("returns 200 with bill data", async () => {
    (mockPrisma.bill.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockBill);
    const req = new NextRequest("http://localhost/api/bills/cltest123");
    const res = await GET(req, params);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("cltest123");
  });

  it("returns 404 when bill not found", async () => {
    (mockPrisma.bill.findUniqueOrThrow as jest.Mock).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "6.0.0",
      })
    );
    const req = new NextRequest("http://localhost/api/bills/cltest123");
    const res = await GET(req, params);
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/bills/[billId]", () => {
  it("returns 200 with updated bill", async () => {
    (mockPrisma.bill.update as jest.Mock).mockResolvedValue({
      ...mockBill,
      name: "Updated Name",
    });
    const req = new NextRequest("http://localhost/api/bills/cltest123", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated Name" }),
    });
    const res = await PATCH(req, params);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe("Updated Name");
  });

  it("returns 400 for invalid status value", async () => {
    const req = new NextRequest("http://localhost/api/bills/cltest123", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "INVALID" }),
    });
    const res = await PATCH(req, params);
    expect(res.status).toBe(400);
  });

  it("accepts COMPLETE as a valid status", async () => {
    (mockPrisma.bill.update as jest.Mock).mockResolvedValue({
      ...mockBill,
      status: "COMPLETE",
    });
    const req = new NextRequest("http://localhost/api/bills/cltest123", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETE" }),
    });
    const res = await PATCH(req, params);
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/bills/[billId]", () => {
  it("returns 200 with success flag", async () => {
    (mockPrisma.bill.delete as jest.Mock).mockResolvedValue(mockBill);
    const req = new NextRequest("http://localhost/api/bills/cltest123", {
      method: "DELETE",
    });
    const res = await DELETE(req, params);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("returns 404 when bill not found", async () => {
    (mockPrisma.bill.delete as jest.Mock).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "6.0.0",
      })
    );
    const req = new NextRequest("http://localhost/api/bills/cltest123", {
      method: "DELETE",
    });
    const res = await DELETE(req, params);
    expect(res.status).toBe(404);
  });
});
