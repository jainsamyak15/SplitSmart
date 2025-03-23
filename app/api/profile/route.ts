import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export async function PATCH(req: Request) {
  try {
    const schema = z.object({
      userId: z.string(),
      name: z.string().min(1),
      email: z.string().email().optional().nullable(),
      image: z.string().optional().nullable(), // Removed .url() validation
    });

    const body = await req.json();
    const { userId, ...data } = schema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 400 }
    );
  }
}