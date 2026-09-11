import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Matheus Santos | Dados, Cloud & DevOps";

const BG = "#0E1116";
const ACCENT = "#4ADE80";
const LINE = "#2B353D";

/** Cartão de compartilhamento: o grafo de CI/CD reduzido a um diagrama. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: BG,
          padding: "72px 80px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#9FB0A6", fontSize: 22 }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: ACCENT }} />
          deploy.yml · passing
        </div>

        <div
          style={{
            display: "flex",
            color: "#E8EDF1",
            fontSize: 92,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: 1.02,
            marginTop: 28,
          }}
        >
          Matheus Santos Moises
        </div>

        <div style={{ display: "flex", color: ACCENT, fontSize: 28, marginTop: 26, letterSpacing: "0.02em" }}>
          dados &amp; analytics · business intelligence · cloud &amp; devops
        </div>

        <div style={{ display: "flex", color: "#8A97A1", fontSize: 26, marginTop: 40 }}>
          matheusdata.dev
        </div>

        {/* o grafo, em diagrama: commit → build → testes → scan → deploy */}
        <div
          style={{
            position: "absolute",
            right: 80,
            bottom: 72,
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          {[LINE, LINE, ACCENT, LINE, ACCENT].map((color, i) => (
            <div
              key={i}
              style={{
                width: 26,
                height: 26,
                background: color,
                transform: "rotate(45deg)",
                opacity: color === ACCENT ? 1 : 0.65,
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
