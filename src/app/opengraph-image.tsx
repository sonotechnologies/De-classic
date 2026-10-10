import { ImageResponse } from "next/og";

export const alt = "De Classic Hotel · rooms and a bar in Agric, Ikorodu";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share image: the paint line, aqua above and white below, with the lowercase wordmark across it. */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#FFFFFF",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          flex: 1.15,
          background: "#B1ECEC",
          display: "flex",
          alignItems: "flex-end",
          padding: "0 72px",
        }}
      >
        <div
          style={{
            fontSize: 172,
            fontWeight: 800,
            letterSpacing: -10,
            color: "#111111",
            lineHeight: 0.8,
            display: "flex",
          }}
        >
          de classic
        </div>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 72px",
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: "#111111",
            display: "flex",
          }}
        >
          rooms upstairs, a bar downstairs
        </div>
        <div style={{ fontSize: 30, color: "#0B5C5C", display: "flex" }}>Agric, Ikorodu · book in under a minute</div>
      </div>
    </div>,
    size,
  );
}
