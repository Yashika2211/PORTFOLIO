import type { MetadataRoute } from "next";
import { profile } from "@/data/portfolio";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: profile.siteUrl, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${profile.siteUrl}/recruiter`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];
}
