import {
  VIEW,
  creekPath,
  home,
  loopPath,
  loopSegmentIds,
  notePins,
  parkPath,
  parkPolygon,
  pond,
  segments,
  walkedSegmentIds,
  type Point,
} from "@/lib/neighbourhood";

const poly = (pts: Point[]) => pts.map((p) => `${p.x},${p.y}`).join(" ");

function Base({ quiet = false }: { quiet?: boolean }) {
  return (
    <>
      <rect width={VIEW.width} height={VIEW.height} fill="var(--map-bg)" />
      <path d={creekPath} fill="none" stroke="var(--water)" strokeWidth={14} strokeLinecap="round" />
      <polygon points={poly(parkPolygon)} fill="var(--park)" />
      <ellipse cx={pond.x} cy={pond.y} rx={11} ry={7} fill="var(--water)" />
      <path
        d={parkPath}
        fill="none"
        stroke="var(--park-path)"
        strokeWidth={2}
        strokeDasharray="3 4"
        strokeLinecap="round"
      />
      {!quiet &&
        segments.map((s) => (
          <line
            key={s.id}
            x1={s.a.x}
            y1={s.a.y}
            x2={s.b.x}
            y2={s.b.y}
            stroke="var(--street)"
            strokeWidth={7}
            strokeLinecap="round"
          />
        ))}
    </>
  );
}

function HomePin() {
  return (
    <g transform={`translate(${home.x} ${home.y})`}>
      <circle r={11} fill="var(--ink)" stroke="#fff" strokeWidth={3} />
      <path d="M -5 1 L 0 -4 L 5 1 L 5 5 L -5 5 Z" fill="#fff" />
    </g>
  );
}

/** Hero visual: a generated loop from home with numbered note pins. */
export function LoopMap({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      className={className}
      role="img"
      aria-labelledby="loop-map-title"
    >
      <title id="loop-map-title">
        Illustration of a 35 minute walking loop that starts at home, passes a park and three
        numbered notes, and returns home.
      </title>
      <Base />
      <path
        d={loopPath}
        fill="none"
        stroke="#fff"
        strokeWidth={12}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d={loopPath}
        fill="none"
        stroke="var(--coral)"
        strokeWidth={6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {notePins.map(({ n, at }) => (
        <g key={n} transform={`translate(${at.x} ${at.y})`}>
          <circle r={10} fill="#fff" stroke="var(--coral-ink)" strokeWidth={2.5} />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={11}
            fontWeight={700}
            fill="var(--coral-ink)"
            fontFamily="var(--font-sans), system-ui, sans-serif"
          >
            {n}
          </text>
        </g>
      ))}
      <HomePin />
    </svg>
  );
}

/** Coverage visual: walked streets, today's new streets, and streets not yet walked. */
export function CoverageMap({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      className={className}
      role="img"
      aria-labelledby="coverage-map-title"
    >
      <title id="coverage-map-title">
        Illustration of a personal coverage map: streets already walked in green, streets added by
        today&apos;s loop in orange, and streets not yet walked in light grey.
      </title>
      <Base quiet />
      {segments.map((s) => {
        const walked = walkedSegmentIds.has(s.id);
        const fresh = loopSegmentIds.has(s.id) && !walked;
        return (
          <line
            key={s.id}
            x1={s.a.x}
            y1={s.a.y}
            x2={s.b.x}
            y2={s.b.y}
            stroke={fresh ? "var(--coral)" : walked ? "var(--moss)" : "var(--street-unwalked)"}
            strokeWidth={fresh || walked ? 6 : 5}
            strokeLinecap="round"
            strokeDasharray={fresh || walked ? undefined : "1 9"}
          />
        );
      })}
      <HomePin />
    </svg>
  );
}
