import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const schema = z.object({
      expenseId: z.string(),
      splits: z.array(
        z.object({
          userId: z.string(),
          amount: z.number().positive(),
        })
      ),
    });

    const body = await req.json();
    const { expenseId, splits } = schema.parse(body);

    // Create splits
    await prisma.split.createMany({
      data: splits.map((split) => ({
        expenseId,
        amount: split.amount,
        debtorId: split.userId,
        creditorId: "", // Will be set to expense.paidById
      })),
    });

    // Update the splits with the creditorId
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!expense) {
      throw new Error("Expense not found");
    }

    await prisma.split.updateMany({
      where: { expenseId },
      data: { creditorId: expense.paidById },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to split expense" },
      { status: 400 }
    );
  }
}