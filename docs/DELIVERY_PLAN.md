# Strollz delivery plan

Last reviewed: 2026-11-01.
Scope: how to build the product in [PRODUCT.md](PRODUCT.md), closing the gaps in [GAP_ANALYSIS.md](GAP_ANALYSIS.md), as a low-cost side project.
The app is not being built yet; this plan starts when the owner says go.
Effort is in focused developer-days for one person; costs are estimates marked (verify) where they depend on current provider pricing.

## 1. Goals and constraints

- Prove or kill the narrow bet with 30 to 50 real walkers in one city within about 6 weeks of starting.
- Keep variable cost under $0.05 per monthly active user and fixed cost under $100 per month until the bet is proven.
- Never ship invented numbers, notes without sources, or location data handling we would be embarrassed to explain.
- Organic growth only: no paid acquisition (the report shows it cannot pay back).

## 2. Architecture

### 2.1 Client: mobile-first PWA first, native later

Decision: a Next.js 16.4 PWA for the pilot and beta, with a native wrapper only if the pilot passes.

| Option | For | Against |
| --- | --- | --- |
| PWA (chosen for now) | One codebase with the landing page, instant deploys, no store review, no 15 to 30% store fee, shareable links open straight into a loop | iOS records location only while the app is open and on screen; push notifications on iOS need the app added to the home screen |
| Native (Expo / React Native) | Background location, reliable notifications, store presence | Two stores, review cycles, store fees, more code before validation |
| Capacitor wrapper around the PWA | Reuses the web app, adds background location plugin | Still needs store accounts and review |

Mitigation for the PWA limit: Screen Wake Lock while recording, a clear "keep the screen on" prompt, and GPX import for walks recorded elsewhere.
Revisit after the pilot: if recording gaps are the top complaint, wrap with Capacitor in the beta.

### 2.2 System overview

```
Phone (PWA, MapLibre GL)
   |  HTTPS, session cookie
Next.js app (route handlers / server actions)
   |-- Postgres + PostGIS: users, segments, coverage, walks, places, notes, events
   |-- GraphHopper (self-hosted): round trips, routes via waypoints, map matching
   |-- Notes worker (cron): fetch sources, call the AI model, validate, cache
   '-- Tiles: OpenFreeMap (pilot) -> Protomaps PMTiles on Cloudflare R2 (beta)
```

### 2.3 Map stack

- Rendering: MapLibre GL JS (BSD), no API key.
- Tiles, pilot: OpenFreeMap public instance (free, no key, no SLA (verify)).
- Tiles, beta: a Protomaps PMTiles extract for the launch region served from Cloudflare R2 with zero egress fees (verify), so a tile outage elsewhere cannot take the app down.
- Style: a custom light style that keeps streets legible under the coverage overlay; attribution "OpenStreetMap contributors" always visible.

### 2.4 Routing: self-hosted GraphHopper

| Engine | Round trips | Custom profiles | Map matching | Verdict |
| --- | --- | --- | --- | --- |
| GraphHopper (Apache 2.0) | Built-in `round_trip` algorithm with distance and seed | Custom models (road class, surface, steps, etc.) | Built-in map matching module | Chosen |
| Valhalla (MIT) | No native round trip, emulate with waypoints | Rich costing options | Meili map matching | Strong alternative |
| OSRM (BSD) | No | Profiles compiled in Lua, slow to iterate | Yes | Too rigid for this use |

- Host: one small VPS (4 vCPU, 8 GB RAM) running GraphHopper for the pilot metro extract, about $10 to $40 per month (verify).
- Foot profile: custom model that penalizes primary and secondary roads, forbids motorways and private access, avoids steps when step-free is on, and prefers `lit=yes` where the encoded value is available (verify which OSM tags GraphHopper can encode).
- The routing server is private: only the Next.js server calls it, so no key is ever in the browser.

### 2.5 Loop generation algorithm (the first thing to build)

