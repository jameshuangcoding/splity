import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/server-utils";

const LineItemSchema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),
  isDiscount: z.boolean().default(false),
  position: z.number().int(),
});

const CreateReceiptSchema = z.object({
  label: z.string().optional(),
  subtotal: z.number().nonnegative().nullable().optional(),
  taxAmount: z.number().nonnegative().nullable().optional(),
  tipAmount: z.number().nonnegative().nullable().optional(),
  totalAmount: z.number().nonnegative(),
  ocrRaw: z.unknown().optional(),
  lineItems: z.array(LineItemSchema),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { billId: string } }
) {
  try {
    const input = CreateReceiptSchema.parse(await req.json());

    const taxRate =
      input.subtotal && input.taxAmount
        ? input.taxAmount / input.subtotal
        : null;
    const tipRate =
      input.subtotal && input.tipAmount
        ? input.tipAmount / input.subtotal
        : null;

    const receipt = await prisma.receipt.create({
      data: {
        billId: params.billId,
        label: input.label,
        subtotal: input.subtotal ?? null,
        taxAmount: input.taxAmount ?? null,
        tipAmount: input.tipAmount ?? null,
        totalAmount: input.totalAmount,
        taxRate,
        tipRate,
        ocrRaw: input.ocrRaw ? (input.ocrRaw as object) : undefined,
        lineItems: {
          create: input.lineItems.map((li) => ({
            name: li.name,
            price: li.price,
            isDiscount: li.isDiscount,
            position: li.position,
          })),
        },
      },
      include: { lineItems: true },
    });

    return NextResponse.json(receipt, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
