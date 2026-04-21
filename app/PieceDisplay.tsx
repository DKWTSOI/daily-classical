"use client";

import { useEffect, useState } from "react";
import YoutubeEmbed from "./YoutubeEmbed";

interface Piece {
  piece_name: string;
  composer: string;
  year: string | number;
  context: string;
  what_to_listen_for: string;
  recommended_recording: string;
}

interface Props {
  initial: Piece;
  videoId: string | null;
  videoTitle: string | null;
  today: string;
  dateKey: string;
  era: string;
}

const inter: React.CSSProperties = { fontFamily: "var(--font-inter)" };
const playfair: React.CSSProperties = { fontFamily: "var(--font-playfair)" };

export default function PieceDisplay({ initial, videoId, videoTitle, today, dateKey, era }: Props) {
  const [lang, setLang] = useState<"en" | "zh">("en");
  const [piece, setPiece] = useState<Piece>(initial);
  const [loading, setLoading] = useState(false);

  // On mount, read saved preference
  useEffect(() => {
    const saved = localStorage.getItem("attunedLang") as "en" | "zh" | null;
    if (saved === "zh") {
      setLang("zh");
      fetchZh();
    }
  }, []);

  async function fetchZh() {
    setLoading(true);
    try {
      const res = await fetch(`/api/piece?date=${dateKey}&lang=zh`);
      if (res.ok) setPiece(await res.json());
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    const next = lang === "en" ? "zh" : "en";
    setLang(next);
    localStorage.setItem("attunedLang", next);
    if (next === "zh") {
      fetchZh();
    } else {
      setPiece(initial);
    }
  }

  return (
    <div className="w-full" style={{ maxWidth: 560 }}>

      {/* Top bar */}
      <div className="flex justify-between items-center" style={{ marginBottom: 52 }}>
        <span style={{ ...inter, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#a89880" }}>
          {today}
        </span>
        <div className="flex items-center gap-4">
          <span style={{ ...inter, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#a89880" }}>
            Attuned.today
          </span>
          <button
            onClick={toggle}
            disabled={loading}
            style={{
              ...inter,
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: loading ? "#d4c9b5" : lang === "zh" ? "#2a231a" : "#b5a48a",
              background: "none",
              border: "none",
              cursor: loading ? "default" : "pointer",
              padding: 0,
              transition: "color 0.2s",
            }}
          >
            {lang === "en" ? "中文" : "EN"}
          </button>
        </div>
      </div>

      <article style={{ opacity: loading ? 0.5 : 1, transition: "opacity 0.2s" }}>

        {/* Era */}
        <p style={{ ...inter, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#b5a48a", marginBottom: 10 }}>
          {era}
        </p>

        {/* Title */}
        <h1 style={{ ...playfair, fontSize: 42, fontWeight: 500, lineHeight: 1.2, color: "#2c2418", marginBottom: 10 }}>
          {piece.piece_name}
        </h1>

        {/* Composer / year */}
        <p style={{ ...inter, fontSize: 13, fontWeight: 300, color: "#a89880", letterSpacing: "0.02em", marginBottom: 6 }}>
          {piece.composer} · {piece.year}
        </p>

        {/* Recommended recording — below composer */}
        <p style={{ ...inter, fontSize: 13, fontWeight: 300, color: "#b5a48a", marginBottom: 32 }}>
          {piece.recommended_recording}
        </p>

        {/* Embed */}
        <div style={{ marginBottom: videoTitle ? 8 : 32 }}>
          <YoutubeEmbed
            videoId={videoId}
            title={`${piece.piece_name} — ${piece.composer}`}
            searchQuery={`${piece.piece_name} ${piece.composer}`}
          />
        </div>
        {videoTitle && (
          <p style={{ ...inter, fontSize: 11, fontWeight: 300, color: "#b5a48a", marginBottom: 32, lineHeight: 1.4 }}>
            {videoTitle}
          </p>
        )}

        {/* Context */}
        <p style={{ ...playfair, fontSize: 16, fontStyle: "normal", lineHeight: 1.75, color: "#2a231a", marginBottom: 36 }}>
          {piece.context}
        </p>

        {/* Short divider */}
        <div style={{ width: 32, height: 1, background: "#d4c9b5", marginBottom: 32 }} />

        {/* What to listen for */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ ...inter, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#b5a48a", marginBottom: 8 }}>
            {lang === "zh" ? "聆聽重點" : "What to listen for"}
          </p>
          <p style={{ ...inter, fontSize: 14, fontWeight: 300, lineHeight: 1.7, color: "#4a3f32" }}>
            {piece.what_to_listen_for}
          </p>
        </div>

      </article>

      {/* Footer */}
      <footer style={{ marginTop: 64, paddingBottom: 48 }}>
        <p style={{ ...inter, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#d4c9b5", textAlign: "center" }}>
          {lang === "zh" ? "每天一首古典樂" : "One piece, every day"}
        </p>
      </footer>

    </div>
  );
}
