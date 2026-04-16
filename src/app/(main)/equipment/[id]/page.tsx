import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import EquipmentDetailClient from "./EquipmentDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const equipment = await prisma.equipment.findUnique({
    where: { id },
    select: { title: true, description: true, price: true, category: true, images: { take: 1, select: { url: true } } },
  });

  if (!equipment) {
    return { title: "상품을 찾을 수 없습니다 - 권리샵" };
  }

  const priceText = equipment.price === 0 ? "무료 나눔" : `${equipment.price.toLocaleString()}원`;
  const description = equipment.description?.slice(0, 160).replace(/\n/g, " ") || `${equipment.title} - ${priceText}`;

  return {
    title: `${equipment.title} - 집기장터 - 권리샵`,
    description,
    alternates: {
      canonical: `/equipment/${id}`,
    },
    openGraph: {
      title: `${equipment.title} - ${priceText}`,
      description,
      type: "website",
      siteName: "권리샵",
      ...(equipment.images[0] && { images: [{ url: equipment.images[0].url }] }),
    },
  };
}

export default async function EquipmentDetailPage({ params }: Props) {
  const { id } = await params;
  const equipment = await prisma.equipment.findUnique({
    where: { id },
    select: {
      title: true,
      description: true,
      price: true,
      status: true,
      images: { take: 1, select: { url: true } },
    },
  });

  const jsonLd = equipment
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: equipment.title,
        description: equipment.description?.slice(0, 160) ?? undefined,
        image: equipment.images[0]?.url ?? undefined,
        offers: {
          "@type": "Offer",
          price: equipment.price,
          priceCurrency: "KRW",
          availability:
            equipment.status === "ACTIVE"
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
        },
        itemCondition: "https://schema.org/UsedCondition",
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <EquipmentDetailClient />
    </>
  );
}
