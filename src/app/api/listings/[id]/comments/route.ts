import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// ---------------------------------------------------------------------------
// GET /api/listings/[id]/comments — fetch top-level comments with replies
// ---------------------------------------------------------------------------

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;

  try {
    // Look up listing to get sellerId
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { sellerId: true },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "매물을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Optional auth — not required, but used for secret comment filtering
    const session = await auth();
    const currentUserId = session?.user?.id ?? null;

    // Fetch top-level comments (parentId IS NULL) with 1-depth replies
    const comments = await prisma.listingComment.findMany({
      where: { listingId, parentId: null },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, name: true, image: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    // Process secret comments — hide content if the viewer is not the
    // comment author and not the listing seller.
    const processComment = (
      comment: (typeof comments)[number] | (typeof comments)[number]["replies"][number]
    ) => {
      const isHidden =
        comment.isSecret &&
        currentUserId !== comment.userId &&
        currentUserId !== listing.sellerId;

      return {
        ...comment,
        content: isHidden ? null : comment.content,
        isHidden,
      };
    };

    const data = comments.map((comment) => ({
      ...processComment(comment),
      replies: "replies" in comment
        ? comment.replies.map((reply) => processComment(reply))
        : [],
    }));

    return new Response(
      JSON.stringify({ data, sellerId: listing.sellerId }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "댓글을 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/listings/[id]/comments — create a new comment or reply
// ---------------------------------------------------------------------------

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "인증이 필요합니다" },
      { status: 401 }
    );
  }

  const { id: listingId } = await params;

  try {
    // Parse and validate body
    const body = await request.json();
    const { content, isSecret, parentId } = body as {
      content?: string;
      isSecret?: boolean;
      parentId?: string;
    };

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "댓글 내용을 입력해주세요" },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: "댓글은 1000자 이내로 작성해주세요" },
        { status: 400 }
      );
    }

    // Verify listing exists and get sellerId for notifications
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, sellerId: true },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "매물을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // If parentId is provided, validate the parent comment
    let parentComment: { id: string; userId: string; parentId: string | null } | null =
      null;

    if (parentId) {
      parentComment = await prisma.listingComment.findUnique({
        where: { id: parentId },
        select: { id: true, userId: true, parentId: true },
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: "원 댓글을 찾을 수 없습니다" },
          { status: 404 }
        );
      }

      // Only 1 depth of replies allowed — parent must be a top-level comment
      if (parentComment.parentId !== null) {
        return NextResponse.json(
          { error: "대댓글에는 답글을 달 수 없습니다" },
          { status: 400 }
        );
      }
    }

    // Create the comment
    const comment = await prisma.listingComment.create({
      data: {
        listingId,
        userId: session.user.id,
        content: content.trim(),
        isSecret: isSecret ?? false,
        parentId: parentId ?? null,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    // Fire-and-forget notifications
    const notificationPromises: Promise<unknown>[] = [];

    // 1. Notify listing seller about the new comment
    if (listing.sellerId !== session.user.id) {
      notificationPromises.push(
        prisma.notification.create({
          data: {
            userId: listing.sellerId,
            title: "새 댓글",
            message: "내 매물에 새 댓글이 달렸습니다",
            sourceType: "comment",
            sourceId: comment.id,
            link: `/listings/${listingId}`,
          },
        })
      );
    }

    // 2. If it's a reply, notify the parent comment author
    if (parentComment && parentComment.userId !== session.user.id) {
      notificationPromises.push(
        prisma.notification.create({
          data: {
            userId: parentComment.userId,
            title: "새 답글",
            message: "내 댓글에 답글이 달렸습니다",
            sourceType: "comment_reply",
            sourceId: comment.id,
            link: `/listings/${listingId}`,
          },
        })
      );
    }

    // Do not await — fire and forget
    if (notificationPromises.length > 0) {
      Promise.allSettled(notificationPromises).catch(() => {
        // Silently ignore notification errors
      });
    }

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "댓글 작성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
