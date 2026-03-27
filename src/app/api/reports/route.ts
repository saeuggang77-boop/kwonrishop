import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/sanitize";
import { validateOrigin } from "@/lib/csrf";

export async function POST(request: Request) {
  try {
    // Rate limiting: 10 requests per minute
    const ip = getClientIp(request);
    const limiter = rateLimit(ip, 10, 60000);
    if (!limiter.success) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    // CSRF protection
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { targetId, targetType, reason, detail } = body;

    // Sanitize inputs
    const cleanReason = sanitizeInput(reason);
    const cleanDetail = detail ? sanitizeInput(detail) : null;

    // Validate required fields
    if (!targetId || !targetType || !cleanReason) {
      return NextResponse.json(
        { error: "targetId, targetType, and reason are required" },
        { status: 400 }
      );
    }

    // Validate targetType
    const validTargetTypes = ["LISTING", "POST", "USER", "EQUIPMENT"];
    if (!validTargetTypes.includes(targetType)) {
      return NextResponse.json(
        { error: `Invalid targetType. Must be one of: ${validTargetTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        reporterId: session.user.id,
        targetId,
        targetType,
        reason: cleanReason,
        detail: cleanDetail,
        status: "PENDING",
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}
