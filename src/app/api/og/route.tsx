import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090b",
          fontFamily: "sans-serif",
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "rgba(245,158,11,0.12)",
            filter: "blur(120px)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Lightning bolt */}
        <div style={{ fontSize: 80, marginBottom: 24 }}>⚡</div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 80,
            fontWeight: 800,
            letterSpacing: "-2px",
            marginBottom: 20,
          }}
        >
          <span style={{ color: "#ffffff" }}>Stark</span>
          <span style={{ color: "#f59e0b" }}>Send</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 32,
            color: "#a3a3a3",
            marginBottom: 48,
            letterSpacing: "-0.5px",
          }}
        >
          1-Click Crypto Tipping on Starknet
        </div>

        {/* Pills */}
        <div style={{ display: "flex", gap: 16 }}>
          {["Gasless", "Multi-token", "Embeddable"].map((label) => (
            <div
              key={label}
              style={{
                padding: "12px 28px",
                borderRadius: 999,
                border: "1px solid rgba(245,158,11,0.3)",
                background: "rgba(245,158,11,0.08)",
                color: "#f59e0b",
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
