import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const host = "https://autodraw.ink";
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/app"],
    },
    host,
    sitemap: `${host}/sitemap.xml`,
  };
}
