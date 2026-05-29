import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/server-utils";

const UpdateReceiptSchema = z.object({
  label: z.string().optional(),
  subtotal: z.number().nonnegative().nullable().optional(),
  taxAmount: z.number().nonnegative().nullable().optional(),
  tipAmount: z.number().nonnegative().nullable().optional(),
  totalAmount: z.number().nonnegative().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { billId: string; receiptId: string } }
) {
  try {
    const input = UpdateReceiptSchema.parse(await req.json());

    const current = await prisma.receipt.findUniqueOrThrow({
      where: { id: params.receiptId },
    });

    const subtotal = input.subtotal ?? parseFloat(current.subtotal?.toString() ?? "0");
    const taxAmount = input.taxAmount ?? parseFloat(current.taxAmount?.toString() ?? "0");
    const tipAmount = input.tipAmount ?? parseFloat(current.tipAmount?.toString() ?? "0");

    const receipt = await prisma.receipt.update({
      where: { id: params.receiptId },
      data: {
        ...input,
        taxRate: subtotal ? taxAmount / subtotal : null,
        tipRate: subtotal ? tipAmount / subtotal : null,
      },
      include: { lineItems: true },
    });

    return NextResponse.json(receipt);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { billId: string; receiptId: string } }
) {
  try {
    await prisma.receipt.delete({ where: { id: params.receiptId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
