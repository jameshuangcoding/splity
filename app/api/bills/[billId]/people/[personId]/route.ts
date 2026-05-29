import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/server-utils";

const UpdatePersonSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  venmoHandle: z.string().nullable().optional(),
  zelleContact: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { billId: string; personId: string } }
) {
  try {
    const input = UpdatePersonSchema.parse(await req.json());
    const person = await prisma.person.update({
      where: { id: params.personId },
      data: input,
    });
    return NextResponse.json(person);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { billId: string; personId: string } }
) {
  try {
    await prisma.person.delete({ where: { id: params.personId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
