// import { NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";
// import { Twilio } from "twilio";

// const prisma = new PrismaClient();

// // Create a simple OTP store with expiration timestamps
// interface OTPData {
//   code: string;
//   expiresAt: number;
// }

// const otpStore = new Map<string, OTPData>();
// const OTP_EXPIRY_SECONDS = 120; // 2 minutes

// // Initialize Twilio client
// const twilioClient = new Twilio(
//   process.env.TWILIO_ACCOUNT_SID!,
//   process.env.TWILIO_AUTH_TOKEN!
// );

// function validatePhoneNumber(phone: string): string {
//   // Remove any non-digit characters
//   const digits = phone.replace(/\D/g, '');

//   // Check if it's a valid 10-digit number
//   if (digits.length === 10) {
//     return digits;
//   }

//   throw new Error("Invalid phone number format");
// }

// export async function POST(req: Request) {
//   try {
//     let { phone } = await req.json();

//     try {
//       phone = validatePhoneNumber(phone);
//     } catch (error) {
//       return NextResponse.json(
//         { error: "Please enter a valid 10-digit phone number." },
//         { status: 400 }
//       );
//     }

//     // Generate a 6-digit OTP
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     // Store OTP with expiration timestamp
//     const expiresAt = Date.now() + OTP_EXPIRY_SECONDS * 1000;
//     otpStore.set(phone, { code: otp, expiresAt });

//     // Send OTP via Twilio
//     try {
//       await twilioClient.messages.create({
//         body: `Your OTP is ${otp}. It will expire in ${OTP_EXPIRY_SECONDS} seconds.`,
//         from: process.env.TWILIO_PHONE_NUMBER,
//         to: `+91${phone}`, // Assuming Indian phone numbers
//       });
//     } catch (error) {
//       console.error("Failed to send OTP via Twilio:", error);
//       return NextResponse.json(
//         { error: "Failed to send OTP. Please try again." },
//         { status: 500 }
//       );
//     }

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error("OTP generation error:", error);
//     return NextResponse.json(
//       { error: "Failed to send OTP. Please try again." },
//       { status: 400 }
//     );
//   }
// }

// export async function PUT(req: Request) {
//   try {
//     let { phone, otp } = await req.json();

//     try {
//       phone = validatePhoneNumber(phone);
//     } catch (error) {
//       return NextResponse.json(
//         { error: "Invalid phone number format" },
//         { status: 400 }
//       );
//     }

//     // Verify OTP
//     const storedData = otpStore.get(phone);
//     if (!storedData) {
//       return NextResponse.json(
//         { error: "OTP not found. Please request a new one." },
//         { status: 401 }
//       );
//     }

//     // Check if OTP has expired
//     if (Date.now() > storedData.expiresAt) {
//       otpStore.delete(phone); // Clean up expired OTP
//       return NextResponse.json(
//         { error: "OTP has expired. Please request a new one." },
//         { status: 401 }
//       );
//     }

//     // Verify OTP code
//     if (storedData.code !== otp) {
//       return NextResponse.json(
//         { error: "Invalid OTP" },
//         { status: 401 }
//       );
//     }

//     // Clear used OTP
//     otpStore.delete(phone);

//     // Get or create user in our database
//     const user = await prisma.user.upsert({
//       where: { phone },
//       update: {},
//       create: { phone },
//       select: {
//         id: true,
//         name: true,
//         phone: true,
//         email: true,
//         image: true,
//       },
//     });

//     return NextResponse.json({ user });
//   } catch (error) {
//     console.error("Authentication error:", error);
//     return NextResponse.json(
//       { error: "Authentication failed" },
//       { status: 400 }
//     );
//   }
// }
import { NextResponse } from "next/server";
import { ManagementClient } from "auth0";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create a simple OTP store with expiration timestamps
interface OTPData {
  code: string;
  expiresAt: number;
}

const otpStore = new Map<string, OTPData>();
const OTP_EXPIRY_SECONDS = 120; // 5 minutes

function validatePhoneNumber(phone: string): string {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Check if it's a valid 10-digit number
  if (digits.length === 10) {
    return digits;
  }
  
  throw new Error('Invalid phone number format');
}

let auth0: ManagementClient | null = null;

// Initialize Auth0 client only if environment variables are available
try {
  if (process.env.AUTH0_DOMAIN && process.env.AUTH0_CLIENT_ID && process.env.AUTH0_CLIENT_SECRET) {
    auth0 = new ManagementClient({
      domain: process.env.AUTH0_DOMAIN,
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
    });
  }
} catch (error) {
  console.error('Failed to initialize Auth0 client:', error);
}

export async function POST(req: Request) {
  try {
    let { phone } = await req.json();

    try {
      phone = validatePhoneNumber(phone);
    } catch (error) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit phone number." },
        { status: 400 }
      );
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiration timestamp
    const expiresAt = Date.now() + (OTP_EXPIRY_SECONDS * 1000);
    otpStore.set(phone, { code: otp, expiresAt });
    
    // Always log the OTP and expiry for debugging
    console.log(`OTP for ${phone}: ${otp} (expires in ${OTP_EXPIRY_SECONDS} seconds)`);

    // In development, return the OTP and expiry in the response
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_SHOW_OTP === 'true') {
      return NextResponse.json({ 
        success: true, 
        otp,
        expiresIn: OTP_EXPIRY_SECONDS
      });
    }

    // In production, only return success status
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("OTP generation error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP. Please try again." },
      { status: 400 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    let { phone, otp } = await req.json();

    try {
      phone = validatePhoneNumber(phone);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Verify OTP
    const storedData = otpStore.get(phone);
    if (!storedData) {
      return NextResponse.json(
        { error: "OTP not found. Please request a new one." },
        { status: 401 }
      );
    }

    // Check if OTP has expired
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(phone); // Clean up expired OTP
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 401 }
      );
    }

    // Verify OTP code
    if (storedData.code !== otp) {
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 401 }
      );
    }

    // Clear used OTP
    otpStore.delete(phone);

    // Get or create user in our database
    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        image: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Authentication error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 400 }
    );
  }
}