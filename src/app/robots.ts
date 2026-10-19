import type { MetadataRoute } from "next";
import { profile } from "@/data/portfolio";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${profile.siteUrl}/sitemap.xml`,
  };
}
