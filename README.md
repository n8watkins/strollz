# Strollz

Walk the streets you have never walked.

Strollz is a planned walking app: tell it how long you have, and it gives you a loop from your door through streets you have not walked yet, with a few short notes about what you pass, each linked to its source.
It tracks the streets you cover, like Wandrer or CityStrides, but for casual walkers instead of runners and cyclists.

**Status:** concept and landing page only.
There is no app, no accounts and no data collection yet.
The next step is a 4-week pilot in Los Angeles (decided 2026-11-01), described in the delivery plan.

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
Live at https://strollz.n8builds.dev; own domain later.
It is a fully static export served by Cloudflare Workers static assets; see [`DEPLOY.md`](DEPLOY.md) for redeploy and rollback.
It has no backend and sets no cookies; the only third-party script is the cookieless Cloudflare Web Analytics beacon, which Cloudflare injects at the edge; the maps are hand-drawn SVG illustrations of a fictional neighborhood.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to out/ (Turbopack)
npm run preview    # serve out/ with the Workers runtime
npm run deploy     # build and deploy to strollz.n8builds.dev
npm run lint
npm run typecheck
```

Environment variable (optional, read at build time):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata, sitemap and Open Graph links; defaults to `https://strollz.n8builds.dev` |

To set it, copy [`.env.example`](.env.example) to `.env.local` (git ignores it) and uncomment the line.
If you keep secrets in [`pass`](https://www.passwordstore.org/), [pass-env](https://github.com/n8watkins/pass-env) is an optional alternative: list the names in a `.env.pass` file (names only, never values) and run `pass-env run -- npm run dev`.

There is no sign-up form on this site.
Every waitlist call to action links to `https://n8builds.dev/upcoming?interest=strollz#strollz` in the same tab, where the owner builds in public; the URL lives in `src/lib/site.ts`.

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

## Commits and releases

Commits follow [Conventional Commits](https://www.conventionalcommits.org) (`feat: ...`, `fix: ...`, `docs: ...`), and releases are cut with [release-kit](https://github.com/n8watkins/release-kit); see [`RELEASING.md`](RELEASING.md).
`npm install` turns on a `commit-msg` hook that checks each message, and CI checks pushed commits and pull request titles.

Releasing is optional and only for this repository: a fork never has to tag, release or set up anything.
The Release workflow runs only in `n8watkins/strollz`, so pushing a tag in a fork publishes nothing.
The hook only checks message format; `git commit --no-verify` skips it.

The weekly security scan skips the frozen lock file of the archived prototype (see [`archive/prototype-2025/osv-scanner.toml`](archive/prototype-2025/osv-scanner.toml)).

## License

[MIT](LICENSE) © 2026 Nathan Watkins
