import Link from "next/link";
import { site } from "@/lib/site";

export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--ink)" />
      <path
        d="M10 22 L10 13 Q10 9 14 9 L21 9 Q24 9 24 12 L24 16 Q24 19 21 19 L16 19 L16 23"
        fill="none"
        stroke="var(--coral)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="22.5" r="2.6" fill="#fff" />
    </svg>
  );
}

const NAV = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/#compare", label: "Compare" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-rule/70 bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 rounded-md" aria-label={`${site.name} home`}>
          <LogoMark />
          <span className="font-display text-xl font-semibold tracking-tight">{site.name}</span>
        </Link>
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-7 text-[15px] text-ink-soft">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <a
          href={site.waitlistUrl}
          className="inline-flex h-10 items-center rounded-full bg-ink px-4 text-sm font-semibold text-paper transition-colors hover:bg-moss"
        >
          Join the waitlist
        </a>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const year = new Date(site.lastUpdated).getFullYear();
  return (
    <footer className="border-t border-rule bg-paper-deep">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="inline-flex items-center gap-2.5 rounded-md">
            <LogoMark />
            <span className="font-display text-lg font-semibold">{site.name}</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-6 text-ink-soft">
            A side project in development. Nothing here is live yet: no app, no accounts, no
            location data collected.
          </p>
        </div>
        <nav aria-label="Product">
          <h2 className="text-sm font-semibold">Product</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li><Link className="hover:text-ink" href="/#how-it-works">How it works</Link></li>
            <li><Link className="hover:text-ink" href="/#compare">Compare</Link></li>
            <li><Link className="hover:text-ink" href="/#pricing">Planned pricing</Link></li>
            <li><Link className="hover:text-ink" href="/#faq">FAQ</Link></li>
            <li><a className="hover:text-ink" href={site.waitlistUrl}>Join the waitlist</a></li>
          </ul>
        </nav>
        <nav aria-label="Legal and contact">
          <h2 className="text-sm font-semibold">About</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li><Link className="hover:text-ink" href="/privacy">Privacy</Link></li>
            <li><Link className="hover:text-ink" href="/terms">Terms</Link></li>
            <li><Link className="hover:text-ink" href="/attributions">Data and attributions</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-ink-soft sm:flex-row sm:items-start sm:justify-between sm:gap-8 sm:px-6">
          <p className="leading-5">
            &copy; {year} {site.name}. Map illustrations on this page are drawn by hand and show a
            fictional neighborhood.
          </p>
          <p className="shrink-0 leading-5">
            Built by N8 at{" "}
            <a className="font-semibold text-ink hover:underline hover:underline-offset-4" href={site.builderUrl}>
              n8builds.dev
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
