/**
 * Geometry for the illustrative neighbourhood used by the hero loop and the
 * coverage map. It is a fictional street grid with deterministic jitter so it
 * reads like a real map without needing any map tiles or API keys.
 */

export type Point = { x: number; y: number };

export type Segment = {
  id: string;
  a: Point;
  b: Point;
};

export const VIEW = { width: 480, height: 360 } as const;

const COLS = 7;
const ROWS = 6;
const X0 = 30;
const Y0 = 30;
const DX = 70;
const DY = 60;

/** Small deterministic offset so the grid does not look machine-made. */
function jitter(c: number, r: number, axis: 0 | 1): number {
  const seed = Math.sin((c + 1) * 12.9898 + (r + 1) * 78.233 + axis * 37.719) * 43758.5453;
  return Math.round(((seed - Math.floor(seed)) - 0.5) * 12);
}

export function node(c: number, r: number): Point {
  return { x: X0 + c * DX + jitter(c, r, 0), y: Y0 + r * DY + jitter(c, r, 1) };
}

const hId = (c: number, r: number) => `h${c}-${r}`; // from (c,r) to (c+1,r)
const vId = (c: number, r: number) => `v${c}-${r}`; // from (c,r) to (c,r+1)

/** Segments removed to suggest dead ends and a park without through streets. */
const REMOVED = new Set([hId(5, 5), vId(6, 4), vId(0, 0), hId(4, 1)]);

export const segments: Segment[] = (() => {
  const out: Segment[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 1; c++) {
      const id = hId(c, r);
      if (!REMOVED.has(id)) out.push({ id, a: node(c, r), b: node(c + 1, r) });
    }
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS - 1; r++) {
      const id = vId(c, r);
      if (!REMOVED.has(id)) out.push({ id, a: node(c, r), b: node(c, r + 1) });
    }
  }
  return out;
})();

/** The park occupies the block between columns 4-5 and rows 1-2. */
export const parkPolygon: Point[] = [node(4, 1), node(5, 1), node(5, 2), node(4, 2)];

/** A small pond in the lower-left corner of the park. */
export const pond = (() => {
  const a = node(4, 1);
  const b = node(4, 2);
  return { x: a.x + 20, y: b.y - 16 };
})();

/** A curving footpath through the park, drawn as a quadratic curve. */
export const parkPath = (() => {
  const a = node(4, 1);
  const b = node(5, 2);
  return `M ${a.x + 8} ${a.y + 10} Q ${a.x + 58} ${a.y + 6} ${b.x - 10} ${b.y - 8}`;
})();

/** A creek in the bottom-right corner, which explains the dead ends there. */
export const creekPath = "M 330 372 C 392 338, 430 326, 492 246";

export const home = node(1, 3);

/** Today's generated loop, as a sequence of grid nodes starting at home. */
const LOOP_NODES: Array<[number, number]> = [
  [1, 3],
  [1, 4],
  [2, 4],
  [3, 4],
  [4, 4],
  [4, 3],
  [5, 3],
  [5, 2],
  [4, 2],
  [3, 2],
  [3, 3],
  [2, 3],
  [1, 3],
];

export const loopPoints: Point[] = LOOP_NODES.map(([c, r]) => node(c, r));

export const loopPath = loopPoints
  .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
  .join(" ");

function segmentIdBetween([c1, r1]: [number, number], [c2, r2]: [number, number]): string {
  if (r1 === r2) return hId(Math.min(c1, c2), r1);
  return vId(c1, Math.min(r1, r2));
}

export const loopSegmentIds = new Set(
  LOOP_NODES.slice(1).map((n, i) => segmentIdBetween(LOOP_NODES[i], n)),
);

/**
 * Streets the sample walker has already walked: the blocks around home, plus a
 * route toward the high street at the top of the map.
 */
export const walkedSegmentIds = new Set<string>(
  segments
    .filter((s) => {
      const [kind, rest] = [s.id[0], s.id.slice(1)];
      const [c, r] = rest.split("-").map(Number);
      if (kind === "h") return c <= 1 && r >= 1;
      return c <= 2 && r >= 1 && r <= 4;
    })
    .map((s) => s.id)
    .concat([hId(1, 0), hId(2, 0), hId(3, 0), vId(2, 0)]),
);

function length(s: Segment): number {
  return Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y);
}

/** Share of today's loop (by length) that is on streets not walked before. */
export const loopNewShare = (() => {
  const loopSegs = segments.filter((s) => loopSegmentIds.has(s.id));
  const total = loopSegs.reduce((sum, s) => sum + length(s), 0);
  const fresh = loopSegs
    .filter((s) => !walkedSegmentIds.has(s.id))
    .reduce((sum, s) => sum + length(s), 0);
  return Math.round((fresh / total) * 100);
})();

/** Where the numbered note pins sit along the loop (midpoints of segments). */
export const notePins: Array<{ n: number; at: Point }> = [
  { n: 1, at: mid(node(2, 4), node(3, 4)) },
  { n: 2, at: mid(node(5, 2), node(5, 3)) },
  { n: 3, at: mid(node(3, 2), node(4, 2)) },
];

function mid(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Share of all streets (by length) walked before and after today's loop. */
export const coverageShares = (() => {
  const total = segments.reduce((sum, s) => sum + length(s), 0);
  const walked = segments
    .filter((s) => walkedSegmentIds.has(s.id))
    .reduce((sum, s) => sum + length(s), 0);
  const added = segments
    .filter((s) => loopSegmentIds.has(s.id) && !walkedSegmentIds.has(s.id))
    .reduce((sum, s) => sum + length(s), 0);
  return {
    before: Math.round((walked / total) * 100),
    after: Math.round(((walked + added) / total) * 100),
  };
})();
