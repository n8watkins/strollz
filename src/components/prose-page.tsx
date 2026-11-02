import { SiteFooter, SiteHeader } from "@/components/chrome";
import { site } from "@/lib/site";

export function ProsePage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-coral-ink">
          Last updated {new Date(site.lastUpdated).toLocaleDateString("en-US", { dateStyle: "long", timeZone: "UTC" })}
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-5 text-lg leading-8 text-ink-soft">{intro}</p>
        <div className="mt-10 space-y-10 leading-7 [&_a]:font-medium [&_a]:text-coral-ink [&_a]:underline [&_a]:underline-offset-2 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_li]:mt-2 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
