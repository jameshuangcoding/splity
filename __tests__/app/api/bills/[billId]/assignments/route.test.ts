/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { PUT, DELETE } from "@/app/api/bills/[billId]/assignments/route";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    assignment: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

beforeEach(() => {
  jest.clearAllMocks();
  (mockPrisma.$transaction as jest.Mock).mockImplementation(
    async (ops: Promise<unknown>[]) => Promise.all(ops)
  );
  (mockPrisma.assignment.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
  (mockPrisma.assignment.createMany as jest.Mock).mockResolvedValue({ count: 0 });
});

function makePutRequest(body: unknown) {
  return new NextRequest("http://localhost/api/bills/cltest123/assignments", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PUT /api/bills/[billId]/assignments", () => {
  it("returns 200 with success: true on valid input", async () => {
    const res = await PUT(
      makePutRequest({
        lineItemId: "cllineitem123456789012345",
        personIds: ["clperson1234567890123456"],
      }),
      {}
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("deletes existing assignments before creating new ones", async () => {
    await PUT(
      makePutRequest({
        lineItemId: "cllineitem123456789012345",
        personIds: ["clperson1234567890123456"],
      }),
      {}
    );
    expect(mockPrisma.assignment.deleteMany).toHaveBeenCalledWith({
      where: { lineItemId: "cllineitem123456789012345" },
    });
    expect(mockPrisma.assignment.createMany).toHaveBeenCalled();
  });

  it("accepts empty personIds to unassign an item", async () => {
    const res = await PUT(
      makePutRequest({
        lineItemId: "cllineitem123456789012345",
        personIds: [],
      }),
      {}
    );
    expect(res.status).toBe(200);
  });

  it("returns 400 when lineItemId is not a cuid", async () => {
    const res = await PUT(
      makePutRequest({ lineItemId: "not-a-cuid", personIds: [] }),
      {}
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when personIds contains non-cuid values", async () => {
    const res = await PUT(
      makePutRequest({
        lineItemId: "cllineitem123456789012345",
        personIds: ["not-a-cuid"],
      }),
      {}
    );
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/bills/[billId]/assignments", () => {
  it("clears all assignments for a line item", async () => {
    const req = new NextRequest(
      "http://localhost/api/bills/cltest123/assignments",
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineItemId: "cllineitem123456789012345" }),
      }
    );
    const res = await DELETE(req, {});
    expect(res.status).toBe(200);
    expect(mockPrisma.assignment.deleteMany).toHaveBeenCalledWith({
      where: { lineItemId: "cllineitem123456789012345" },
    });
  });
});
