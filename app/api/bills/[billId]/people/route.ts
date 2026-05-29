import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/server-utils";

const CreatePersonSchema = z.object({
  name: z.string().min(1).max(100),
  isPayer: z.boolean().default(false),
  venmoHandle: z.string().optional(),
  zelleContact: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { billId: string } }
) {
  try {
    const input = CreatePersonSchema.parse(await req.json());
    const person = await prisma.person.create({
      data: { ...input, billId: params.billId },
    });
    return NextResponse.json(person, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
