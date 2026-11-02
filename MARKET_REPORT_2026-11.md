# Strollz market and viability report (November 2026)

Idea, in the owner's words: find a cool walk around town, exploring new areas near where you live, as opposed to rural hiking.

Scope: a read-only review of `~/projects/strollz` plus web research done on 2026-11-01.
Anything marked "(unverified)" could not be confirmed from a primary source or is my estimate.

## 1. TL;DR verdict: pivot (narrow it), and treat it as a cheap side project, not a business

Do not revive the July 2025 code as-is, and do not pursue "urban walking discovery" as a broad consumer startup.
The broad version is crowded by free or bundled incumbents: Google Maps (Gemini "Ask Maps"), Komoot (45M users), AllTrails (80M to 100M users, AI "Custom Routes" in its $79.99 Peak tier) and Strava (150M+ users, AI routes behind its $79.99/yr paywall).
At least six indie "random walk near me" apps already exist (Strolly, RandomWalk, Hodyt, Walk Mate, Daily Wander, Wherewalk), and the visible ones have tiny traction (Strolly shows 19 App Store ratings), which signals low demand for pure route generation.
Willingness to pay in this niche clusters around $25 to $40 per year, and paid conversion in fitness apps runs about 2 to 5%, so revenue per active user is a few cents a month.
The one gap worth testing is narrow: "one tap gives me a loop from my door that covers streets I have never walked, with a short story about what I will pass."
That combines Wandrer/CityStrides-style coverage (proven to create obsessive users, but built for runners and cyclists) with grounded AI notes, and nobody does it well for casual walkers today.
It is only weakly defensible (personal walk history is the moat), so build it only if the owner wants a fun, low-cost product to learn from, run a 4-week pilot, and drop it if week-4 retention is under about 20%.

## 2. What was actually built

### Repository state

