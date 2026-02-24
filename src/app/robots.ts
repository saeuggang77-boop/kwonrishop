import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kwonrishop.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/my/", "/admin/", "/premium/checkout/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
