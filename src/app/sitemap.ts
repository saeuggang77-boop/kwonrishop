import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kwonrishop.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all dynamic data in parallel
  const [listings, franchises, experts, bbsPosts] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    }),
    prisma.franchise.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.expert.findMany({
      where: { isActive: true },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.boardPost.findMany({
      where: { isPublished: true },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/listings`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/franchise`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/experts`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/simulator`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/area-analysis`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/bbs`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/legal/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.2 },
    { url: `${BASE_URL}/legal/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.2 },
    { url: `${BASE_URL}/legal/disclaimer`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.2 },
  ];

  const listingRoutes: MetadataRoute.Sitemap = listings.map((listing) => ({
    url: `${BASE_URL}/listings/${listing.id}`,
    lastModified: listing.updatedAt,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const franchiseRoutes: MetadataRoute.Sitemap = franchises.map((franchise) => ({
    url: `${BASE_URL}/franchise/${franchise.id}`,
    lastModified: franchise.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const expertRoutes: MetadataRoute.Sitemap = experts.map((expert) => ({
    url: `${BASE_URL}/experts/${expert.id}`,
    lastModified: expert.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const bbsRoutes: MetadataRoute.Sitemap = bbsPosts.map((post) => ({
    url: `${BASE_URL}/bbs/${post.id}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [
    ...staticRoutes,
    ...listingRoutes,
    ...franchiseRoutes,
    ...expertRoutes,
    ...bbsRoutes,
  ];
}
