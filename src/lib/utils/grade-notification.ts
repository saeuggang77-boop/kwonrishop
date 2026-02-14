import { prisma } from "@/lib/prisma";

const GRADE_RANK: Record<string, number> = { A: 3, B: 2, C: 1 };

export async function notifyGradeUpgrade(
  userId: string,
  listingId: string,
  listingTitle: string,
  oldGrade: string | null,
  newGrade: string,
) {
  const oldRank = oldGrade ? (GRADE_RANK[oldGrade] ?? 0) : 0;
  const newRank = GRADE_RANK[newGrade] ?? 0;

  if (newRank <= oldRank) return;

  await prisma.notification.create({
    data: {
      userId,
      title: "안전등급 업그레이드",
      message: oldGrade
        ? `매물 "${listingTitle}"의 안전등급이 ${oldGrade}→${newGrade}등급으로 업그레이드되었습니다. 매물 노출 우선순위가 높아집니다.`
        : `매물 "${listingTitle}"의 안전등급이 ${newGrade}등급으로 설정되었습니다.`,
      link: `/listings/${listingId}`,
      sourceType: "grade_upgrade",
      sourceId: listingId,
    },
  });
}
