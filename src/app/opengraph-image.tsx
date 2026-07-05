import { ImageResponse } from "next/og";
import config from "@/lib/config";

export const alt = config.site_description;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const LOGO = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
<rect x='0.75' y='0.75' width='22.5' height='22.5' rx='5.5' fill='#f7f6f3'/>
<g fill='#0f766e'>
<circle cx='5.2' cy='5.2' r='1.05' opacity='0.35'/>
<circle cx='18.8' cy='5.2' r='1.05' opacity='0.35'/>
<circle cx='5.2' cy='18.8' r='1.05' opacity='0.35'/>
<circle cx='18.8' cy='18.8' r='1.05' opacity='0.35'/>
<circle cx='12' cy='7' r='2.4'/>
<path d='M12 9.6C10.4 9.6 9.7 10.7 9.7 11.7L6.9 12.9C6.1 13.2 6.1 14.3 6.9 14.6L9.6 15.6C9.1 16.6 8.2 17.7 7.8 18.9C7.5 19.7 8.1 20.5 9 20.5L10.2 20.5C10.8 20.5 11.3 20.1 11.4 19.5L12 17.9L12.6 19.5C12.7 20.1 13.2 20.5 13.8 20.5L15 20.5C15.9 20.5 16.5 19.7 16.2 18.9C15.8 17.7 14.9 16.6 14.4 15.6L17.1 14.6C17.9 14.3 17.9 13.2 17.1 12.9L14.3 11.7C14.3 10.7 13.6 9.6 12 9.6Z'/>
</g></svg>`;

const LOGO_SRC = `data:image/svg+xml,${encodeURIComponent(LOGO)}`;

async function loadDisplayFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700",
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1)" } },
    ).then((res) => res.text());
    const url = css.match(
      /src: url\((https:[^)]+)\) format\('(?:truetype|opentype)'\)/,
    )?.[1];
    if (!url) return null;
    return await fetch(url).then((res) => res.arrayBuffer());
  } catch {
    return null;
  }
}

const PILLS = ["Filtrable", "Imprimable", "Curatée"];

export default async function OpengraphImage() {
  const displayFont = await loadDisplayFont();
  const titleFont = displayFont ? "Fraunces" : "sans-serif";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "linear-gradient(135deg, #0f766e 0%, #0b5f58 100%)",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -140,
          right: -120,
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -180,
          left: -100,
          width: 360,
          height: 360,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
          display: "flex",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <img src={LOGO_SRC} width={96} height={96} alt="" />
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "rgba(226,241,239,0.85)",
            fontWeight: 600,
          }}
        >
          board game list
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            display: "flex",
            fontFamily: titleFont,
            fontSize: 108,
            fontWeight: 700,
            lineHeight: 1.05,
            color: "#ffffff",
            letterSpacing: -2,
          }}
        >
          {config.site_title}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 38,
            color: "#e2f1ef",
            maxWidth: 900,
            lineHeight: 1.3,
          }}
        >
          {config.site_description}
        </div>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        {PILLS.map((label) => (
          <div
            key={label}
            style={{
              display: "flex",
              padding: "12px 26px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#ffffff",
              fontSize: 28,
              fontWeight: 600,
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>,
    {
      ...size,
      fonts: displayFont
        ? [
            {
              name: "Fraunces",
              data: displayFont,
              weight: 700,
              style: "normal",
            },
          ]
        : [],
    },
  );
}
