import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const VALID_PROVIDERS = ["hometax", "crefia", "baemin", "yogiyo", "coupangeats"] as const;
type Provider = (typeof VALID_PROVIDERS)[number];

function isValidProvider(p: string): p is Provider {
  return (VALID_PROVIDERS as readonly string[]).includes(p);
}

// GET: 연동 상태 확인
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { provider } = await params;
  if (!isValidProvider(provider)) {
    return NextResponse.json({ error: "지원하지 않는 연동 서비스입니다." }, { status: 400 });
  }

  const integration = await prisma.salesIntegration.findUnique({
    where: { userId_provider: { userId: session.user.id, provider } },
    select: { status: true, lastSynced: true, salesData: true },
  });

  return NextResponse.json({
    connected: integration?.status === "connected",
    status: integration?.status ?? "none",
    lastSynced: integration?.lastSynced ?? null,
    data: integration?.salesData ?? null,
  });
}

// POST: 연동 시작
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { provider } = await params;
  if (!isValidProvider(provider)) {
    return NextResponse.json({ error: "지원하지 않는 연동 서비스입니다." }, { status: 400 });
  }

  // TODO: 실제 OAuth/API 연동 구현
  // 1. 해당 서비스의 OAuth 인증 URL 생성
  // 2. 사용자 리다이렉트
  // 3. 콜백에서 토큰 저장
  // 4. 매출 데이터 가져오기

  return NextResponse.json({
    status: "not_implemented",
    message: "연동 기능은 준비 중입니다. 곧 제공될 예정입니다.",
  });
}

// DELETE: 연동 해제
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { provider } = await params;
  if (!isValidProvider(provider)) {
    return NextResponse.json({ error: "지원하지 않는 연동 서비스입니다." }, { status: 400 });
  }

  await prisma.salesIntegration.deleteMany({
    where: { userId: session.user.id, provider },
  });

  return NextResponse.json({ success: true });
}
