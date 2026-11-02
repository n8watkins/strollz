# Strollz product definition

Status: concept, nothing shipped.
Last reviewed: 2026-11-01.
Owner decisions (2026-11-01): the pilot city is **Los Angeles**, and the name stays **Strollz**; domain and contact email are deferred.
Companion documents: [market report](../MARKET_REPORT_2026-11.md), [gap analysis](GAP_ANALYSIS.md), [delivery plan](DELIVERY_PLAN.md), [docs outline](DOCS_OUTLINE.md).

## 1. Positioning

### One-liner

Strollz gives you a walking loop from your door through streets you have never walked, with a few short notes about what you pass, each linked to its source.

### The narrow bet

The broad idea ("find a cool walk around town") is already served for free by Google Maps and by AllTrails, Komoot and Strava for people who plan.
The market report found one gap worth testing: coverage tracking (proven by Wandrer and CityStrides, which create very engaged users) aimed at casual walkers instead of runners and cyclists, delivered as a ready-made loop instead of a map you have to plan against.
Strollz is that, plus grounded notes to make ordinary streets interesting.
It is a well-made niche app, not a moat: the user's own walked-street history is the only real lock-in.

### Audience

Primary launch audience: people who recently moved to a town or neighborhood and want to learn it on foot.
The pilot recruits them in 1 to 2 walkable Los Angeles neighborhoods (candidates: Silver Lake / Echo Park, Pasadena, Santa Monica; see the delivery plan, Phase 0).

Secondary audiences, in order of expected fit:

1. Dog walkers bored of the same loop (walk daily, already have the habit).
2. Parents with strollers who need step-free, sidewalk-heavy routes.
3. Retirees and remote workers who walk for health and like a reason to go somewhere new.
4. Curious locals who enjoy local history and architecture.

Explicitly not the audience: hikers, trail runners, cyclists, tourists on a city break, and athletes chasing pace or distance.
Those are well served by AllTrails, Komoot, Strava, VoiceMap and GPSmyCity.

### Jobs to be done

- "When I have 30 minutes and want a walk, give me a good loop near home without me planning anything."
- "When I just moved somewhere, help me learn the area street by street and show me how much I have covered."
- "When I walk the same route every day, nudge me somewhere new that is still safe and convenient."
- "When I pass something interesting, tell me what it is, briefly, and only if it is true."
- "When I walk alone, at dusk or with a stroller, keep me on streets that suit that."

### Principles

- One tap first: the default flow is "how long do you have?" then three loops, no settings required.
- Honest by construction: no source, no note; no fake counts, ratings or testimonials anywhere.
- Private by default: walk history reveals where you live, so it never leaves your account unless you share a loop, and shared loops blur the start.
- Safety is free: safety and accessibility filters are never behind the paywall.
- Cheap to run: open data and self-hosted routing so a free user costs cents per month.

## 2. Features

Each feature lists the version it is planned for: P = 4-week pilot, B = public beta, L = later.

### 2.1 Walk generation

| Feature | Version | Notes |
| --- | --- | --- |
| Duration picker (20, 30, 45, 60 minutes) | P | Distance from duration times personal pace, default 4.8 km/h, learned from recorded walks in B |
| Three candidate loops per request | P | Generated from 8 to 12 candidates, scored on distance fit, new-street share, interest and road comfort |
| "Give me another" | P | New seed, excludes loops already shown today |
| Start from current location or saved home | P | Home is stored only as a fuzzed cell for display; the exact point stays on the device in P |
| Avoid dead ends, motorways, private roads and repeated streets | P | Routing engine profile plus a post-check that rejects loops with more than 10% backtracking |
| Loop preview: time, distance, % new streets, number of notes | P | Shown on each card before choosing |
| Turn-by-turn hints | B | Simple "turn left onto X" cards; full voice navigation is out of scope |
| Start from anywhere (e.g. near work) | B | Plus feature |
| Longer walks up to 2 hours | B | Plus feature |
| Point-to-point walks ending at a transit stop | L | Only if pilot users ask for it |

### 2.2 "Streets you have never walked" coverage map

| Feature | Version | Notes |
| --- | --- | --- |
| Record a walk in the foreground (screen on) | P | PWA geolocation with Screen Wake Lock; iOS cannot record in the background from a web app |
| GPX import of past walks | P | Lets people bring history from any watch or app |
| Map matching to street segments | P | Server-side, segments split at intersections |
| Personal coverage map | P | Walked, new today, not yet walked, for the area around home |
| % new streets on every candidate loop | P | The core differentiator |
| Neighborhood progress (percent of streets walked) | B | Per user-defined area or administrative neighborhood |
| Milestones (first 100 streets, 25% of a neighborhood) | B | Light celebration, no badges wall |
| Coverage anywhere you walk, with stats | B | Plus feature; free tier covers the home area |
| Strava import | L | Only if Strava terms allow it, private to the user, never sent to an AI model |

