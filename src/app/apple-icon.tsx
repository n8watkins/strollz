import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#182a25" }}>
        <svg width={180} height={180} viewBox="0 0 32 32">
          <path
            d="M10 22 L10 13 Q10 9 14 9 L21 9 Q24 9 24 12 L24 16 Q24 19 21 19 L16 19 L16 23"
            fill="none"
            stroke="#e4572e"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={10} cy={22.5} r={2.6} fill="#ffffff" />
        </svg>
      </div>
    ),
    size,
  );
}
