import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const expenses = await prisma.expense.findMany({
      where: {
        groupId: params.id,
      },
      include: {
        paidBy: true,
        group: true,
        splits: {
          include: {
            debtor: {
              select: {
                id: true,
                name: true,
                phone: true,
                image: true,
              },
            },
            creditor: {
              select: {
                id: true,
                name: true,
                phone: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Failed to fetch group expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch group expenses" },
      { status: 500 }
    );
  }
}