/**
 * Site-wide configuration for the Strollz landing page.
 *
 * NEXT_PUBLIC_SITE_URL sets canonical URLs, the sitemap and Open Graph links.
 * NEXT_PUBLIC_CONTACT_EMAIL, when set, turns the waitlist call to action into a
 * mailto link. When it is not set the page says the waitlist is coming soon,
 * because nothing on this site stores sign-ups yet.
 */
export const site = {
  name: "Strollz",
  tagline: "Walk the streets you have never walked.",
  description:
    "Strollz plans a walking loop from your door through streets you have not walked yet, with short notes about what you pass and a link to where each fact comes from. In development, pilot planned.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null,
  lastUpdated: "2026-11-01",
} as const;

export function waitlistHref(): string | null {
  if (!site.contactEmail) return null;
  const subject = encodeURIComponent("Strollz waitlist");
  const body = encodeURIComponent(
    "Hi, I would like to try Strollz.\n\nMy city or neighborhood:\nHow I usually walk (dog, stroller, commute, exercise, other):\n",
  );
  return `mailto:${site.contactEmail}?subject=${subject}&body=${body}`;
}
