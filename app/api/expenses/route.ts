import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const schema = z.object({
      amount: z.number().positive(),
      description: z.string().min(1),
      category: z.string(),
      groupId: z.string(),
      paidById: z.string(),
      date: z.string(),
    });

    const body = await req.json();
    const data = schema.parse(body);

    const expense = await prisma.expense.create({
      data: {
        amount: data.amount,
        description: data.description,
        category: data.category as any,
        date: new Date(data.date),
        group: { connect: { id: data.groupId } },
        paidBy: { connect: { id: data.paidById } },
      },
      include: {
        paidBy: true,
        group: true,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Failed to create expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      include: {
        paidBy: true,
        group: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}