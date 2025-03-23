import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const schema = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      userId: z.string(),
    });

    const body = await req.json();
    const data = schema.parse(body);

    const group = await prisma.group.create({
      data: {
        name: data.name,
        description: data.description,
        members: {
          create: {
            userId: data.userId,
            role: "ADMIN",
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error("Failed to create group:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
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

    // Get all groups where the user is a member
    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        expenses: true,
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Failed to fetch groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}