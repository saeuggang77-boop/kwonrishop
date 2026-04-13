import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GhostPersonality } from "@/generated/prisma/client";
import { sanitizeInput } from "@/lib/sanitize";

// 형용사 배열 (60개) - 상가거래/창업 맞춤
const ADJECTIVES = [
  "열정적인", "성공하는", "똑똑한", "부지런한", "긍정적인", "행복한", "창의적인", "센스있는", "든든한", "멋진",
  "씩씩한", "당당한", "용감한", "꼼꼼한", "차분한", "침착한", "여유로운", "활발한", "밝은", "따뜻한",
  "친절한", "상냥한", "정직한", "성실한", "근면한", "신중한", "꾸준한", "열심히하는", "노력하는", "도전하는",
  "패기넘치는", "실력있는", "유능한", "탁월한", "뛰어난", "훌륭한", "프로다운", "전문적인", "믿음직한", "책임감있는",
  "알뜰한", "똑소리나는", "야무진", "영리한", "슬기로운", "지혜로운", "합리적인", "효율적인", "체계적인", "계획적인",
  "꿈꾸는", "희망찬", "설레는", "기대되는", "빛나는", "반짝이는", "빛나는", "찬란한", "환한", "푸근한",
];

// 명사 배열 (60개) - 상가거래/창업 관련
const NOUNS = [
  "사장님", "대표님", "점주", "매니저", "주인장", "운영자", "창업자", "자영업자", "경영인", "상인",
  "카페러버", "카페지기", "커피러버", "베이커리러버", "디저트러버", "맛집지기", "음식점주인", "레스토랑주인", "치킨집사장", "분식집사장",
  "편의점지기", "마트사장", "슈퍼사장", "약국사장", "의류샵사장", "잡화점주인", "뷰티샵사장", "네일샵사장", "헤어샵사장", "피부샵사장",
  "부동산전문가", "매물전문가", "임대전문가", "상가전문가", "권리금전문가", "투자전문가", "컨설턴트", "매매전문가", "중개인", "분석가",
  "프랜차이즈러버", "가맹점주", "브랜드사장", "체인점주", "본사담당", "슈퍼바이저", "가맹담당", "지점장", "팀장", "실장",
  "리더", "플래너", "기획자", "전략가", "마케터", "홍보담당", "영업맨", "세일즈맨", "상담사", "코디네이터",
];

/**
 * 형용사 + 명사 조합으로 유령회원 닉네임 생성
 * 예: "열정적인사장님", "성공하는카페러버"
 */
function generateGhostNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return adj + noun;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const ghostUsers = await prisma.user.findMany({
      where: {
        isGhost: true,
      },
      select: {
        id: true,
        name: true,
        ghostPersonality: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ ghostUsers });
  } catch (error) {
    console.error("Ghost user fetch error:", error);
    return NextResponse.json(
      { error: "유령회원 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const body = await request.json();
    const { count = 10 } = body;

    if (count < 1 || count > 100) {
      return NextResponse.json(
        { error: "생성 수는 1~100 사이여야 합니다" },
        { status: 400 }
      );
    }

    const personalities: GhostPersonality[] = [
      "CHATTY",
      "ADVISOR",
      "QUESTIONER",
      "EMOJI_LOVER",
      "CALM",
      "SASSY",
    ];

    // 이미 사용 중인 닉네임 조회
    const existingUsers = await prisma.user.findMany({
      where: { isGhost: true },
      select: { name: true },
    });
    const usedNames = new Set(existingUsers.map(u => u.name));

    const users = [];
    let created = 0;
    const maxAttempts = 10; // 닉네임 생성 최대 시도 횟수

    for (let i = 0; i < count; i++) {
      let nickname = "";
      let attempts = 0;

      // 중복되지 않는 닉네임 생성 (최대 10회 시도)
      while (attempts < maxAttempts) {
        nickname = generateGhostNickname();
        if (!usedNames.has(nickname)) {
          usedNames.add(nickname); // 이번 배치에서도 중복 방지
          break;
        }
        attempts++;
      }

      // 10회 시도해도 중복이면 건너뛰기
      if (attempts >= maxAttempts) {
        continue;
      }

      const personality =
        personalities[Math.floor(Math.random() * personalities.length)];

      users.push({
        name: nickname,
        email: `ghost_${Date.now()}_${i}@ghost.local`,
        role: "BUYER" as const,
        isGhost: true,
        ghostPersonality: personality,
      });
      created++;
    }

    if (users.length === 0) {
      return NextResponse.json(
        { error: "유일한 닉네임 생성에 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 400 }
      );
    }

    await prisma.user.createMany({
      data: users,
    });

    const msg = created < count
      ? `${created}명 생성 (${count - created}명은 닉네임 중복으로 미생성)`
      : `${created}명의 유령회원이 생성되었습니다`;

    return NextResponse.json({
      message: msg,
      created: created,
    });
  } catch (error) {
    console.error("Ghost user creation error:", error);
    return NextResponse.json(
      { error: "유령회원 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name } = body;

    if (!id || !name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "유효한 ID와 닉네임이 필요합니다" },
        { status: 400 }
      );
    }

    // 닉네임 중복 체크
    const nameExists = await prisma.user.findFirst({
      where: { name: name.trim(), id: { not: id } },
      select: { id: true },
    });
    if (nameExists) {
      return NextResponse.json(
        { error: "이미 사용 중인 닉네임입니다" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { name: sanitizeInput(name.trim()) },
      select: {
        id: true,
        name: true,
        ghostPersonality: true,
      },
    });

    return NextResponse.json({
      message: "닉네임이 수정되었습니다",
      user: updated,
    });
  } catch (error) {
    console.error("Ghost user update error:", error);
    return NextResponse.json(
      { error: "유령회원 수정에 실패했습니다" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    // body JSON 또는 query param 둘 다 지원
    let ids: string[] = [];
    try {
      const body = await request.json();
      ids = body.ids || (body.id ? [body.id] : []);
    } catch {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");
      if (id) ids = [id];
    }

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "유저 ID가 필요합니다" },
        { status: 400 }
      );
    }

    await prisma.user.deleteMany({
      where: { id: { in: ids }, isGhost: true },
    });

    return NextResponse.json({
      message: `${ids.length}명의 유령회원이 삭제되었습니다`,
      deletedCount: ids.length,
    });
  } catch (error) {
    console.error("Ghost user delete error:", error);
    return NextResponse.json(
      { error: "유령회원 삭제에 실패했습니다" },
      { status: 500 }
    );
  }
}
