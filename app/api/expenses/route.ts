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

    // Start a transaction to create expense and splits
    const expense = await prisma.$transaction(async (tx) => {
      // 1. Create the expense
      const expense = await tx.expense.create({
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
          group: {
            include: {
              members: {
                include: {
                  user: true
                }
              }
            }
          },
        },
      });

      // 2. Get number of members in the group
      const memberCount = expense.group.members.length;
      const splitAmount = expense.amount / memberCount;

      // 3. Create splits for each member
      const splits = await Promise.all(
        expense.group.members.map((member) => 
          tx.split.create({
            data: {
              expenseId: expense.id,
              amount: splitAmount,
              debtorId: member.user.id,
              creditorId: data.paidById,
            }
          })
        )
      );

      return {
        ...expense,
        splits
      };
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
        splits: {
          include: {
            debtor: true,
            creditor: true
          }
        }
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