1. Inputs: start point, minutes, pace, filters, theme, the user's walked segment IDs near the start.
2. Target distance = minutes x pace; accept loops within plus or minus 12%.
3. Candidates (8 to 12 per request):
   - half from GraphHopper `round_trip` with different seeds and headings;
   - half routed through 2 to 3 waypoints picked in clusters of unwalked segments, ordered by bearing (the idea ported from the prototype's `arrangeCircularWaypoints`).
4. Score each candidate: `0.40 x new-street share + 0.25 x distance fit + 0.20 x interest (places with sources within 40 m, theme weight) + 0.15 x comfort (low road class, lit, sidewalks)`, minus penalties for backtracking over 10% and for repeating a loop shown in the last 7 days.
5. Return the top 3 with time, distance, % new and note count; cache candidates for 10 minutes for "give me another".
6. Budget: under 1.5 s server time per request on the pilot VPS.

### 2.6 Coverage storage

- `segments`: one row per street segment (OSM way split at intersections), with `id`, `osm_way_id`, `geom` (LineString, SRID 4326), `length_m`, `road_class`, `lit`, `sidewalk`, `city_id`; a metro has roughly 100k to 300k rows (verify for the pilot city).
- `walks`: `id`, `user_id`, `started_at`, `duration_s`, `distance_m`, `source` (recorded, gpx), `loop_id` nullable.
- `walk_segments`: `walk_id`, `segment_id`, `covered_fraction`; a segment counts as walked when at least 75% of its length is matched.
- `user_coverage`: `user_id`, `segment_id`, `first_walked_at`, `times_walked` (primary key on both IDs); this is what scoring reads.
- Raw GPS tracks: kept 30 days for re-matching, then deleted by default; users can opt in to keep them.
- Scale check: 1,500 active users x 3,000 segments each is 4.5M `user_coverage` rows, comfortable for Postgres; if it grows, move per-user sets to compressed bitmaps (Roaring) keyed by city.
- Map matching: GraphHopper map matching on the server, triggered when a walk ends or a GPX is uploaded.

### 2.7 Places and notes

- Places: Overture Places for the metro bounding box, loaded with DuckDB from GeoParquet into Postgres, plus OSM objects with `wikidata`, `heritage`, `historic`, `tourism=artwork`, `architect` or `start_date` tags from our extract.
- Sources: Wikipedia REST summary and Wikidata claims fetched with a descriptive user agent and cached; OSM tags; Overture category.
- Note generation: per place, not per walk, by a small Claude model (the market report prices a Haiku-class model at about $0.001 per walk (verify current pricing)).
- Prompt rules: the source text is the only input; output 1 to 2 sentences under 240 characters; include the source ID.
- Validation: reject a note if any number, year or proper noun in it does not appear in the source text; reject if the source is under 100 characters; store the source revision ID.
- Cost controls:
  - precompute notes for the pilot metro nightly (a few thousand places, a few dollars total (verify));
  - cache forever, regenerate only when the source revision changes;
  - hard monthly budget in code (default $20) after which new notes stop and loops ship without notes;
  - no user data in any prompt; Strava or GPX data never goes near the model.
- Moderation: "wrong note" hides it immediately for that user and after 2 reports for everyone until reviewed.

### 2.8 Auth

- One system only, recommended: Supabase Auth with the same Supabase Postgres (PostGIS enabled), using email magic links plus passkeys; Sign in with Apple and Google in the beta.
- Alternative if leaving Supabase: Better Auth on any Postgres.
- Anonymous first loop: a visitor can generate one loop before signing in; recording and coverage need an account.

### 2.9 Privacy of location history

- Home is never stored as an exact point on the server in the pilot: the device keeps it; the server stores a coarse cell (about 500 m) for "home area" coverage.
- Shared loops snap the start to a public spot and blur it by 200 to 400 m; the first and last 150 m of a shared track are trimmed.
- Coordinates never appear in logs or analytics events; analytics are first-party events in Postgres, no third-party trackers.
- Encryption at rest (provider default) and row-level security on all user tables.
- Export (GPX and JSON) and delete (walks, account) available from day one of the pilot.
- A written privacy policy replaces the `/privacy` placeholder before the first pilot account is created.

### 2.10 Payments (beta only)

- Stripe Checkout and the customer portal on the web, annual by default.
- The pilot uses a paywall smoke test (a "Become a founding member" button that records the click and explains billing is not live yet), as the market report recommends.

### 2.11 Monthly cost estimate (pilot and early beta)

| Item | Pilot | Beta (about 1,500 MAU) |
| --- | --- | --- |
| Web hosting (Vercel hobby/pro or Cloudflare Workers) | $0 to $20 | $20 |
| Routing VPS | $10 to $40 | $40 |
| Supabase (Postgres, Auth) | $0 (free tier) | $25 |
| Tiles | $0 (OpenFreeMap) | about $0 to $5 (R2) |
| AI notes | under $5 | under $20 (hard cap) |
| Email (magic links, daily walk) | $0 | about $10 |
| Total | about $15 to $65 | about $115 to $120 |

All figures (verify) at build time.

## 3. Milestones

### Phase 0: preparation (2 to 3 days, before the pilot clock starts)

- Owner decisions: pilot city, name and domain, contact address, budget ceiling.
- Deploy this landing page; set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_CONTACT_EMAIL` (or build a stored waitlist form with consent text).
- Download the OSM extract and Overture places for the pilot city; stand up GraphHopper locally.
- Write the recruiting post for 1 local subreddit, 1 walking club and 1 "new to the city" group.
- Exit: landing page live, 50+ people reached, router answering locally.

### Phase 1: 4-week one-city pilot (about 18 to 22 days of effort)

Week 1: core loop (5 to 6 days).
- Offline loop lab first: a script that generates loops for 20 sample start points and renders them to images for manual review; tune scoring until at least 17 of 20 look like walks a local would enjoy.
- App skeleton: Next.js PWA shell, MapLibre map, duration slider, three loop cards, "give me another", share link with blurred start.
- Exit: the owner walks 5 generated loops and none has a dead end, private road or highway.

Week 2: coverage (5 to 6 days).
- Accounts (magic link), foreground recording with Wake Lock, GPX import.
- Segment table for the pilot city, server-side map matching, `user_coverage`.
- Re-score loops by % new streets; coverage map view.
- Exit: a walk recorded on a phone shows the right streets as walked within a minute of finishing.

Week 3: notes and habit (4 to 5 days).
- Places load, source fetching, nightly note precompute, validation, "wrong note".
- Themes: Surprise me, Green and quiet; filters: avoid busy roads, prefer lit, daylight warning.
- Daily walk email (opt-in), weekly goal and streak; paywall smoke test button.
- First-party events for every metric in section 6.
- Exit: 20 random notes spot-checked, zero claims missing from their sources.

Week 4: pilot and decision (3 to 4 days of fixes and support).
- Onboard 30 to 50 testers, fix route reports within 24 hours, interview 5 users.
- Decision meeting at the end of week 4 against the kill criteria in section 5.

### Phase 2: public beta (6 to 8 weeks, about 30 to 40 days of effort), only if the pilot passes

- Second and third city using the "add a city" checklist; Protomaps tiles on R2.
- Plus plan with Stripe; founding member conversion for pilot users.
- Step-free and sidewalk filters, coffee, architecture, history and art themes.
- Neighborhood progress and milestones; walk-with-a-friend links.
- Full privacy policy and terms; help center pages from [DOCS_OUTLINE.md](DOCS_OUTLINE.md).
- Decide on a Capacitor wrapper for background recording based on pilot feedback.
- Per-neighborhood landing pages for organic search ("walks in <neighborhood>").

### Phase 3: later (only with traction)

- Native background recording and store listings.
- Local contributor notes (historians, residents) with attribution.
- B2B pilots the report lists (relocation, real estate, wellness), as a separate decision.

## 4. What to build first, and why

1. The offline loop lab (week 1): route quality is the riskiest assumption and the cheapest to test without any UI; bad routes destroy trust faster than anything else.
2. Coverage scoring and the "% new streets" number (week 2): it is the only real differentiator and the source of lock-in.
3. Notes (week 3): they add delight, but the product must already work without them.
Everything else (themes, streaks, payments) waits until people have walked at least a few loops.

## 5. Risks and kill criteria

### Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Generated loops are dull or awkward | High | High | Loop lab with manual review before any user sees a loop; route report button; fix within 24 hours |
| Novelty fades after week 1 (Randonautica pattern) | High | High | Coverage map and weekly goal give a reason to return; measure week-by-week retention, not just sign-ups |
| iOS PWA recording gaps | High | Medium | Wake Lock, clear prompt, GPX import, Capacitor in beta if needed |
| OSM sidewalk and lighting data too sparse | Medium | Medium | Show "unknown" honestly; choose a pilot city with good OSM coverage |
| Hallucinated or wrong notes | Medium | High | Source-only prompts, validation rules, reports, spot checks |
| Incumbent ships the same feature | Medium | Medium | Accept it; the bet is small and personal coverage history is portable to us only |
| Cost overrun from AI or routing | Low | Medium | Per-place caching, hard budget cap, self-hosted router |
| Privacy incident (home location exposed) | Low | High | No exact home on the server, blurred shares, no coordinates in logs |
| Owner time runs out | Medium | Medium | Small phases with a decision after each; nothing built before it is needed |
| Licensing (ODbL share-alike, CC BY-SA) misread | Low | Medium | Short legal read before beta, attribution from day one |

### Kill criteria (evaluated at the end of pilot week 4)

Stop and archive the project if any of these hold after reasonable fixes:

- Week-4 retention under about 20% (share of activated testers who walk at least one generated loop in week 4).
- Fewer than 1 completed walk per active tester per week on average.
- Under 5% of active testers click the founding member paywall.
- Under 30 testers recruited after two weeks of trying (demand signal too weak).
- More than 1 in 4 walked loops reported as a bad route after week-2 fixes.

If it is killed, keep the loop lab and coverage scoring code as a portfolio piece, as the market report suggests.

## 6. Success metrics

| Metric | Definition | Pilot target | Beta target |
| --- | --- | --- | --- |
| Activation | Testers who complete a generated loop within 7 days of signing up | 50% | 40% |
| Weekly walks | Completed generated or recorded walks per active user per week | 1.5 | 2 |
| Week-4 retention | Activated users walking in week 4 | 20% minimum, 30% goal | 25% |
| New-street share | Median % new streets on walked loops | 50% | 50% |
| Route quality | Walked loops reported as bad | under 10% | under 5% |
| Note accuracy | Spot-checked notes with a claim missing from the source | 0 of 20 | 0 of 100 per month |
| Paywall interest | Active users clicking founding member or Plus | 5% | 3% paying |
| Cost | Variable cost per monthly active user | under $0.05 | under $0.03 |
| Organic growth | New sign-ups from shared loop links | tracked | 20% of sign-ups |
