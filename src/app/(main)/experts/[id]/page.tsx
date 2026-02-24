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
    select: { name: true },
  });

  if (!expert) {
    return {
      title: "전문가를 찾을 수 없습니다",
    };
  }

  return {
    title: `${expert.name} - 전문가 프로필`,
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
