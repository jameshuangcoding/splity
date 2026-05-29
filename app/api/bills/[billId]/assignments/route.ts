import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/utils";

const AssignmentSchema = z.object({
  lineItemId: z.string().cuid(),
  personIds: z.array(z.string().cuid()), // empty array = unassign
});

// PUT replaces all assignments for a given line item atomically
export async function PUT(
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _ctx: unknown
) {
  try {
    const input = AssignmentSchema.parse(await req.json());

    await prisma.$transaction([
      prisma.assignment.deleteMany({ where: { lineItemId: input.lineItemId } }),
      prisma.assignment.createMany({
        data: input.personIds.map((personId) => ({
          lineItemId: input.lineItemId,
          personId,
        })),
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

const ClearSchema = z.object({
  lineItemId: z.string().cuid(),
});

export async function DELETE(
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _ctx: unknown
) {
  try {
    const input = ClearSchema.parse(await req.json());
    await prisma.assignment.deleteMany({
      where: { lineItemId: input.lineItemId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
