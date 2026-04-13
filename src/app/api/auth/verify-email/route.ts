import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/password";
import { rateLimitRequest } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const rateLimitError = await rateLimitRequest(req, 10, 60000);
  if (rateLimitError) {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/login?error=RateLimit`);
  }

  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  if (!token || !email) {
    return NextResponse.redirect(`${baseUrl}/login?error=InvalidToken`);
  }

  try {
    const hashedToken = hashToken(token);
    const identifier = `email-verify:${email.toLowerCase()}`;

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier,
        token: hashedToken,
      },
    });

    if (!verificationToken) {
      return NextResponse.redirect(`${baseUrl}/login?error=InvalidToken`);
    }

    if (verificationToken.expires < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token,
          },
        },
      });
      return NextResponse.redirect(`${baseUrl}/login?error=TokenExpired`);
    }

    // Update user emailVerified
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { emailVerified: new Date() },
    });

    // Delete the used token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        },
      },
    });

    return NextResponse.redirect(`${baseUrl}/login?verified=true`);
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(`${baseUrl}/login?error=VerificationFailed`);
  }
}
