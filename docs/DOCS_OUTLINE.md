# Strollz documentation outline

Planned structure for user help and developer docs.
One line per page: the page path, then what it covers.
Nothing here is written yet except where a link points to an existing file.

## User help (help.strollz, in-app "Help")

### Getting started

- `getting-started/what-is-strollz` - What Strollz does in one screen, what it does not do (trails, navigation, fitness tracking), and the current pilot status.
- `getting-started/first-walk` - Allow location, pick a duration, choose one of three loops, start walking.
- `getting-started/add-to-home-screen` - Installing the web app on iPhone and Android, and why it is not in the app stores yet.
- `getting-started/home-location` - Setting home, how it is fuzzed, and walking from your current location instead.
- `getting-started/plans-and-pricing` - What Free and Plus include, founding member pricing, how to cancel.

### How walks are made

- `walks/how-loops-are-chosen` - Candidates, scoring (time fit, new streets, interest, comfort) and why you get three options.
- `walks/new-streets-percentage` - What "% new streets" means and how it is measured.
- `walks/give-me-another` - Getting a different loop and why some areas repeat.
- `walks/themes` - What each theme favors and what data it uses.
- `walks/bad-route` - Reporting a dead end, closed path or unsafe street, and what happens next.

### Notes about places

- `notes/where-notes-come-from` - Sources (Wikipedia, Wikidata, OpenStreetMap, Overture), the "no source, no note" rule, and how AI is used to shorten text.
- `notes/wrong-note` - Reporting an incorrect note and how fast it is hidden.
- `notes/no-notes-on-my-walk` - Why some streets have no notes and how to help (adding facts to OpenStreetMap or Wikipedia).

### Coverage map

- `coverage/how-coverage-works` - Street segments, map matching, and when a street counts as walked.
- `coverage/recording-a-walk` - Recording with the screen on, battery tips, and iPhone background limits.
- `coverage/import-gpx` - Importing past walks from a watch or another app as GPX.
- `coverage/fixing-coverage` - Removing a wrongly matched street or a walk you did not take.
- `coverage/neighborhood-progress` - Neighborhood percentages, milestones and how areas are defined.

### Privacy and location data

- `privacy/what-we-collect` - Location, walks, account data, and what is never collected.
- `privacy/how-location-is-used` - When location is read, what is stored, and retention of raw GPS tracks.
- `privacy/sharing-loops` - How shared links blur your start point and what a friend can see.
- `privacy/export-and-delete` - Exporting your history (GPX and JSON) and deleting walks or your account.
- `privacy/ai-and-your-data` - Notes are generated from public sources about places, never from your personal data or imports.

### Safety and accessibility

- `safety/walking-safely` - What the safety filters can and cannot do, daylight warnings, and using your own judgement.
- `safety/filters` - Avoid busy roads, prefer lit streets, prefer sidewalks: data sources and gaps.
- `accessibility/step-free-and-strollers` - Step-free routing, incline limits, and how to report barriers.
- `accessibility/using-strollz-with-assistive-tech` - Screen reader support, text size, reduced motion and color choices on the coverage map.

### FAQ and support

- `faq` - The landing page FAQ expanded: availability, cities, Strava, cost, offline use, why not Google Maps.
- `support/contact` - How to reach the maker, expected response time, and how to report a security issue.
- `legal/privacy-policy` - Full privacy policy (replaces the placeholder at `/privacy`).
- `legal/terms` - Full terms of service (replaces the placeholder at `/terms`).
- `legal/attributions` - Data licenses and credits (expands `/attributions`).

## Developer docs (`docs/` in this repo)

### Product and planning (exist today)

- [`PRODUCT.md`](PRODUCT.md) - Positioning, features, free vs paid, pricing, competitor comparison, name options.
- [`GAP_ANALYSIS.md`](GAP_ANALYSIS.md) - Prototype reuse, data and licensing gaps, what cannot be delivered yet.
- [`DELIVERY_PLAN.md`](DELIVERY_PLAN.md) - Architecture, milestones, effort, risks, kill criteria, success metrics.
- [`../MARKET_REPORT_2026-11.md`](../MARKET_REPORT_2026-11.md) - Market, competitors and unit economics research.

### Architecture

- `architecture/overview` - Components (PWA, API, routing server, Postgres/PostGIS, tile hosting, AI worker) and request flow for "make me a loop".
- `architecture/loop-generation` - Candidate generation, scoring formula, parameters and how to tune them.
- `architecture/coverage-model` - Segment table, map matching pipeline, per-user coverage tables and their size limits.
- `architecture/notes-pipeline` - Place selection, source fetching, prompt, validation rules, caching and budget guard.
- `architecture/auth-and-accounts` - Auth provider choice, sessions, account deletion flow.
- `architecture/privacy-engineering` - Home fuzzing, track retention, encryption, data export, logging rules (no coordinates in logs).
- `architecture/decisions/` - One short ADR per decision (PWA first, GraphHopper, PostGIS, OpenFreeMap then Protomaps, single auth system).

### Data sources and attributions

- `data/openstreetmap` - Extract download, update cadence, ODbL obligations and attribution placement.
- `data/overture-places` - Loading a metro from GeoParquet with DuckDB, category mapping, CDLA attribution list.
- `data/wikipedia-wikidata` - API usage, user agent and rate limits, CC BY-SA attribution in notes.
- `data/segments` - Building the street segment table for a new city and validating it.
- `data/adding-a-city` - Checklist to launch a new metro (extract, segments, places, notes precompute, manual route review).

### Self-hosting maps and routing

- `self-hosting/graphhopper` - Building the graph for a region, custom foot profile, round-trip and map matching endpoints, memory sizing.
- `self-hosting/tiles` - OpenFreeMap for the pilot, then building and serving Protomaps PMTiles from Cloudflare R2.
- `self-hosting/geocoding` - When to add Photon or Nominatim, and running it for one region.

### Operations

- `ops/local-development` - Running the web app, a local GraphHopper and Postgres with seed data.
- `ops/deployment` - Deploying the web app and the routing server, environment variables, secrets.
- `ops/costs-and-budgets` - Expected monthly costs, AI budget cap, alerts.
- `ops/metrics` - Event definitions for activation, retention, loops walked and paywall clicks.
- `ops/incident-and-abuse` - Bad route reports, wrong notes, account abuse, and data deletion requests.
- `contributing` - Code style, tests, commit conventions, how to propose a change.
