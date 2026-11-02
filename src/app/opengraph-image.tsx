import { ImageResponse } from "next/og";
import { VIEW, home, loopPath, segments } from "@/lib/neighbourhood";
import { site } from "@/lib/site";

// Rendered once at build time for the static export.
export const dynamic = "force-static";

export const alt = "Strollz: walk the streets you have never walked";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const streets = segments.map((s) => `M ${s.a.x} ${s.a.y} L ${s.b.x} ${s.b.y}`).join(" ");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#faf7f2",
          color: "#182a25",
          padding: 64,
          gap: 48,
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>{site.name}</div>
          <div style={{ display: "flex", fontSize: 68, fontWeight: 700, lineHeight: 1.05, marginTop: 28 }}>
            Walk the streets you have never walked.
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#4b5b56", marginTop: 28, lineHeight: 1.35 }}>
            One-tap walking loops from your door, with short notes about what you pass.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            width: 480,
            height: 360,
            borderRadius: 28,
            overflow: "hidden",
            border: "2px solid #e4ddd1",
          }}
        >
          <svg width={480} height={360} viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}>
            <rect width={VIEW.width} height={VIEW.height} fill="#f4efe6" />
            <path d={streets} stroke="#e2dacb" strokeWidth={7} strokeLinecap="round" fill="none" />
            <path d={loopPath} stroke="#ffffff" strokeWidth={12} strokeLinejoin="round" strokeLinecap="round" fill="none" />
            <path d={loopPath} stroke="#e4572e" strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" fill="none" />
            <circle cx={home.x} cy={home.y} r={11} fill="#182a25" stroke="#ffffff" strokeWidth={3} />
          </svg>
        </div>
      </div>
    ),
    size,
  );
}
