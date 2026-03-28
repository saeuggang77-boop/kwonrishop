import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import PartnerDetailClient from "./PartnerDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const partner = await prisma.partnerService.findUnique({
    where: { id },
    select: { companyName: true, description: true, serviceType: true, images: { take: 1, select: { url: true } } },
  });

  if (!partner) {
    return { title: "협력업체를 찾을 수 없습니다 - 권리샵" };
  }

  const description = partner.description?.slice(0, 160).replace(/\n/g, " ") || `${partner.companyName} - 창업 협력업체`;

  return {
    title: `${partner.companyName} - 협력업체 - 권리샵`,
    description,
    openGraph: {
      title: `${partner.companyName} - 권리샵 협력업체`,
      description,
      type: "website",
      siteName: "권리샵",
      ...(partner.images[0] && { images: [{ url: partner.images[0].url }] }),
    },
  };
}

export default function PartnerDetailPage() {
  return <PartnerDetailClient />;
}
