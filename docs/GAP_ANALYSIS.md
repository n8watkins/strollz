# Strollz gap analysis

Last reviewed: 2026-11-01.
Compares the July 2025 prototype ([archived in git history](https://github.com/n8watkins/strollz/tree/9f9d340b93f54a5b34e5faa617f10253328bac63/archive/prototype-2025)) and today's open data landscape against the features in [PRODUCT.md](PRODUCT.md).
Code facts come from reading the archived source and from the [market report](../MARKET_REPORT_2026-11.md), which ran its tests, type check and `npm audit`.
Anything marked "(verify)" must be confirmed against the provider's current terms before building on it.

## 1. Summary

- The prototype proves one idea worth porting: turning a duration into a target distance and picking a few varied waypoints around the start to make a loop.
- Almost everything else is either mock UI, tied to client-side Mapbox keys, or solving the wrong problem (social walking groups, quota dashboards).
- The two features that define the new product, segment-level coverage and sourced notes, do not exist in any form.
- No code is carried over; the new app starts from zero and the archive is a reference for ideas and test cases only.
- The biggest non-code gaps are data licensing (public Overpass, Nominatim and OSM tile servers cannot back an app) and the iOS web-app limit on background location.

## 2. Prototype inventory mapped to planned features

Legend: Reusable (port the idea or logic), Broken (exists but unfit), Missing (nothing to start from).

### 2.1 Walk generation

| Planned capability | Prototype source | Status | Notes |
| --- | --- | --- | --- |
| Duration to distance | `routeGeneration.ts` `calculateTargetDistance` | Reusable | Pace table (2.0, 2.5, 3.0 mph by difficulty) is a fine starting point; replace "difficulty" with measured pace |
| Waypoints around the start, ordered by bearing | `routeGeneration.ts` `generateCircularWaypoints`, `selectDiverseWaypoints`, `arrangeCircularWaypoints` | Reusable | Good idea for biasing loops toward unwalked areas; port as pure functions with tests |
| Deterministic seeds and "give me another" | `generateSeed`, `recentRoutes` map | Reusable (idea) | In-memory per-tab cache; move to server with a per-user seen-loops list |
| Reachable area | Mapbox Isochrone call, circle fallback | Broken | Paid API from the browser; a self-hosted router makes this unnecessary |
| Street-following path | Mapbox Directions from the browser | Broken | Key is public in the bundle; replace with server-side GraphHopper |
| Fallback when routing fails | `createFallbackRoute`, `interpolatePoints` | Broken | Draws straight lines through buildings; must fail honestly instead |
| Walkability validation | `routeValidationService.ts` (Directions and Matrix checks) | Broken | Expensive extra calls; the routing profile plus a backtracking check replaces it |
| Generate many candidates and score them | None | Missing | Core of the new generator: 8 to 12 candidates, score, return 3 |
| Avoid busy roads, prefer lit streets | None | Missing | Needs a custom routing profile |
| Name and description templates | `generateWalkName`, `generateWalkDescription` | Reusable (low value) | Fine for a fallback title; notes replace descriptions |
| Generate page UX (duration, preferences, route type) | `src/app/generate/page.tsx` | Reusable (reference) | Too many options; the new flow is one slider and three cards |

### 2.2 Coverage ("streets you have never walked")

| Planned capability | Prototype source | Status | Notes |
| --- | --- | --- | --- |
| Walk history | `explorationHistory.ts` (`localStorage`) | Broken | Browser-only, lost on a new device, stores raw routes with no privacy controls |
| Novelty | `explorationHistory.ts` area circles and `noveltyScore` | Broken | Measures distance between walk start points, not streets walked, so it cannot say "73% new streets" |
| GPS recording | None | Missing | No tracking at all; generated routes are assumed walked |
| GPX import | `exportExplorationData` (JSON only) | Missing | No GPX parsing |
| Map matching to street segments | None | Missing | Needs GraphHopper map matching (or Valhalla Meili) and a segment table |
| Segment table for the pilot city | None | Missing | Build from an OSM extract, split ways at intersections |
| Per-user coverage storage | Supabase typed helpers for `user_walks`, no schema | Missing | No migrations exist; design from scratch in Postgres/PostGIS |
| Coverage map rendering | None | Missing | MapLibre line layer filtered by the user's segment IDs |

### 2.3 Notes with sources

| Planned capability | Prototype source | Status | Notes |
| --- | --- | --- | --- |
| Places near the route | `realPOIService.ts` (public Overpass, 30-minute memory cache) | Broken | Public Overpass is not for app backends (see section 3); category taxonomy and scoring weights are reusable as a reference |
| Placeholder places when lookup fails | `generateFallbackPOIs` ("Local Park Area") | Broken | Invents places; violates "no source, no note" and must not be ported |
| Source records (Wikipedia, Wikidata, OSM tags) | None | Missing | Join on OSM `wikidata=*` tags and Overture source IDs |
| AI summarization with citations | None | Missing | Per-place, cached, validated against source text |
| Report a wrong note | None | Missing | Simple moderation queue |

### 2.4 Safety and accessibility

| Planned capability | Prototype source | Status | Notes |
| --- | --- | --- | --- |
| Avoid busy roads | None | Missing | Routing profile |
| Lit streets, sidewalks, steps | None | Missing | OSM tags exist but are patchy; UI must show "unknown" |
| Daylight warning | None | Missing | Sun times can be computed locally (e.g. a `suncalc`-style function), no API needed |
| Accessibility of the web UI | Partial semantic markup | Broken | Not audited; the new landing page uses skip links, labelled regions and native disclosure widgets |

### 2.5 Themes, streaks and social

| Planned capability | Prototype source | Status | Notes |
| --- | --- | --- | --- |
| Theme preferences | `RoutePreferences` (scenery, cafes, parks) | Reusable (idea) | Map onto place categories and road-class weights |
| Streaks, weekly goal | `userStore.ts` stats in Zustand | Broken | Client state only |
| Share a loop | None | Missing | Needs fuzzed start points |
| Social walking groups, "10,000+ walkers" | `src/app/page.tsx`, `/discover`, `/map` mock data | Broken | Off-strategy, invented numbers; never reuse the copy |

### 2.6 Platform

| Concern | Prototype | Status | Notes |
| --- | --- | --- | --- |
| Framework | Next 15.3.5, React 19.1 | Broken | Affected by CVE-2025-66478 and later advisories; new app is Next 16.4.3 with 0 production vulnerabilities |
| Auth | NextAuth v4 and Supabase Auth in parallel | Broken | Pick one system |
| Maps | `react-map-gl@7` with Mapbox GL | Broken | Replace with MapLibre GL JS and open tiles |
| Quotas | `mapboxUsage.ts`, `rateLimiter.ts`, usage dashboard | Broken | Client-side quotas cannot protect a public key; server-side routing removes the need |
| CMS blog | Sanity client with mock posts | Not needed | Out of scope |
| Payments | Static pricing page | Missing | Stripe Checkout in beta |
| Tests | Jest, 102 tests, 16 failing; `tsc` errors | Broken | `routeGeneration.test.ts` cases are worth reading when writing new tests |
| Deployment | None | Missing | Landing page can deploy now; app needs a routing server |

## 3. Data and licensing gaps

| Need | Tempting source | Problem | Plan |
| --- | --- | --- | --- |
| Map tiles | `tile.openstreetmap.org` | The OSM tile usage policy forbids heavy or app use and has no SLA (verify current policy) | Pilot: OpenFreeMap public tiles (free, no key, no SLA). Beta: Protomaps PMTiles for the pilot region on Cloudflare R2 |
| Streets and paths | OpenStreetMap (ODbL) | Share-alike applies to derivative databases that are publicly used; produced works need attribution (verify with the OSMF guidance) | Keep the segment table internal; attribute "OpenStreetMap contributors" on every map; get a short legal read on whether per-user coverage tables keyed to OSM way IDs count as derivative databases |
| Places | Public Overpass API | Usage policy targets light, non-commercial querying; not for an app backend | Overture Places (CDLA Permissive 2.0) loaded per metro into Postgres; OSM tags from our own extract |
| Places quality | Overture Places | Coverage and categories vary, some records come from Meta and Microsoft with their own attribution lists | Attribution page, quality spot-checks in the pilot city, user "this place is gone" reports |
| Geocoding (typing an address) | Public Nominatim | 1 request per second, no autocomplete, attribution required | Avoid geocoding in the pilot (use device location and a map pin); beta: self-host Photon or Nominatim for the region, or a paid provider behind a server route |
| Routing | Mapbox Directions, GraphHopper hosted | Mapbox costs about $2 per 1,000 calls past the free tier; GraphHopper hosted free tier is non-commercial | Self-host open-source GraphHopper (Apache 2.0) with a foot profile and map matching on a small VPS |
| Notes text | Wikipedia | CC BY-SA: summaries are adaptations, so attribution and a license link are required | Every note links its article and shows "Wikipedia, CC BY-SA"; keep notes short; Wikidata is CC0 |
| AI model | Claude Haiku-class model | Cost and hallucination | Generate per place, cache, validate against source text, hard monthly budget |
| Activity imports | Strava API | Terms bar AI/ML use and showing data to others; 2026 changes reportedly restrict intermediaries | Skip Strava in the pilot; GPX import covers the need |
| Sun times | Any API | Unnecessary dependency | Compute locally |

## 4. What we cannot deliver yet

- Background walk recording on iPhone: a PWA only records while open and on screen, so the pilot asks users to keep the screen on or import a GPX afterwards; reliable recording needs a native wrapper.
- Trustworthy accessibility routing: step-free and sidewalk filters depend on OSM tags that are missing on many suburban streets; the pilot can only say "prefers" and show unknowns.
- Safety guarantees: lit-street data is patchy and crime data is out of scope; the app can avoid obvious hazards (motorways, unlit footpaths where tagged) and warn about daylight, nothing more.
- Notes everywhere: suburbs with few Wikipedia or Wikidata entries will get zero to one note per loop; the product must feel good without notes.
- Multiple cities at launch: segment tables, place loads and manual route review are per metro; the pilot is 1 to 2 neighborhoods in Los Angeles.
- Offline use: no offline tiles or routing in the pilot.
- Strava sync: blocked by terms for this use; GPX only.
- Real social features or a waitlist store of its own: this site stores nothing; the waitlist lives on n8builds.dev, which is being built separately and is not live yet.

## 5. Owner decisions needed before building

Decided 2026-11-01: the pilot city is Los Angeles, the name stays "Strollz", and the waitlist lives on n8builds.dev.
Still open, and deferred by the owner:

1. Which 1 to 2 Los Angeles neighborhoods to start in (see [DELIVERY_PLAN.md](DELIVERY_PLAN.md), Phase 0).
2. Which domain to buy, and a contact address.
3. Budget ceiling for the pilot (suggested: under $50 for the month, see [DELIVERY_PLAN.md](DELIVERY_PLAN.md)).
