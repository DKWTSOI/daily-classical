import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function getTodaysPiece() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("daily_pieces")
    .select("data")
    .eq("date", today)
    .eq("language", "en")
    .single();
  return data?.data ?? null;
}

export default async function OGImage() {
  const piece = await getTodaysPiece();

  // Load Inter Tight font
  const fontRes = await fetch(
    "https://fonts.gstatic.com/s/intertight/v7/NGSnv5HMAFg6IuGlBNMjxJEL2VmU3NS7Z2mjDw-qXCRToK8APg.woff2"
  );
  const fontData = await fontRes.arrayBuffer();

  const title   = piece?.piece_name ?? "Attuned.today";
  const composer = piece ? `${piece.composer} · ${piece.year}` : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#faf8f3",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 80px",
          fontFamily: "'Inter Tight', sans-serif",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* ◐ mark — drawn as two halves */}
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            border: "3px solid #2A2521",
            display: "flex", overflow: "hidden",
          }}>
            <div style={{ width: "50%", background: "#B85A36" }} />
            <div style={{ width: "50%", background: "transparent" }} />
          </div>
          <span style={{
            fontSize: 28, fontWeight: 700, color: "#2A2521",
            letterSpacing: "-0.5px",
          }}>
            attuned<span style={{ color: "#B85A36" }}>.</span>today
          </span>
        </div>

        {/* Piece info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {composer ? (
            <span style={{
              fontSize: 22, fontWeight: 500, color: "#a89880",
              letterSpacing: "0.04em", textTransform: "uppercase",
            }}>
              {composer}
            </span>
          ) : null}
          <span style={{
            fontSize: title.length > 40 ? 72 : 88,
            fontWeight: 700,
            color: "#2A2521",
            letterSpacing: "-2px",
            lineHeight: 1.0,
          }}>
            {title}
          </span>
        </div>

        {/* Tagline + rule */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ width: 48, height: 2, background: "#d4c9b5" }} />
          <span style={{ fontSize: 22, color: "#a89880", fontWeight: 400 }}>
            One piece of classical music, every day.
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Inter Tight", data: fontData, weight: 700 }],
    }
  );
}
