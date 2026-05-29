/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { PATCH, DELETE } from "@/app/api/bills/[billId]/people/[personId]/route";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

jest.mock("@/lib/prisma", () => ({
  prisma: { person: { update: jest.fn(), delete: jest.fn() } },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const params = { params: { billId: "clbill1", personId: "clperson1" } };
const mockPerson = { id: "clperson1", billId: "clbill1", name: "Mara", isPayer: false };

beforeEach(() => jest.clearAllMocks());

describe("PATCH /api/bills/[billId]/people/[personId]", () => {
  it("updates a person and returns 200", async () => {
    (mockPrisma.person.update as jest.Mock).mockResolvedValue({
      ...mockPerson,
      name: "Mara K.",
    });
    const req = new NextRequest("http://localhost/api/bills/clbill1/people/clperson1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Mara K." }),
    });
    const res = await PATCH(req, params);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe("Mara K.");
  });

  it("returns 400 when name is empty string", async () => {
    const req = new NextRequest("http://localhost/api/bills/clbill1/people/clperson1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });
    const res = await PATCH(req, params);
    expect(res.status).toBe(400);
  });

  it("accepts null to clear venmoHandle", async () => {
    (mockPrisma.person.update as jest.Mock).mockResolvedValue({
      ...mockPerson,
      venmoHandle: null,
    });
    const req = new NextRequest("http://localhost/api/bills/clbill1/people/clperson1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venmoHandle: null }),
    });
    const res = await PATCH(req, params);
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/bills/[billId]/people/[personId]", () => {
  it("deletes a person and returns 200", async () => {
    (mockPrisma.person.delete as jest.Mock).mockResolvedValue(mockPerson);
    const req = new NextRequest("http://localhost/api/bills/clbill1/people/clperson1", {
      method: "DELETE",
    });
    const res = await DELETE(req, params);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("returns 404 when person not found", async () => {
    (mockPrisma.person.delete as jest.Mock).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "6.0.0",
      })
    );
    const req = new NextRequest("http://localhost/api/bills/clbill1/people/clperson1", {
      method: "DELETE",
    });
    const res = await DELETE(req, params);
    expect(res.status).toBe(404);
  });
});
