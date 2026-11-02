import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// Rendered once at build time for the static export.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f2",
    theme_color: "#182a25",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
