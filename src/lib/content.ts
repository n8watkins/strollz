/**
 * Landing page copy that is shared between sections and structured data.
 * Competitor facts are sourced in docs/PRODUCT.md (checked 2026-11-01).
 */

export const steps = [
  {
    title: "Say how long you have",
    body: "20, 30, 45 or 60 minutes. Strollz starts from your door, or from wherever you are standing.",
  },
  {
    title: "Pick one of three loops",
    body: "Each loop shows its time, distance and how much of it is on streets you have never walked.",
  },
  {
    title: "Walk it and watch your map fill in",
    body: "A few short notes appear as you pass things worth knowing about. New streets are added to your map.",
  },
] as const;

export const audiences = [
  "You just moved and want to learn the area on foot",
  "You walk the dog and are bored of the same loop",
  "You push a stroller and need step-free streets",
  "You like knowing the story behind ordinary places",
] as const;

export type Feature = { title: string; body: string; points: string[] };

export const features: Feature[] = [
  {
    title: "Loops from your door",
    body: "One tap gives you a round trip that fits the time you have and brings you back home.",
    points: [
      "Three options per request, plus “give me another”",
      "Avoids dead ends, highways and private roads",
      "Distance tuned to your walking pace",
    ],
  },
  {
    title: "Streets you have never walked",
    body: "Strollz remembers which streets you have walked and steers each loop toward the ones you have not.",
    points: [
      "Every loop shows its share of new streets",
      "A personal coverage map of your neighborhood",
      "Import past walks from a GPX file",
    ],
  },
  {
    title: "Notes with sources",
    body: "Two to four short notes per loop about what you pass: a building, a park, a street name.",
    points: [
      "Drawn from Wikipedia, Wikidata and OpenStreetMap",
      "Every note links to where it came from",
      "No source, no note. Nothing is made up",
    ],
  },
  {
    title: "Safety and accessibility",
    body: "Filters that are free for everyone, because getting home safely should never be a paid feature.",
    points: [
      "Prefer lit streets and sidewalks where they are mapped",
      "Avoid busy roads, or keep to step-free routes",
      "A heads-up when a loop would end after dark",
    ],
  },
  {
    title: "Themes",
    body: "Give the loop a flavor when you want one, or leave it on “surprise me”.",
    points: [
      "Green and quiet streets",
      "Coffee stop at the halfway point",
      "Architecture, history and public art",
    ],
  },
  {
    title: "Streaks and light social",
    body: "Enough to build a habit, without turning a walk into a competition.",
    points: [
      "A weekly walking goal and a gentle streak",
      "Share a loop with a friend, start point blurred",
      "No public feed or leaderboard by default",
    ],
  },
];

export type Cell = { v: "yes" | "no" | "partial" | "text"; label: string };

export const competitors = [
  "Strollz",
  "Google Maps",
  "AllTrails",
  "Strava",
  "Wandrer",
  "CityStrides",
  "Strolly",
] as const;

const Y = (label = "Yes"): Cell => ({ v: "yes", label });
const N = (label = "No"): Cell => ({ v: "no", label });
const P = (label: string): Cell => ({ v: "partial", label });
const T = (label: string): Cell => ({ v: "text", label });

export const comparison: Array<{ row: string; cells: Cell[] }> = [
  {
    row: "Plans a walking loop from where you are",
    cells: [Y("Planned"), N("A to B directions"), P("Paid Peak tier"), P("Paid, built for runs"), N(), N(), Y()],
  },
  {
    row: "Remembers which streets you have walked",
    cells: [Y("Planned"), N(), N(), P("Paid heatmap"), Y(), Y(), N("Not advertised")],
  },
  {
    row: "Steers new loops onto streets you have not walked",
    cells: [Y("Planned"), N(), N(), N(), P("Shows them, you plan"), P("Shows them, you plan"), N("Not advertised")],
  },
  {
    row: "Short notes about places, each with a source",
    cells: [Y("Planned"), P("AI answers only"), N(), N(), N(), N(), N("Not advertised")],
  },
  {
    row: "Built mainly for",
    cells: [
      T("Casual walkers near home"),
      T("Getting somewhere"),
      T("Trails and hikes"),
      T("Runners and riders"),
      T("Cyclists and runners"),
      T("Runners"),
      T("Walkers"),
    ],
  },
  {
    row: "Price (US, per year)",
    cells: [
      T("Free, Plus planned at $29.99"),
      T("Free"),
      T("Free, $35.99 or $79.99"),
      T("Free, $79.99"),
      T("Free tier, $40"),
      T("Free, paid tier"),
      T("$24.99"),
    ],
  },
];

export const plans = [
  {
    name: "Free",
    price: "$0",
    cadence: "",
    blurb: "Everything you need for a new walk most days.",
    points: [
      "3 loops a day, up to 45 minutes",
      "Coverage map of your home neighborhood",
      "Sourced notes on every loop",
      "All safety and accessibility filters",
    ],
    highlight: false,
  },
  {
    name: "Plus",
    price: "$29.99",
    cadence: "per year, or $3.99 a month",
    blurb: "For people who want to walk every street.",
    points: [
      "Unlimited loops, up to 2 hours",
      "Coverage anywhere you walk, with stats and milestones",
      "All themes, and loops from any start point",
      "GPX import and export",
    ],
    highlight: true,
  },
] as const;

export const faqs = [
  {
    q: "Can I use Strollz today?",
    a: "Not yet. Strollz is in development. The plan is a small pilot in Los Angeles first, then a public beta if people keep using it. There is no app to download and nothing to pay for.",
  },
  {
    q: "What happens to my location?",
    a: "Strollz will use your location to plan loops and, only when you choose, to record a walk. Walk history will be private by default, exportable, and deletable at any time. Shared loops blur the start point so they do not reveal your home. Location data will never be sold or used for ads. This page itself sets no cookies and collects nothing.",
  },
  {
    q: "Where do the notes come from?",
    a: "From open sources such as Wikipedia, Wikidata and OpenStreetMap. An AI model may shorten a source into a sentence or two, but every note links to its source, and if there is no source there is no note.",
  },
  {
    q: "Will it work where I live?",
    a: "Routes are built from OpenStreetMap, which covers most towns and cities. Sidewalk, lighting and step-free details are patchier, especially in suburbs, so those filters will say when data is missing. The pilot starts in one or two Los Angeles neighborhoods so route quality can be checked by hand.",
  },
  {
    q: "Is it safe to walk streets I do not know?",
    a: "Strollz avoids roads that are not meant for walking and can prefer lit streets, sidewalks and daylight. Map data can be wrong or out of date, so always use your own judgement and turn back if a street does not feel right.",
  },
  {
    q: "Do I need Strava or a watch?",
    a: "No. A phone is enough. You will be able to import past walks from a GPX file. Data imported from other services stays private to you and is never used to train or prompt AI models.",
  },
  {
    q: "Is it an app or a website?",
    a: "The first version will be a mobile web app you can add to your home screen. Phones only record location reliably while a web app is open, so a native app may follow if the pilot goes well.",
  },
  {
    q: "Why not just use Google Maps?",
    a: "Google Maps is excellent at getting you somewhere. Strollz is for when the walk is the point: it plans a loop, remembers what you have already walked and sends you somewhere new.",
  },
] as const;
