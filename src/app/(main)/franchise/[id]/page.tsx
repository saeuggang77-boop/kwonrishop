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

  const franchise = await prisma.franchise.findUnique({
    where: { id: decodedId },
    select: { brandName: true },
  });

  if (!franchise) {
    return {
      title: "프랜차이즈를 찾을 수 없습니다",
    };
  }

  return {
    title: `${franchise.brandName} - 프랜차이즈 상세 정보`,
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
