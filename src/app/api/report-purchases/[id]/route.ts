import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { errorToResponse, NotFoundError } from "@/lib/utils/errors";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: { message: "인증이 필요합니다." } }, { status: 401 });
    }

    const { id } = await params;

    const purchase = await prisma.reportPurchase.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            id: true, title: true, address: true, city: true, district: true,
            businessCategory: true, businessSubtype: true, price: true,
            monthlyRent: true, premiumFee: true, managementFee: true,
            monthlyRevenue: true, monthlyProfit: true, operatingYears: true,
            areaM2: true, floor: true, safetyGrade: true,
          },
        },
        plan: { select: { name: true, displayName: true, price: true } },
        data: true,
      },
    });

    if (!purchase) throw new NotFoundError("리포트를 찾을 수 없습니다.");
    if (purchase.userId !== session.user.id && session.user.role !== "ADMIN") {
      return Response.json({ error: { message: "접근 권한이 없습니다." } }, { status: 403 });
    }

    return Response.json({
      data: {
        ...purchase,
        listing: {
          ...purchase.listing,
          price: Number(purchase.listing.price),
          monthlyRent: purchase.listing.monthlyRent ? Number(purchase.listing.monthlyRent) : null,
          premiumFee: purchase.listing.premiumFee ? Number(purchase.listing.premiumFee) : null,
          managementFee: purchase.listing.managementFee ? Number(purchase.listing.managementFee) : null,
          monthlyRevenue: purchase.listing.monthlyRevenue ? Number(purchase.listing.monthlyRevenue) : null,
          monthlyProfit: purchase.listing.monthlyProfit ? Number(purchase.listing.monthlyProfit) : null,
        },
        plan: { ...purchase.plan, price: Number(purchase.plan.price) },
      },
    });
  } catch (error) {
    return errorToResponse(error);
  }
}
