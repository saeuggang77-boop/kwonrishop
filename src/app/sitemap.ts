import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.kwonrishop.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/listings`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/franchise`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/partners`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/equipment`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  try {
    // Dynamic listing pages
    const listings = await prisma.listing.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, updatedAt: true },
    });

    const listingPages: MetadataRoute.Sitemap = listings.map((listing) => ({
      url: `${baseUrl}/listings/${listing.id}`,
      lastModified: listing.updatedAt,
      changeFrequency: "daily",
      priority: 0.8,
    }));

    // Dynamic franchise pages
    const franchises = await prisma.franchiseBrand.findMany({
      select: { id: true, updatedAt: true },
    });

    const franchisePages: MetadataRoute.Sitemap = franchises.map((franchise) => ({
      url: `${baseUrl}/franchise/${franchise.id}`,
      lastModified: franchise.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    // Dynamic community pages
    const posts = await prisma.post.findMany({
      select: { id: true, updatedAt: true },
    });

    const communityPages: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${baseUrl}/community/${post.id}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    // Dynamic equipment pages
    const equipments = await prisma.equipment.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, updatedAt: true },
    });

    const equipmentPages: MetadataRoute.Sitemap = equipments.map((equip) => ({
      url: `${baseUrl}/equipment/${equip.id}`,
      lastModified: equip.updatedAt,
      changeFrequency: "daily",
      priority: 0.7,
    }));

    // Dynamic partner pages
    const partners = await prisma.partnerService.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, updatedAt: true },
    });

    const partnerPages: MetadataRoute.Sitemap = partners.map((partner) => ({
      url: `${baseUrl}/partners/${partner.id}`,
      lastModified: partner.updatedAt,
      changeFrequency: "daily",
      priority: 0.7,
    }));

    return [...staticPages, ...listingPages, ...franchisePages, ...communityPages, ...equipmentPages, ...partnerPages];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Return at least static pages if database query fails
    return staticPages;
  }
}
