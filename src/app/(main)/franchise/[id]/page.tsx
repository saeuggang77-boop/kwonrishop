import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FranchiseDetailClient from "./franchise-detail-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  function formatPrice(amount: bigint | number | null): string {
    if (!amount) return '';
    const n = Number(amount);
    if (n >= 100000000) return `${(n/100000000).toFixed(1)}억`;
    if (n >= 10000) return `${Math.round(n/10000).toLocaleString()}만`;
    return n.toLocaleString();
  }

  const franchise = await prisma.franchise.findUnique({
    where: { id: decodedId },
    select: {
      brandName: true,
      category: true,
      subcategory: true,
      monthlyAvgSales: true,
      startupCost: true,
      storeCount: true,
    },
  });

  if (!franchise) {
    return {
      title: "프랜차이즈를 찾을 수 없습니다",
    };
  }

  const title = `${franchise.brandName} - 프랜차이즈 상세 정보 | 권리샵`;

  const descParts: string[] = [];
  if (franchise.category) descParts.push(franchise.category);
  if (franchise.subcategory) descParts.push(franchise.subcategory);
  if (franchise.monthlyAvgSales) descParts.push(`평균매출 ${formatPrice(franchise.monthlyAvgSales)}`);
  if (franchise.startupCost) descParts.push(`창업비용 ${formatPrice(franchise.startupCost)}`);
  if (franchise.storeCount) descParts.push(`매장 ${franchise.storeCount}개`);

  const description = descParts.join(' | ');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function FranchiseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  const franchise = await prisma.franchise.findUnique({
    where: { id: decodedId },
    select: { id: true },
  });

  if (!franchise) {
    notFound();
  }

  return <FranchiseDetailClient />;
}
