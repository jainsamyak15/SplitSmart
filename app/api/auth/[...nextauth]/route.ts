import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const schema = z.object({
      phone: z.string().min(10),
      otp: z.string().length(6),
    });

    const { phone, otp } = schema.parse(body);

    // In production, verify OTP here
    if (otp !== "123456") {
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 401 }
      );
    }

    let user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { phone },
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}