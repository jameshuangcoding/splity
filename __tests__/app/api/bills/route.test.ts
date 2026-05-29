/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/bills/route";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    bill: {
      create: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/bills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/bills", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates a bill and returns 201", async () => {
    const mockBill = {
      id: "cltest123",
      name: "East Asia dinner",
      status: "DRAFT",
      eventId: null,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (mockPrisma.bill.create as jest.Mock).mockResolvedValue(mockBill);

    const res = await POST(makeRequest({ name: "East Asia dinner" }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBe("cltest123");
    expect(data.name).toBe("East Asia dinner");
  });

  it("returns 400 when name is empty", async () => {
    const res = await POST(makeRequest({ name: "" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when name is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 when name exceeds 100 characters", async () => {
    const res = await POST(makeRequest({ name: "a".repeat(101) }));
    expect(res.status).toBe(400);
  });

  it("does not call prisma when validation fails", async () => {
    await POST(makeRequest({ name: "" }));
    expect(mockPrisma.bill.create).not.toHaveBeenCalled();
  });
});
