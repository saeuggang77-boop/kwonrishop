import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ListingDetailClient from "./ListingDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      storeName: true,
      addressRoad: true,
      deposit: true,
      monthlyRent: true,
      premium: true,
      premiumNone: true,
      description: true,
      category: { select: { name: true } },
      images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
    },
  });

  if (!listing) {
    return { title: "매물을 찾을 수 없습니다 - 권리샵" };
  }

  const name = listing.storeName || listing.addressRoad || "매물";
  const title = `${name} - 권리샵`;
  const premiumText = listing.premiumNone ? "무권리" : `권리금 ${listing.premium.toLocaleString()}만`;
  const description = `${listing.category?.name || "상가"} | 보증금 ${listing.deposit.toLocaleString()}만 · 월세 ${listing.monthlyRent.toLocaleString()}만 · ${premiumText}${listing.description ? ` | ${listing.description.slice(0, 80)}` : ""}`;
  const imageUrl = listing.images[0]?.url;

  return {
    title,
    description,
    alternates: {
      canonical: `/listings/${id}`,
    },
    openGraph: {
      title,
      description,
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: name }] : [],
      type: "website",
      siteName: "권리샵",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default function Page() {
  return <ListingDetailClient />;
}