- Git has a single commit (`Initial commit from Create Next App`, 2025-07-08); all real work (about 16k lines across `src/`, `docs/`, tests) is uncommitted in the working tree.
- The package is named `stroll-vibe` and the docs call the product "StrollVibe"; "Strollz" appears nowhere in code.
- A `.next/` build from 2025-07-31 exists, so it was run locally, but there is no deployment config and no sign it was ever deployed (unverified).
- Env variable names only (values not read): `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` (plus per-environment `_DEV`/`_STAGING`/`_PROD`), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`.

### Pages (App Router, `src/app`)

| Route | What it does | Real or mock |
| --- | --- | --- |
| `/` | Landing page pitched as "Walk Together", social walking groups, "Join 10,000+ walkers" | Marketing copy; the user counts are invented and must not ship |
| `/generate` | The core feature: pick start point, duration, difficulty, preferences, route type; generates a walk; tabs for exploration suggestions and history | Real (calls Mapbox and Overpass) |
| `/discover`, `/map` | Browse curated walks on a map with filters | Mock: hard-coded `mockWalks` arrays; "Start walk" buttons are TODO |
| `/walks` | Walk listing | Mostly static |
| `/blog` | Blog via Sanity client | Mock posts |
| `/features`, `/subscription` | Feature list; pricing page with Free and Pro at $4.99/month (pitch is "Free limits you to 3 groups") | Static; no payments wired |
| `/auth/signin`, `/auth/signup`, `/api/auth/[...nextauth]` | Google sign-in via NextAuth v4, plus a separate Supabase email signup | Two parallel auth systems, half wired |

### How routes are generated (`src/services/routeGeneration.ts`, `realPOIService.ts`, `routeValidationService.ts`)

1. Target distance = duration x walking speed (2.0, 2.5 or 3.0 mph by difficulty).
2. Mapbox Isochrone API fetches the reachable area (falls back to a circle).
3. Points of interest come from the public OpenStreetMap Overpass API (`overpass-api.de`): parks, cafes, museums, viewpoints, artwork, water and so on, scored by preference and cached 30 minutes in memory.
4. For a circular walk it picks up to 4 diverse POIs, orders them around the start, and asks Mapbox Directions (walking profile) for the full path; out-and-back and linear modes exist too.
5. A validation pass calls Mapbox Directions/Matrix to check walkability; if POI lookup fails it invents placeholder POIs ("Local Park Area").
6. Name, description, calories and elevation are derived by templates, not AI.
7. "Exploration" novelty only avoids the start coordinates of previous walks, not the streets actually walked, so it cannot say "streets you have never walked".
8. History, exploration areas and Mapbox usage counters live in browser `localStorage`; Supabase has typed helpers for `profiles`, `user_walks`, `user_preferences` but no migrations or schema in the repo.
9. A lot of effort went into Mapbox quota protection (client-side rate limiter, usage dashboard, hard-stop at quota), which is weak because the Mapbox token is public and calls are made from the browser.

### How far it got

- A working prototype of one real feature (POI-based loop generation) wrapped in a mostly mock marketing site.
- The product story drifted from the owner's idea (solo discovery near home) toward social walking groups.
- No real walk tracking (GPS recording), no saved walks in a database, no payments, no deployment.
- Health: `jest` runs 102 tests, 16 failing (5 of 8 suites); `tsc --noEmit` reports 3 errors in app code (`rateLimiter.ts`) and hundreds in test files (missing Jest types).

### How outdated the stack is

- `next@15.3.5` with `react@19.1.0`: affected by the CVSS 10.0 React Server Components RCE (CVE-2025-66478 / CVE-2025-55182), fixed in 15.3.6, and the December 2025 follow-ups fixed in 15.3.7 ([Next.js advisory](https://nextjs.org/blog/CVE-2025-66478), [Dec 11 update](https://nextjs.org/blog/security-update-2025-12-11)).
- `npm audit --omit=dev` today: 59 vulnerabilities (5 critical, 32 high, 18 moderate, 4 low); the `next` entry covers every version through 16.3.0 previews, consistent with needing Next 16.4.x.
- `next lint` (used in `package.json`) was removed in Next 16; `eslint-config-next@15.3.5` would also move.
- `next-auth@4` is legacy (Auth.js v5 / Better Auth are the current paths), and running it alongside Supabase Auth is redundant.
- `react-map-gl@7` is a major version behind; MapLibre is now the default open alternative to Mapbox GL.
- Verdict on code: start a fresh Next 16.4 app and port `routeGeneration.ts` and `realPOIService.ts` ideas; an in-place upgrade would carry the mock pages, dual auth and client-side API keys forward.

## 3. Competitors and adjacent products

| Product | What it does | Pricing / model | Size and traction | Gap for "a new walk near home" |
| --- | --- | --- | --- | --- |
| Google Maps | Navigation, Explore, Gemini "Ask Maps" (Mar 2026), Gemini help in walking navigation (Jan 2026) | Free, ads and local business revenue | Billions of users | Gets you somewhere; does not design a loop for the sake of walking, no "new streets" memory ([Google blog](https://blog.google/products/maps/gemini-google-maps-navigation-updates/), [Tom's Guide](https://www.tomsguide.com/computing/mobile-apps/google-maps-is-adding-even-more-gemini-features-and-it-could-be-the-biggest-upgrade-for-years)) |
| Komoot | Route planner for hike, bike, run; community "Highlights" | Freemium, Premium about EUR 59.99/yr | 45M users, EUR 36M revenue, bought by Bending Spoons Mar 2025 with heavy layoffs ([TechLeap](https://finder.techleap.nl/news/feed/bending-spoons-acquires-komoot-for-growth), [BikeRadar](https://www.bikeradar.com/news/komoot-redesign-2025)) | Outdoor-first, planning-heavy; urban walking is an afterthought |
| AllTrails | Trail database, navigation, AI-assisted Custom Routes in Peak | Plus $35.99/yr, Peak $79.99/yr | 80M registered (TechCrunch, May 2025), 100M per AllTrails later ([TechCrunch](https://techcrunch.com/2025/05/12/alltrails-debuts-a-80-year-membership-that-includes-ai-powered-smart-routes), [AllTrails](https://www.alltrails.com/en-gb/press/alltrails-community-reaches-100-million-members)) | Trail and nature brand; city walks are thin, route customisation is paywalled at the top tier |
| Strava | Activity tracking and social; route builder and AI routes | Route creation paywalled; $11.99/mo or $79.99/yr | 150M+ users mid-2025, later reports 180M to 195M; paid share around 2% (estimate) ([AOL](https://www.aol.com/strava-everywhere-heres-know-tracking-194500210.html), [BikeRadar](https://www.bikeradar.com/news/strava-leaderboards-routes-subscription/)) | Built for athletes and speed; walking discovery is not the job |
| Footpath | Draw a route with your finger, measure, turn-by-turn | Elite $3.99/mo or $23.49/yr, $1.99 single-route pass ([pricing](https://footpathapp.com/pricing/)) | Long-lived indie app (unverified size) | Planning tool; you must already know where to go |
| Wandrer.earth | Shows which roads you have and have not traveled (from Strava), challenges | Free tier; $30/yr rising to $40/yr from May 2026 ([Wandrer news](https://news.wandrer.earth/2026/04/11/onward-to-2026.html), [FAQ](https://wandrer.earth/faq)) | No public user count; very engaged niche | Closest to the "new streets" idea, but cyclist/runner culture, Strava-dependent, does not hand a casual walker a ready loop |
| CityStrides | "Run every street" completion tracking by city | Freemium, paid tier (price unverified) | 14,638 people completed 58,535 streets in one recent year; "tens of thousands" of users ([newsletter](https://newsletter.citystrides.com/archive/238d5a09-e414-4052-8893-9500415af1d7), [Wikipedia](https://en.wikipedia.org/wiki/CityStrides)) | Proves the obsession exists; runner-centric, no route generation for walkers |
| VoiceMap | GPS-triggered audio walking tours by local storytellers | Per tour $3.99 to $19.99, passes $49.99 / $99.99; publisher rev share ([App Store](https://apps.apple.com/us/app/-/id852027939), [passes](https://voicemap.me/passes?passable_type=global)) | 2,026+ tours, 500 to 600 destinations | Tourist content in famous areas; nothing for your own suburb |
| GPSmyCity | Self-guided walking tours and articles | Free app; about $15 to $21/yr all-access (sources disagree) | 1,500+ cities ([App Store](https://apps.apple.com/US/app/id417207307)) | Same: tourist centres, fixed routes |
| Atlas Obscura | Database of unusual places, trips, app | Free app; membership about $8/mo ([membership](https://join.atlasobscura.com/membership)) | Large brand (size unverified) | Great POI source for "hidden gems", sparse in ordinary suburbs, no route making |
| Citymapper | Transit and walking directions | Free; owned by Via since 2023 (about $100M, Calcalist estimate) ([Balderton](https://www.balderton.com/news/via-acquires-citymapper-to-expand-its-end-to-end-transittech-solution/)) | Big-city only | A to B commuting, not discovery |
| Randonautica | Sends you to random coordinates for "adventure" | Free with daily limits, small paid unlocks | Reported 11M+ downloads, faded after 2020 TikTok spike ([Wikipedia](https://en.wikipedia.org/wiki/Randonautica)) | Shows novelty demand is real but spiky and gimmicky; privacy and safety criticism |
| Pokemon GO / Niantic (now Scopely) | Location game that makes people walk | Free to play, IAP | Bought for $3.5B (Mar 2025); 20M weekly players, 100M+ unique in 2024 ([Game World Observer](https://gameworldobserver.com/2025/03/12/scopely-niantic-game-business-3-5-billion-acquisition)) | Proves "walk with a reason" at scale, but via games; not a competitor for adults wanting a nice walk |
| Indie random-walk apps (Strolly, RandomWalk, Hodyt, Walk Mate, Daily Wander, Wherewalk) | Generate a loop or random destination near you | Strolly: $2.99/wk or $24.99/yr ([App Store](https://apps.apple.com/app/id6480581550)) | Strolly: 19 ratings, 4.0 average | Exactly the Strollz feature set; tiny traction is the warning |
| Walk Score | Walkability scores for addresses | B2B data licensing to real estate | Widely embedded in listings | Not a consumer walking product; could be a data or partner angle |
| AI itinerary apps and general chatbots | Ask for "a 45 minute walk with murals near me" | Free or bundled | Huge reach | Ungrounded, cannot route reliably or remember what you walked; but they set user expectations |

## 4. Market and economics

### Demand signals

- Walking is the most common physical activity: 44% of US adults named it their main activity in a CDC-based study of 396k people, and 58.7% walked for leisure in a given week (2022 federal data) ([HealthDay](https://www.healthday.com/health-news/exercise-and-fitness/six-in-10-us-adults-say-they-walk-for-leisure-exercise), [mindbodygreen](https://www.mindbodygreen.com/articles/your-daily-walk-is-missing-critical-component-new-study-shows-that-they)).
- r/walking is roughly 100k to 167k members (unverified; GummySearch figure, date unclear).
- Social "hot girl walk" clubs spread across US cities from 2022 onward, some with local business sponsors ([WFAA](https://www.wfaa.com/article/news/local/heres-where-you-can-find-dallas-new-hot-girl-walking-club/287-00423cff-f247-4d9f-b1f7-11bf7bd348b9)).
- I found no Google Trends data for "walking routes near me"; treat search demand as unverified.
- Interpretation: walking itself is enormous, but "I need an app to choose my walk" is a small, habit-driven subset, and most of that need is met by "same loop as always" or Google Maps.

### Willingness to pay

- Comparable subscriptions: Footpath $23.49/yr, Strolly $24.99/yr, Wandrer $30 to $40/yr, AllTrails Plus $35.99/yr, Komoot about EUR 60/yr, Strava and AllTrails Peak $79.99/yr.
- Strava's paid share is estimated around 2% of registered users; plan on 2 to 5% of monthly active users paying.
- At $30/yr and 3% conversion, revenue is about $0.075 per monthly active user per month before app store fees (15 to 30%).

### Cost per active user (rough model, assumptions stated)

Assume an active user takes 8 walks a month, generates about 2 candidate loops per walk, and each generation costs about 4 routing calls (isochrone, directions, validation), plus about 12 map loads a month.

| Cost line | As built (Mapbox everything, public Overpass) | Open stack (MapLibre + free tiles, self-hosted routing, Overture POIs) |
| --- | --- | --- |
| Routing | 64 calls x $2/1,000 = $0.13 beyond 100k free/month | about $0 marginal; fixed VPS about $40 to $80/mo (unverified) |
| Map tiles | 12 loads x $5/1,000 = $0.06 beyond 50k free/month | about $0 with OpenFreeMap or Protomaps on R2 (unverified) |
| POI data | Public Overpass: not allowed for commercial or regular app use beyond tiny volumes ([OSM wiki](https://wiki.openstreetmap.org/wiki/Overpass_API)) | Overture Places, about 72M places, CDLA Permissive 2.0, free ([Mark Litwintschik](https://tech.marksblogg.com/overture-places-pois.html)) |
| AI walk notes | n/a | Claude Haiku 5.5 at $0.10 / $0.50 per million tokens: about $0.001 per walk, about $0.01 per user-month; Sonnet 5.5 about $0.02 per walk |
| Database and auth | Supabase Pro about $25/mo fixed (unverified) | Cloudflare D1 or Supabase, about $0 to $25/mo |
| Total variable | about $0.19 per active user per month once past free tiers (free tiers cover roughly 1,500 MAU) | about $0.01 to $0.03 per active user per month plus about $100/mo fixed |

Mapbox prices are from third-party summaries of mapbox.com/pricing ([freetier.co](https://freetier.co/directory/products/mapbox), [Woosmap](https://www.woosmap.com/blog/mapbox-pricing)); Google Places would be far more expensive at $32 per 1,000 Nearby Search calls ([Google pricing](https://developers.google.com/maps/billing-and-pricing/pricing)).
GraphHopper's hosted API (free 500 credits/day non-commercial, paid from about EUR 56/mo) is a middle option ([GraphHopper](https://www.graphhopper.com/pricing/)).

Unit economics conclusion:
- On the as-built Mapbox stack, each active user past the free tier costs about $0.19/month against about $0.075/month of revenue, so growth loses money.
- On an open stack, margin per active user is positive but tiny; covering $100/month of fixed costs needs roughly 1,500 active users, and $1,000/month of profit needs roughly 15,000.
- Paid acquisition for consumer fitness apps typically costs several dollars per install (unverified), which cannot be paid back at these revenue levels, so growth must be organic (local communities, sharing, SEO pages per neighbourhood).

### Monetization options, ranked by realism

1. Small subscription ($2.99/mo or $24.99/yr) for unlimited generation, coverage maps, themes; realistic but small.
2. Local business "sponsored stop" or "coffee at the halfway point"; needs density in one city and hands-on sales.
3. B2B or white label: neighbourhood walks for tourism boards, business improvement districts, real estate agents ("walk this neighbourhood before you buy"), employer wellness, senior living; plausible but a different company.
4. Paid creator tours (VoiceMap-style rev share) for local historians; strong content, slow supply growth.
5. Ads: poor fit and tiny yield at this scale.

### Distribution difficulty

- Hard: app store search for "walking route" is owned by Komoot, AllTrails, Strava, Footpath and dozens of step counters.
- Web/PWA limits: iOS Safari cannot record GPS in the background, so real walk tracking eventually needs a native app or imports.
- Strava's November 2024 API terms bar showing a user's data to anyone else and bar using API data for AI or ML, and June 2026 changes reportedly block intermediary platforms ([TechRepublic](https://techrepublic.com/article/news-strava-api-scraping-crackdown), [Marathon Handbook](https://marathonhandbook.com/strava-api-changes/)); a Strava import must stay private to the user and never feed the LLM.
- Best organic channels: local subreddits and Facebook/Nextdoor groups, walking clubs, "new to town" communities, shareable walk links, and per-neighbourhood landing pages.

## 5. Differentiation options for 2026

| Option | Why it is interesting | Defensibility |
| --- | --- | --- |
| A. "Streets you have never walked" loops for walkers | Coverage creates the most obsessive users in this space (Wandrer, CityStrides); nobody gives a casual walker one-tap loops that maximise new streets | Medium-low: the user's own walked-street history is real lock-in once built up; the algorithm is copyable |
| B. Grounded AI themed walks ("murals and mid-century houses", "coffee crawl", "old railway line") with short notes from Wikipedia/Wikidata/OSM/Overture | Cheap now (about $0.001 per walk), makes ordinary suburbs feel interesting, good for sharing | Low: Google Ask Maps or AllTrails could ship this; quality of grounding and taste is the only edge |
| C. Daily walk ritual: one fresh walk each morning, streaks, weekly neighbourhood challenge with friends | Habit loop and social sharing are what drive retention | Low to medium: network effects only inside a city |
| D. Safety and accessibility filters (lit streets, sidewalks, stroller or wheelchair friendly, avoid arterials, daylight-aware) | Real unmet need, especially for women walking alone and parents | Low-medium: OSM `lit`/`sidewalk` tags are patchy, so data cleaning is the moat |
| E. Niche wedge: people who just moved, dog walkers, stroller parents, retirees | Sharper message, easier channel (relocation, real estate, pet communities) | Low, but makes distribution tractable |

Recommendation: lead with A, flavour it with B, and use E (people who just moved somewhere) as the launch audience.
None of this is strongly defensible; the honest framing is "a well-made niche app", not a moat.

## 6. Risks

- Incumbent risk: Google, AllTrails and Strava already ship AI route features and can add "walk loop near me" any time.
- Demand risk: the visible indie apps doing this have very few reviews; novelty may wear off after a week, as Randonautica did.
- Economics risk: Mapbox-on-the-client costs exceed subscription revenue per user; must move to an open or server-side stack.
- Data risk: OSM sidewalk, lighting and POI coverage are uneven in suburbs; bad routes (dead ends, highways, private roads) destroy trust fast.
- Safety and liability: sending people to unfamiliar areas, at night, or onto unsafe roads; needs clear filters and terms.
- Platform risk: Strava API terms; iOS background location limits for a PWA; Overpass public API usage limits.
- AI risk: hallucinated history notes; every claim should come from a cited source record, not free generation.
- Privacy: walk history reveals home location; default to private, fuzz start points on shared links.
- Owner-time risk: the original code spent heavy effort on marketing pages and quota dashboards before validating the core loop.

## 7. Minimal 2 to 4 week MVP (only if pursued)

Goal: test whether "one-tap loop through streets I have never walked, with a few grounded notes" earns repeat use from 30 to 50 people in one metro area.

Stack: fresh Next 16.4 app with Turbopack, deployed on Cloudflare Workers (OpenNext adapter) or Vercel; MapLibre GL with OpenFreeMap or Protomaps tiles; routing server-side only (GraphHopper hosted for the pilot, or Mapbox Directions behind a server route with the key never shipped to the browser); Overture Places loaded for the pilot metro into D1 or Postgres; Supabase Auth or Better Auth (one system only); Claude Haiku 5.5 for notes, cached per POI.

### Week 1: core loop

- New repo state: commit the old prototype as-is for reference, then start a clean app.
- Port the idea of `routeGeneration.ts`: generate 5 to 10 candidate round trips per request (varied headings and seeds), score each by distance fit, POI interest and avoidance of major roads, return the best 3.
- Map view, duration slider (20, 30, 45, 60 min), "give me another", shareable link with fuzzed start.

### Week 2: "never walked" coverage

- Record walks in the foreground (PWA geolocation while the screen is on) and accept GPX import; store map-matched street segments per user.
- Re-score candidate loops by metres of new street; show "73% new streets" and a personal coverage map of the neighbourhood.
- Strava import optional and private only; never pass Strava data to the LLM.

### Week 3: grounded notes and habit

- For POIs on the chosen loop, pull Wikipedia/Wikidata/OSM facts and have Haiku 5.5 write 2 to 4 short notes that cite their source record; no source, no note.
- Themes as filters (green, history, food, art, quiet streets) and basic safety filters (avoid arterials, prefer lit streets where tagged, daylight warning).
- Daily "fresh walk" notification or email and a simple streak.

### Week 4: pilot and decision

- Recruit 30 to 50 people from one local subreddit, a walking club and a "new to the city" group.
- Add a paywall smoke test ($24.99/yr "founding member") without enforcing it.
- Measure: share of users who complete a generated walk, week-4 retention, walks per active user per week, paywall click-through, route quality complaints.
- Continue only if week-4 retention is at least about 20%, users average at least one walk a week, and at least 5% click the paywall; otherwise drop it and keep the coverage-scoring code as a portfolio piece.

## Sources

Primary and secondary sources are linked inline above.
Code facts come from reading `~/projects/strollz` and running `jest`, `tsc --noEmit` and `npm audit` locally on 2026-11-01 without modifying the project.
