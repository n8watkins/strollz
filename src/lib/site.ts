/**
 * Site-wide configuration for the Strollz landing page.
 *
 * NEXT_PUBLIC_SITE_URL sets canonical URLs, the sitemap and Open Graph links.
 * The waitlist lives on n8builds.dev, where the owner builds in public; this
 * site has no forms and stores nothing.
 */
export const site = {
  name: "Strollz",
  tagline: "Walk the streets you have never walked.",
  description:
    "Strollz plans a walking loop from your door through streets you have not walked yet, with short notes about what you pass and a link to where each fact comes from. In development, Los Angeles pilot planned.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  waitlistUrl: "https://n8builds.dev/upcoming?interest=strollz#strollz",
  builderUrl: "https://n8builds.dev",
  lastUpdated: "2026-11-01",
} as const;