### 2.3 Notes about places you pass (with sources)

| Feature | Version | Notes |
| --- | --- | --- |
| 2 to 4 notes per loop | P | Selected from places within about 40 m of the loop |
| Every note cites a source record | P | Wikipedia, Wikidata, OpenStreetMap tags (e.g. `start_date`, `architect`, `heritage`) or Overture place category |
| "No source, no note" rule | P | Notes are summaries of fetched text, never free generation |
| Notes generated once per place, cached | P | Cost control and consistency; regenerated when the source changes |
| Report a wrong note | P | One tap, hides the note for everyone pending review |
| Local contributor notes (historians, residents) | L | Moderated, attributed, optional revenue share |

### 2.4 Safety and accessibility options

All free on every plan.

| Feature | Version | Notes |
| --- | --- | --- |
| Avoid busy roads | P | Penalise primary and secondary roads without sidewalks |
| Prefer lit streets where mapped | P | Uses OSM `lit=*`; the UI says when data is missing |
| Daylight warning | P | Warns if the loop would end after sunset |
| Step-free / stroller friendly | B | Avoid `highway=steps`, steep inclines and unpaved paths where tagged |
| Prefer sidewalks | B | OSM `sidewalk=*` and `footway=sidewalk`; coverage is patchy in suburbs |
| Share live walk with a trusted contact | L | Needs native background location to be reliable |

### 2.5 Themes

| Theme | Version | Data |
| --- | --- | --- |
| Surprise me (default) | P | Mixed scoring |
| Green and quiet | P | Parks, footpaths, residential streets, low road class |
| Coffee stop at the halfway point | B | Overture Places cafes with opening hours where known |
| Architecture | B | OSM `building:architecture`, `architect`, heritage listings, Wikidata |
| History | B | Wikipedia/Wikidata items, memorials, historic markers |
| Public art | B | OSM `tourism=artwork`, Wikidata public art items |

### 2.6 Streaks and light social

| Feature | Version | Notes |
| --- | --- | --- |
| Daily "fresh walk" suggestion (opt-in notification or email) | P | One loop per morning |
| Weekly walking goal and gentle streak | P | Weekly, not daily, to avoid guilt |
| Share a loop link | P | Start point snapped to a nearby public spot and blurred by 200 to 400 m |
| Walk the same loop with a friend | B | Shared link opens the loop for them |
| Neighborhood challenge among friends | L | Private groups only |
| Public feed or leaderboard | Not planned | Conflicts with privacy and the casual audience |

## 3. Free vs paid

| Capability | Free | Plus |
| --- | --- | --- |
| Loops per day | 3 | Unlimited |
| Maximum loop length | 45 minutes | 2 hours |
| Start point | Current location or home | Anywhere |
| Coverage map | Home area (about 3 km radius) | Everywhere, with stats and milestones |
| Notes with sources | Yes | Yes |
| Themes | Surprise me, Green and quiet | All themes |
| Safety and accessibility filters | All | All |
| GPX import | Last 90 days | Full history, plus export |
| Daily walk and streaks | Yes | Yes |
| Ads | Never | Never |

Rationale: the free tier must be good enough to build the coverage habit, because that history is the only lock-in.
Paid features target the obsessive "walk every street" users that Wandrer and CityStrides show exist, who are also the most likely to pay.

## 4. Pricing (planned, not charging)

| Plan | Price | Notes |
| --- | --- | --- |
| Free | $0 | As above |
| Plus | $29.99 per year or $3.99 per month | Annual is the default; monthly is 60% more expensive to encourage annual |
| Founding member (pilot testers only) | $24.99 per year, kept while subscribed | The pilot paywall smoke test from the market report |

How the price was reasoned from competitors (US list prices, sources in the market report):

| Product | Annual price | What it is |
| --- | --- | --- |
| Footpath Elite | $23.49 | Route planning tool |
| Strolly | $24.99 (or $2.99/week) | Random loop generator, the closest feature match |
| Wandrer | $30, rising to $40 from May 2026 | Coverage tracking for cyclists and runners |
| AllTrails Plus | $35.99 | Trails, offline maps |
| Komoot Premium | about EUR 59.99 | Outdoor route planning |
| Strava, AllTrails Peak | $79.99 | Athlete subscriptions with AI routes |

