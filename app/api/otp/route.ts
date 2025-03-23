import { NextResponse } from "next/server";
import { z } from "zod";

// Simple in-memory store for development OTPs
let currentOtp: string | null = null;

export async function POST(req: Request) {
  try {
    const schema = z.object({
      phone: z.string().min(10),
    });

    const body = await req.json();
    const { phone } = schema.parse(body);

    // In production, integrate with SMS provider here
    // For demo, we'll use a fixed OTP: 123456
    currentOtp = "123456";

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}

// Development only - endpoint to get the current OTP
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }
  
  return NextResponse.json({ otp: currentOtp });
}