import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/server-utils";

const billInclude = {
  receipts: {
    include: {
      lineItems: {
        include: { assignments: true },
        orderBy: { position: "asc" as const },
      },
    },
    orderBy: { position: "asc" as const },
  },
  people: { include: { assignments: true } },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { billId: string } }
) {
  try {
    const bill = await prisma.bill.findUniqueOrThrow({
      where: { id: params.billId },
      include: billInclude,
    });
    return NextResponse.json(bill);
  } catch (error) {
    return handleError(error);
  }
}

const UpdateBillSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z.enum(["DRAFT", "COMPLETE"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { billId: string } }
) {
  try {
    const input = UpdateBillSchema.parse(await req.json());
    const bill = await prisma.bill.update({
      where: { id: params.billId },
      data: input,
      include: billInclude,
    });
    return NextResponse.json(bill);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { billId: string } }
) {
  try {
    await prisma.bill.delete({ where: { id: params.billId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
