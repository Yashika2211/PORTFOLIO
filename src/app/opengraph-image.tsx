import { ImageResponse } from "next/og";
import { profile, stats } from "@/data/portfolio";

export const alt = `${profile.name} — ${profile.headline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const corner = (pos: Record<string, number>, rot: number) => (
  <div
    style={{
      position: "absolute",
      ...pos,
      width: 70,
      height: 70,
      borderTop: "3px solid #00e5ff",
      borderLeft: "3px solid #00e5ff",
      transform: `rotate(${rot}deg)`,
      display: "flex",
    }}
  />
);

export default function OgImage() {
  const highlight = stats.filter((s) => ["intern", "hack", "f05"].includes(s.id));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "radial-gradient(circle at 78% 45%, #0b3a4a 0%, #071423 35%, #05070d 70%)",
          color: "#e8f4f8",
          fontFamily: "sans-serif",
          padding: 80,
        }}
      >
        {corner({ top: 30, left: 30 }, 0)}
        {corner({ top: 30, right: 30 }, 90)}
        {corner({ bottom: 30, right: 30 }, 180)}
        {corner({ bottom: 30, left: 30 }, 270)}

        {/* Concentric core rings */}
        {[340, 260, 180].map((d, i) => (
          <div
            key={d}
            style={{
              position: "absolute",
              right: 150 - d / 2 + 120,
              top: 315 - d / 2,
              width: d,
              height: d,
              borderRadius: "50%",
              border: `${i === 2 ? 3 : 1}px solid rgba(0,229,255,${0.25 + i * 0.25})`,
              boxShadow: i === 2 ? "0 0 60px rgba(0,229,255,0.6), inset 0 0 50px rgba(0,229,255,0.4)" : "none",
              display: "flex",
            }}
          />
        ))}

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 720 }}>
          <div style={{ fontSize: 22, letterSpacing: 8, color: "#00e5ff", display: "flex" }}>
            Y.A.S.H.A. // PORTFOLIO ONLINE
          </div>
          <div style={{ fontSize: 86, fontWeight: 800, marginTop: 18, letterSpacing: 2, display: "flex" }}>
            {profile.name}
          </div>
          <div style={{ fontSize: 32, color: "#9fb3c2", marginTop: 12, display: "flex" }}>{profile.headline}</div>
          <div style={{ fontSize: 28, color: "#ffb547", marginTop: 26, display: "flex" }}>{profile.tagline}</div>
          <div style={{ display: "flex", gap: 22, marginTop: 44 }}>
            {highlight.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  border: "1px solid rgba(0,229,255,0.45)",
                  borderRadius: 10,
                  padding: "12px 18px",
                  background: "rgba(0,229,255,0.06)",
                }}
              >
                <div style={{ fontSize: 34, fontWeight: 700, color: "#00e5ff", display: "flex" }}>
                  {s.decimals ? s.value.toFixed(s.decimals) : `${s.value}${s.suffix ?? ""}`}
                </div>
                <div style={{ fontSize: 16, color: "#9fb3c2", maxWidth: 200, display: "flex" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
