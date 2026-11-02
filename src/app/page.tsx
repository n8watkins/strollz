import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/chrome";
import { CoverageMap, LoopMap } from "@/components/maps";
import {
  audiences,
  comparison,
  competitors,
  faqs,
  features,
  plans,
  steps,
  type Cell,
} from "@/lib/content";
import { coverageShares, loopNewShare } from "@/lib/neighbourhood";
import { site } from "@/lib/site";

export default function Home() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: site.name,
      url: site.url,
      description: site.description,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <SiteHeader />
      <main id="main">
        <Hero />
        <HowItWorks />
        <Coverage />
        <Features />
        <Compare />
        <Pricing />
        <Faq />
        <Waitlist />
      </main>
      <SiteFooter />
    </>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-coral-ink">{children}</p>
  );
}

function SectionHeading({
  id,
  eyebrow,
  title,
  intro,
}: {
  id: string;
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <div className="max-w-2xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        id={`${id}-title`}
        className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl"
      >
        {title}
      </h2>
      {intro && <p className="mt-4 text-lg leading-8 text-ink-soft text-pretty">{intro}</p>}
    </div>
  );
}

function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-rule bg-card px-3 py-1 text-sm text-ink-soft">
            <span className="h-2 w-2 rounded-full bg-coral" aria-hidden="true" />
            In development. Los Angeles pilot planned.
          </p>
          <h1
            id="hero-title"
            className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight text-balance sm:text-6xl"
          >
            Walk the streets you have <span className="text-coral-ink">never walked.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-ink-soft text-pretty sm:text-xl sm:leading-9">
            Tell Strollz how long you have. It plans a loop from your door through streets that are
            new to you, with a few short notes about what you pass, each linked to its source.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={site.waitlistUrl}
              className="inline-flex h-12 items-center rounded-full bg-ink px-6 text-base font-semibold text-paper transition-colors hover:bg-moss"
            >
              Join the waitlist
            </a>
            <Link
              href="#how-it-works"
              className="inline-flex h-12 items-center rounded-full border border-ink/15 bg-card px-6 text-base font-semibold transition-colors hover:border-ink/40"
            >
              How it works
            </Link>
          </div>
          <p className="mt-6 text-sm text-ink-soft text-pretty">
            Free plan planned. No ads. Walk history private by default.
          </p>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <figure className="relative mx-auto w-full max-w-[520px]">
      <div className="rounded-[28px] border border-rule bg-card p-3 shadow-[0_30px_60px_-30px_rgba(24,42,37,0.35)]">
        <div className="flex items-center justify-between px-2 pb-3 pt-1">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-ink-soft">Today</p>
            <p className="font-display text-lg font-semibold">35 minute loop</p>
          </div>
          <span className="rounded-full bg-coral-soft px-3 py-1 text-xs font-semibold text-coral-ink">
            {loopNewShare}% new streets
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl">
          <LoopMap className="block h-auto w-full" />
        </div>
        <dl className="grid grid-cols-3 gap-2 px-1 pt-3 text-center">
          {[
            ["Time", "35 min"],
            ["Distance", "2.8 km"],
            ["Notes", "3 stops"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-paper px-2 py-2">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-soft">{k}</dt>
              <dd className="mt-0.5 text-sm font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="relative z-10 mx-3 mt-3 rounded-2xl border border-rule bg-card p-4 shadow-[0_18px_40px_-24px_rgba(24,42,37,0.45)] sm:absolute sm:-left-10 sm:top-[96px] sm:mx-0 sm:mt-0 sm:w-64">
        <p className="flex items-center gap-2 text-xs font-semibold text-coral-ink">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-coral-ink text-[10px]">
            2
          </span>
          Sample note
        </p>
        <p className="mt-2 text-sm leading-6">
          This park was laid out in 1928 on the site of an old brickworks. The pond is the flooded
          clay pit.
        </p>
        <p className="mt-2 text-xs text-ink-soft">Source: Wikipedia article on the park</p>
      </div>
      <figcaption className="mt-4 text-center text-xs text-ink-soft">
        Illustration of a planned feature, on a fictional neighborhood.
      </figcaption>
    </figure>
  );
}

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="border-y border-rule bg-card"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading
          id="how-it-works"
          eyebrow="How it works"
          title="A fresh walk in three taps"
          intro="No route planning, no scrolling through trails an hour away. Just a good loop near home that you have not done before."
        />
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-rule bg-paper p-6">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-display text-base font-semibold text-paper"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 leading-7 text-ink-soft">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 rounded-2xl bg-moss-soft p-6 sm:p-8">
          <h3 className="font-display text-xl font-semibold">Made for people who walk near home</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {audiences.map((a) => (
              <li key={a} className="flex gap-3 leading-7">
                <Check className="mt-1.5 h-4 w-4 shrink-0 text-moss" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Coverage() {
  const { before, after } = coverageShares;
  return (
    <section id="coverage" aria-labelledby="coverage-title">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <div className="lg:order-2">
          <SectionHeading
            id="coverage"
            eyebrow="Your coverage map"
            title="Watch your neighborhood fill in"
            intro="Every walk paints the streets you covered. Strollz uses that map to send you somewhere new next time, so the area around your home keeps getting bigger."
          />
          <dl className="mt-8 grid max-w-md grid-cols-2 gap-4">
            <div className="rounded-2xl border border-rule bg-card p-5">
              <dt className="text-sm text-ink-soft">Before today</dt>
              <dd className="mt-1 font-display text-3xl font-semibold">{before}%</dd>
            </div>
            <div className="rounded-2xl border border-rule bg-card p-5">
              <dt className="text-sm text-ink-soft">After today</dt>
              <dd className="mt-1 font-display text-3xl font-semibold text-coral-ink">{after}%</dd>
            </div>
          </dl>
          <p className="mt-3 text-sm text-ink-soft">Share of streets walked in the example map.</p>
        </div>
        <figure className="lg:order-1">
          <div className="overflow-hidden rounded-[24px] border border-rule bg-card p-3">
            <div className="overflow-hidden rounded-2xl">
              <CoverageMap className="block h-auto w-full" />
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 px-2 pb-1 pt-3 text-sm text-ink-soft">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-6 rounded-full bg-moss" aria-hidden="true" /> Walked before
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-6 rounded-full bg-coral" aria-hidden="true" /> New today
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="h-1.5 w-6 rounded-full"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, var(--street-unwalked) 1.5px, transparent 1.6px)",
                    backgroundSize: "6px 6px",
                    backgroundPosition: "center",
                  }}
                  aria-hidden="true"
                />{" "}
                Not walked yet
              </li>
            </ul>
          </div>
          <figcaption className="mt-3 text-center text-xs text-ink-soft">
            Illustration on a fictional neighborhood.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="border-y border-rule bg-card">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading
          id="features"
          eyebrow="What is planned"
          title="Small app, a few things done well"
          intro="Everything below is planned for the pilot or the beta that follows. Nothing is live yet."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article key={f.title} className="flex flex-col rounded-2xl border border-rule bg-paper p-6">
              <h3 className="font-display text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 leading-7 text-ink-soft">{f.body}</p>
              <ul className="mt-5 space-y-2.5 border-t border-rule pt-5 text-[15px]">
                {f.points.map((p) => (
                  <li key={p} className="flex gap-2.5 leading-6">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-moss" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CellView({ cell }: { cell: Cell }) {
  if (cell.v === "text") return <span>{cell.label}</span>;
  const icon =
    cell.v === "yes" ? (
      <Check className="h-4 w-4 text-moss" />
    ) : cell.v === "partial" ? (
      <span className="block h-2 w-2 rounded-full bg-[#c58b1c]" aria-hidden="true" />
    ) : (
      <span className="block h-0.5 w-3 rounded bg-ink-soft/60" aria-hidden="true" />
    );
  const showLabel = !(cell.v === "yes" && cell.label === "Yes") && !(cell.v === "no" && cell.label === "No");
  return (
    <span className="flex items-start gap-2">
      <span className="flex h-5 w-4 shrink-0 items-center justify-center">{icon}</span>
      <span className={showLabel ? "" : "sr-only"}>{cell.label}</span>
    </span>
  );
}

function Compare() {
  return (
    <section id="compare" aria-labelledby="compare-title">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading
          id="compare"
          eyebrow="How it compares"
          title="Not a trail app. Not a fitness tracker."
          intro="Great apps already exist for hikes, runs and directions. Strollz is for the walk itself, close to home."
        />
        <div
          className="relative mt-10 overflow-x-auto rounded-2xl border border-rule bg-card"
          role="region"
          aria-label="Comparison table, scrolls sideways on small screens"
          tabIndex={0}
        >
          <table className="w-full min-w-[980px] table-fixed border-collapse text-left text-sm">
            <caption className="sr-only">
              How Strollz (planned) compares with Google Maps, AllTrails, Strava, Wandrer,
              CityStrides and Strolly
            </caption>
            <thead>
              <tr className="border-b border-rule">
                <th scope="col" className="sticky left-0 z-10 w-[148px] bg-card p-4 sm:w-[200px] font-semibold shadow-[1px_0_0_var(--rule)]">
                  <span className="sr-only">Feature</span>
                </th>
                {competitors.map((c, i) => (
                  <th
                    key={c}
                    scope="col"
                    className={`p-4 font-semibold ${i === 0 ? "bg-coral-soft/60 text-coral-ink" : ""}`}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.map((r) => (
                <tr key={r.row} className="border-b border-rule last:border-0">
                  <th scope="row" className="sticky left-0 z-10 bg-card p-4 align-top font-medium shadow-[1px_0_0_var(--rule)]">
                    {r.row}
                  </th>
                  {r.cells.map((cell, i) => (
                    <td
                      key={competitors[i]}
                      className={`p-4 align-top text-ink-soft ${i === 0 ? "bg-coral-soft/60 font-medium text-ink" : ""}`}
                    >
                      <CellView cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs font-medium text-ink-soft sm:hidden" aria-hidden="true">
          Swipe the table sideways to see every app.
        </p>
        <p className="mt-4 max-w-3xl text-xs leading-5 text-ink-soft">
          Based on each product&apos;s public website and app store pages, checked November 2026.
          Prices are US list prices and can change. Strollz features are planned, not shipped.
        </p>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="border-y border-rule bg-card">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading
          id="pricing"
          eyebrow="Planned pricing"
          title="Free for most walks"
          intro="Nobody is being charged anything yet. This is the pricing we plan to test, and it may change after the pilot."
        />
        <div className="mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          {plans.map((p) => (
            <article
              key={p.name}
              className={`relative flex flex-col rounded-2xl border p-7 ${
                p.highlight ? "border-ink bg-ink text-paper" : "border-rule bg-paper"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-2xl font-semibold">{p.name}</h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    p.highlight ? "bg-paper/15 text-paper" : "bg-moss-soft text-moss"
                  }`}
                >
                  Planned
                </span>
              </div>
              <p className={`mt-2 ${p.highlight ? "text-paper/80" : "text-ink-soft"}`}>{p.blurb}</p>
              <p className="mt-6">
                <span className="font-display text-4xl font-semibold">{p.price}</span>
                <span className={`mt-1 block min-h-6 text-sm ${p.highlight ? "text-paper/80" : "text-ink-soft"}`}>
                  {p.cadence || "forever"}
                </span>
              </p>
              <ul className="mt-6 space-y-3">
                {p.points.map((pt) => (
                  <li key={pt} className="flex gap-2.5 leading-6">
                    <Check className={`mt-1 h-4 w-4 shrink-0 ${p.highlight ? "text-coral" : "text-moss"}`} />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="mt-6 max-w-2xl text-sm leading-6 text-ink-soft">
          Pilot testers will be offered a founding member price of $24.99 a year, kept for as long as
          they stay subscribed. Safety and accessibility filters stay free on every plan.
        </p>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.6fr]">
        <SectionHeading
          id="faq"
          eyebrow="FAQ"
          title="Questions, answered honestly"
          intro="Including the ones about location data."
        />
        <div className="divide-y divide-rule rounded-2xl border border-rule bg-card">
          {faqs.map((f) => (
            <details key={f.q} className="group px-6">
              <summary className="flex cursor-pointer items-center justify-between gap-6 py-5 text-left text-base font-semibold">
                {f.q}
                <span
                  className="faq-chevron flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-rule text-lg leading-none text-ink-soft transition-transform"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="pb-6 leading-7 text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Waitlist() {
  return (
    <section id="waitlist" aria-labelledby="waitlist-title" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="relative overflow-hidden rounded-[28px] bg-ink px-6 py-14 text-paper sm:px-12">
        <svg
          viewBox="0 0 320 240"
          className="pointer-events-none absolute right-10 top-1/2 hidden w-[300px] -translate-y-1/2 lg:block"
          aria-hidden="true"
        >
          <path
            d="M40 200 L40 110 Q40 70 80 70 L170 70 L170 30 L270 30 Q290 30 290 50 L290 150 Q290 170 270 170 L130 170 L130 200 Z"
            fill="none"
            stroke="var(--coral)"
            strokeWidth="5"
            strokeLinejoin="round"
            strokeDasharray="2 12"
            strokeLinecap="round"
            opacity="0.9"
          />
          <circle cx="40" cy="200" r="11" fill="var(--paper)" />
          <path d="M 35 201 L 40 196 L 45 201 L 45 205 L 35 205 Z" fill="var(--ink)" />
        </svg>
        <div className="relative max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-coral">Early access</p>
          <h2 id="waitlist-title" className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Walk with the Los Angeles pilot
          </h2>
          <p className="mt-4 text-lg leading-8 text-paper/80">
            The first pilot is small: a few dozen walkers in one or two Los Angeles neighborhoods,
            for four weeks. Not in LA? Join anyway: waitlist interest helps decide where Strollz goes
            next.
          </p>
          <a
            href={site.waitlistUrl}
            className="mt-8 inline-flex h-12 items-center rounded-full bg-paper px-6 text-base font-semibold text-ink transition-colors hover:bg-coral-soft"
          >
            Join the waitlist
          </a>
          <p className="mt-4 text-sm leading-6 text-paper/70">
            Join the waitlist on n8builds.dev, where I build in public.
          </p>
        </div>
      </div>
    </section>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="none">
      <path
        d="M3 8.5 6.5 12 13 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