- Pure loop generators sit around $24 to $25, and their tiny traction suggests generation alone is not worth paying for.
- Coverage tools sit at $30 to $40 and have the most loyal users.
- Strollz combines both plus sourced notes, so $29.99 sits just above the generators and below Wandrer and AllTrails Plus.
- Monthly at $3.99 avoids the weekly-subscription pattern (Strolly's $2.99/week) that casual users dislike.
- Sell on the web (Stripe) first: a PWA avoids the 15 to 30% app store fee, which matters at about $0.075 revenue per active user per month (3% conversion at $29.99/year).
- Economics from the report still apply: on the open stack, break-even on about $100/month fixed costs needs roughly 1,500 monthly active users, so pricing alone does not make this a business; it keeps a side project self-funding.

## 5. Competitive comparison

Strollz values are planned, not shipped.
Competitor facts were taken from the sources linked in the [market report](../MARKET_REPORT_2026-11.md) (section 3) on 2026-11-01; anything not stated publicly is marked "not advertised".

| | Strollz (planned) | Google Maps | AllTrails | Strava | Wandrer.earth | CityStrides | Strolly (indie) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Plans a walking loop from where you are | Yes | No, A to B directions | Partial: AI Custom Routes in Peak ($79.99/yr), trail-focused | Partial: route suggestions for subscribers, run/ride-focused | No | No | Yes |
| Remembers which streets you walked | Yes | No (Timeline stores location history, not street coverage) | No | Partial: personal heatmap for subscribers | Yes, from connected activities (mainly Strava) | Yes, street completion by city | Not advertised |
| Steers new loops onto unwalked streets | Yes | No | No | No | Partial: shows untraveled roads, you plan | Partial: shows incomplete streets, you plan | Not advertised |
| Notes about places with sources | Yes, every note cites a source | Partial: Gemini "Ask Maps" answers, not tied to a walk | No (trail reviews) | No | No | No | Not advertised |
| Primary audience | Casual walkers near home | Everyone getting somewhere | Hikers | Runners and cyclists | Cyclists and runners | Runners | Walkers |
| Works without another app | Yes (phone only, GPX optional) | Yes | Yes | Yes | No, needs Strava or similar | Needs a connected tracker | Yes |
| Price (US, per year) | Free; Plus planned $29.99 | Free | Free; Plus $35.99; Peak $79.99 | Free; $79.99 | Free tier; $40 | Free; paid tier (price unverified) | $24.99 or $2.99/week |

Where Strollz is different:

- Versus Google Maps: designs a walk for its own sake and remembers what you have walked; Google gets you somewhere.
- Versus AllTrails and Komoot: urban and suburban streets near home, not trails an hour away.
- Versus Strava: no pace, segments or performance; a walk is not a workout.
- Versus Wandrer and CityStrides: same coverage obsession, but it hands you a ready loop instead of a map to plan against, and it is built for walkers without requiring a fitness tracker.
- Versus Strolly and other random-walk apps: novelty is measured against your own history (new streets), not randomness, and notes give a reason to go.

Where Strollz is weaker, honestly:

- Brand, data and distribution: every incumbent above can ship "walk loop near me" in a release.
- No offline maps, no trails, no turn-by-turn voice navigation at launch.
- Notes will be sparse in suburbs with few Wikipedia or Wikidata entries.
- A web app cannot record walks in the background on iOS.

## 6. Name

Decided 2026-11-01 by the owner: keep "Strollz".
It is short, friendly and says "walking"; the trailing "z" is a little dated but memorable.
The landing page is live at https://strollz.n8builds.dev; own domain later.
Domain and app store listing are deferred; check trademarks and the `.com`/`.app` domains before buying (unverified today).

Alternatives, kept only as a fallback if "Strollz" turns out to be unavailable:

| Name | Why | Concern |
| --- | --- | --- |
| Unwalked | Says the core feature exactly | Negative-sounding word |
| Sidestreet | Urban, curious, near home | Common word, likely crowded |
| Newstreet | Clear promise | Generic, hard to trademark |
| Loopabout | Loops plus "walkabout", playful | Slightly long |
| Wanderloop | Discovery plus loop | Close to Wandrer.earth, avoid confusion |
| Every Street | Speaks to coverage fans | Close to "run every street" community language |

The pilot does not need to test names now that the name is decided.
