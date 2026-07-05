import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

// Branded Open Graph / Twitter fallback (1200×630) using logo-full.png.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logoBuffer = await readFile(path.join(process.cwd(), "public/logo-full.png"));
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0F3D2E 0%, #1B7A5C 100%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt="Bucketlist Caribbean"
          width={420}
          height={640}
          style={{ objectFit: "contain", maxHeight: "88%" }}
        />
      </div>
    ),
    { ...size },
  );
}
