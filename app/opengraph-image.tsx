import { ImageResponse } from "next/og";

// Site-wide branded Open Graph / Twitter fallback image (1200×630). Pages that
// set their own openGraph.images (e.g. tour photos) override this automatically.
export const alt = "Mista Concierge Travel — Luxury Caribbean Journeys";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: 80,
          background: "linear-gradient(135deg, #0F3D2E 0%, #1B7A5C 100%)",
          color: "#F7F3EA",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 32,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#B8A058",
          }}
        >
          Mista Concierge Travel
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.1 }}>
            Luxury Caribbean Journeys
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              marginTop: 28,
              maxWidth: 920,
              color: "rgba(247, 243, 234, 0.85)",
            }}
          >
            Bespoke island escapes, crafted by locals who know every hidden cove.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
