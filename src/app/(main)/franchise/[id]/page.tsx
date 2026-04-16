import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import FranchiseDetailClient from "./FranchiseDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const brand = await prisma.franchiseBrand.findUnique({
    where: { id },
    select: {
      brandName: true,
      companyName: true,
      industry: true,
      description: true,
      franchiseFee: true,
      totalStores: true,
      avgRevenue: true,
      bannerImage: true,
      majorProductName: true,
    },
  });

  if (!brand) {
    return { title: "브랜드를 찾을 수 없습니다 - 권리샵" };
  }

  const title = `${brand.brandName} - 프랜차이즈 - 권리샵`;
  const parts = [brand.industry];
  if (brand.majorProductName) parts.push(brand.majorProductName);
  if (brand.franchiseFee !== null) parts.push(`가맹비 ${brand.franchiseFee.toLocaleString()}만원`);
  if (brand.totalStores !== null) parts.push(`매장 ${brand.totalStores.toLocaleString()}개`);
  if (brand.avgRevenue !== null) parts.push(`평균매출 월 ${brand.avgRevenue.toLocaleString()}만원`);
  const description = `${brand.brandName} (${brand.companyName}) | ${parts.join(" · ")}${brand.description ? ` | ${brand.description.slice(0, 80)}` : ""}`;
  const imageUrl = brand.bannerImage;

  return {
    title,
    description,
    alternates: {
      canonical: `/franchise/${id}`,
    },
    openGraph: {
      title,
      description,
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: brand.brandName }] : [],
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

export default async function Page({ params }: Props) {
  const { id } = await params;
  const brand = await prisma.franchiseBrand.findUnique({
    where: { id },
    select: {
      brandName: true,
      description: true,
      industry: true,
      totalStores: true,
      bannerImage: true,
    },
  });

  const jsonLd = brand
    ? {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: brand.brandName,
        description: brand.description?.slice(0, 160) ?? undefined,
        image: brand.bannerImage ?? undefined,
        url: `https://www.kwonrishop.com/franchise/${id}`,
        industry: brand.industry ?? undefined,
        numberOfEmployees: brand.totalStores != null ? `${brand.totalStores} stores` : undefined,
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
      <FranchiseDetailClient />
    </>
  );
}
