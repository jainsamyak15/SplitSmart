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
    });

    const body = await req.json();
    const data = schema.parse(body);

    const settlement = await prisma.settlement.create({
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

    return NextResponse.json(settlement);
  } catch (error) {
    console.error("Create settlement error:", error);
    return NextResponse.json(
      { error: "Failed to create settlement" },
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const settlements = await prisma.settlement.findMany({
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