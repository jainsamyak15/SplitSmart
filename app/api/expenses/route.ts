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
      splits: z.array(z.object({
        userId: z.string(),
        amount: z.number().positive()
      }))
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

      // 2. Create splits for selected members
      const splits = await Promise.all(
        data.splits.map((split) => 
          tx.split.create({
            data: {
              expenseId: expense.id,
              amount: split.amount,
              debtorId: split.userId,
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

export async function GET(req: Request) {
  try {
    // Get the user ID from the request
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all groups where the user is a member
    const userGroups = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true }
    });

    const groupIds = userGroups.map(group => group.groupId);

    // Get all expenses from groups where the user is a member
    const expenses = await prisma.expense.findMany({
      where: {
        groupId: {
          in: groupIds
        }
      },
      include: {
        paidBy: true,
        group: true,
        splits: {
          include: {
            // @ts-ignore
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

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const expenseId = searchParams.get('id');
    const userId = req.headers.get('x-user-id');

    if (!expenseId || !userId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Check if the user is the creator of the expense
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      select: { paidById: true }
    });

    if (!expense) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      );
    }

    if (expense.paidById !== userId) {
      return NextResponse.json(
        { error: "Unauthorized to delete this expense" },
        { status: 403 }
      );
    }

    // Delete the expense and related splits
    await prisma.$transaction([
      prisma.split.deleteMany({
        where: { expenseId }
      }),
      prisma.expense.delete({
        where: { id: expenseId }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}