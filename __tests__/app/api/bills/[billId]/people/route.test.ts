/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/bills/[billId]/people/route";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: { person: { create: jest.fn() } },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockPerson = {
  id: "clperson1",
  billId: "clbill1",
  name: "Mara",
  isPayer: false,
  venmoHandle: null,
  zelleContact: null,
};

beforeEach(() => jest.clearAllMocks());

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/bills/clbill1/people", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/bills/[billId]/people", () => {
  it("creates a person and returns 201", async () => {
    (mockPrisma.person.create as jest.Mock).mockResolvedValue(mockPerson);
    const res = await POST(makeRequest({ name: "Mara", isPayer: false }), {
      params: { billId: "clbill1" },
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe("Mara");
  });

  it("returns 400 when name is empty", async () => {
    const res = await POST(makeRequest({ name: "" }), {
      params: { billId: "clbill1" },
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when name is missing", async () => {
    const res = await POST(makeRequest({ isPayer: false }), {
      params: { billId: "clbill1" },
    });
    expect(res.status).toBe(400);
  });

  it("stores optional venmoHandle when provided", async () => {
    (mockPrisma.person.create as jest.Mock).mockResolvedValue({
      ...mockPerson,
      venmoHandle: "@mara",
    });
    const res = await POST(
      makeRequest({ name: "Mara", isPayer: false, venmoHandle: "@mara" }),
      { params: { billId: "clbill1" } }
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.venmoHandle).toBe("@mara");
  });
});
