# Strollz

Walk the streets you have never walked.

Strollz is a planned walking app: tell it how long you have, and it gives you a loop from your door through streets you have not walked yet, with a few short notes about what you pass, each linked to its source.
It tracks the streets you cover, like Wandrer or CityStrides, but for casual walkers instead of runners and cyclists.

**Status:** concept and landing page only.
There is no app, no accounts and no data collection yet.
The next step is a 4-week pilot in one city, described in the delivery plan.

## Documents

| Document | What it covers |
| --- | --- |
| [Market report (Nov 2026)](MARKET_REPORT_2026-11.md) | Market, competitors, unit economics and the verdict: a narrow side project |
| [Product definition](docs/PRODUCT.md) | Positioning, audience, features, free vs paid, pricing, competitor comparison, name options |
| [Gap analysis](docs/GAP_ANALYSIS.md) | What the 2025 prototype offers, data and licensing gaps, what cannot be delivered yet |
| [Delivery plan](docs/DELIVERY_PLAN.md) | Architecture, milestones, effort, risks, kill criteria, success metrics |
| [Docs outline](docs/DOCS_OUTLINE.md) | Planned user help and developer documentation, one line per page |

## Landing page

A Next.js 16.4 (Turbopack) site in `src/`.
It has no backend, sets no cookies and loads no third-party scripts; the maps are hand-drawn SVG illustrations of a fictional neighborhood.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (Turbopack)
npm start          # serve the production build
npm run lint
npm run typecheck
```

Environment variables (both optional, read at build time):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata, sitemap and Open Graph links; defaults to `http://localhost:3000` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | When set, the waitlist button becomes a mailto link; when unset, the page says the waitlist is coming soon |

Screenshots of the current page are in [`docs/screenshots/`](docs/screenshots/).

## Repository layout

| Path | Contents |
| --- | --- |
| `src/app/` | Pages (home, privacy, terms, attributions, 404), metadata routes (sitemap, robots, manifest, icons, Open Graph image) |
| `src/components/` | Header, footer, map illustrations, prose page layout |
| `src/lib/` | Site config, page copy, illustration geometry |
| `docs/` | Product, gap analysis, delivery plan, docs outline, screenshots |
| `archive/prototype-2025/` | The July 2025 "StrollVibe" prototype, kept for reference only; not built, linted or deployed |

## Honesty rules

- No invented user counts, testimonials or ratings, anywhere.
- No place note without a source.
- Planned features and prices are labelled as planned.
