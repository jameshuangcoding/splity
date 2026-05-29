import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/utils";

const CreateBillSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const input = CreateBillSchema.parse(await req.json());
    const bill = await prisma.bill.create({ data: { name: input.name } });
    return NextResponse.json(bill, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
