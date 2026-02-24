import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ExpertDetailClient from "./expert-detail-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  const expert = await prisma.expert.findUnique({
    where: { id: decodedId },
    select: {
      name: true,
      title: true,
      category: true,
      career: true,
      rating: true,
      reviewCount: true,
    },
  });

  if (!expert) {
    return {
      title: "전문가를 찾을 수 없습니다",
    };
  }

  const pageTitle = `${expert.name} - ${expert.category} 전문가 | 권리샵`;

  const descParts: string[] = [];
  if (expert.title) descParts.push(expert.title);
  if (expert.career) descParts.push(`경력 ${expert.career}년`);
  if (expert.rating && expert.reviewCount) {
    descParts.push(`평점 ${expert.rating.toFixed(1)} (${expert.reviewCount}건)`);
  }

  const description = descParts.join(' | ');

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
    },
  };
}

export default async function ExpertDetailPage({ params }: PageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  const expert = await prisma.expert.findUnique({
    where: { id: decodedId },
    select: { id: true },
  });

  if (!expert) {
    notFound();
  }

  return <ExpertDetailClient />;
}
