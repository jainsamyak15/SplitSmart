import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const schema = z.object({
      amount: z.number().positive(),
      fromId: z.string(),
      groupId: z.string(),
      description: z.string().optional(),
      splitIds: z.array(z.string()).optional(),
    });

    const body = await req.json();
    const data = schema.parse(body);

    // Start a transaction to create settlement and update splits
    const settlement = await prisma.$transaction(async (tx) => {
      // 1. Create the settlement
      const settlement = await tx.settlement.create({
        data: {
          amount: data.amount,
          fromId: data.fromId,
          groupId: data.groupId,
          description: data.description,
        },
        include: {
          from: true,
          group: true,
        },
      });

      // 2. If splitIds are provided, mark those splits as settled
      if (data.splitIds?.length) {
        await tx.split.updateMany({
          where: {
            id: {
              in: data.splitIds
            }
          },
          data: {
            settled: true
          }
        });
      }

      return settlement;
    });

    return NextResponse.json(settlement);
  } catch (error) {
    console.error("Create settlement error:", error);
    return NextResponse.json(
      { error: "Failed to create settlement" },
      { status: 400 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all groups where the user is either a member or an admin
    const userGroups = await prisma.groupMember.findMany({
      where: {
        userId,
        OR: [
          { role: "MEMBER" },
          { role: "ADMIN" }
        ]
      },
      select: { groupId: true }
    });

    const groupIds = userGroups.map(group => group.groupId);

    // Get settlements from groups where the user is a member or admin
    const settlements = await prisma.settlement.findMany({
      where: {
        groupId: {
          in: groupIds
        }
      },
      include: {
        from: true,
        group: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(settlements);
  } catch (error) {
    console.error("Fetch settlements error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settlements" },
      { status: 500 }
    );
  }
}