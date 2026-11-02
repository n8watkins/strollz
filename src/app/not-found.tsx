import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/chrome";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex max-w-3xl flex-col items-start px-4 py-24 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-coral-ink">404</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          This street does not go anywhere
        </h1>
        <p className="mt-5 text-lg leading-8 text-ink-soft">The page you were looking for does not exist.</p>
        <Link
          href="/"
          className="mt-8 inline-flex h-12 items-center rounded-full bg-ink px-6 font-semibold text-paper hover:bg-moss"
        >
          Back to the home page
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
