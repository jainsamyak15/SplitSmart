import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the user ID from the request
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if the user is a member of the group
    const groupMember = await prisma.groupMember.findFirst({
      where: {
        groupId: params.id,
        userId: userId,
      }
    });

    if (!groupMember) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    const expenses = await prisma.expense.findMany({
      where: {
        groupId: params.id,
      },
      include: {
        paidBy: {
          select: {
            id: true,
            name: true,
            phone: true,
            image: true,
          },
        },
        group: true,
        splits: {
          include: {
            // @ts-ignore
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