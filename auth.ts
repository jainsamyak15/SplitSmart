import NextAuth from "next-auth";
import { PrismaClient } from "@prisma/client";
import CredentialsProvider from "next-auth/providers/credentials";

const prisma = new PrismaClient();

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Phone Number",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials: Partial<Record<"phone" | "otp", unknown>>) {
        const phone = credentials.phone as string;
        const otp = credentials.otp as string;

        if (!phone || !otp) return null;

        // In production, verify OTP here
        if (otp !== "123456") return null;

        let user = await prisma.user.findUnique({
          where: { phone },
        });

        if (!user) {
          user = await prisma.user.create({
            data: { phone: phone },
          });
        }

        return {
          id: user.id,
          phone: user.phone,
          name: user.name,
        };
      },
    }),
  ],
  pages: {
    signIn: "/",
  },
  session: { strategy: "jwt" },
});