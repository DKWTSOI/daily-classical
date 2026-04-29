"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import YoutubeEmbed from "./YoutubeEmbed";

interface Piece {
  piece_name: string;
  composer: string;
  year: string | number;
  form?: string;
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

// Design tokens
const PAPER   = "oklch(0.97 0.012 80)";
const INK     = "oklch(0.22 0.012 70)";
const INK_S   = "oklch(0.42 0.012 70)";
const INK_M   = "oklch(0.62 0.01 70)";
const RULE    = "oklch(0.86 0.012 80)";
const ACCENT  = "oklch(0.55 0.14 45)";

const tight = { fontFamily: "var(--font-inter-tight)" } as React.CSSProperties;
const mono  = { fontFamily: "var(--font-mono)" } as React.CSSProperties;
const sans  = { fontFamily: "var(--font-inter)" } as React.CSSProperties;


export default function PieceDisplay({ initial, videoId, videoTitle, today, dateKey, era }: Props) {
  const [lang, setLang]     = useState<"en" | "zh">("en");
  const [piece, setPiece]   = useState<Piece>(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("attunedLang") as "en" | "zh" | null;
    if (saved === "zh") { setLang("zh"); fetchZh(); }
  }, []);

  async function fetchZh() {
    setLoading(true);
    try {
      const res = await fetch("/api/piece", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: initial.context,
          what_to_listen_for: initial.what_to_listen_for,
          recommended_recording: initial.recommended_recording,
        }),
      });
      if (res.ok) setPiece({ ...initial, ...(await res.json()) });
    } finally { setLoading(false); }
  }

  function toggle() {
    const next = lang === "en" ? "zh" : "en";
    setLang(next);
    localStorage.setItem("attunedLang", next);
    if (next === "zh") { fetchZh(); } else { setPiece(initial); }
  }

  const isZh = lang === "zh";

  return (
    <div style={{ background: PAPER, color: INK, minHeight: "100vh", ...sans }}>

      {/* ── Header ── */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 20px", borderBottom: `1px solid ${RULE}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22, color: ACCENT, lineHeight: 1 }}>◐</span>
          <span style={{ ...tight, fontWeight: 600, fontSize: 17, letterSpacing: "-0.01em" }}>
            attuned<span style={{ color: ACCENT }}>.</span>today
          </span>
        </div>
        <nav style={{ display: "flex", gap: 20, alignItems: "center", fontSize: 13, color: INK_S }}>
          <Link href="/archive" style={{ ...mono, fontSize: 11, letterSpacing: "0.06em", color: INK_M, textDecoration: "none" }}>
            Archive
          </Link>
          <button
            onClick={toggle}
            disabled={loading}
            style={{
              ...mono, fontSize: 11, letterSpacing: "0.06em", color: loading ? INK_M : INK_S,
              background: "none", border: `1px solid ${RULE}`, borderRadius: 999,
              padding: "4px 12px", cursor: loading ? "default" : "pointer",
            }}
          >
            {isZh ? "EN" : "中文"}
          </button>
        </nav>
      </header>

      {/* ── Onboarding strip ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 20px", background: "oklch(0.94 0.014 80)", borderBottom: `1px solid ${RULE}`,
        fontSize: 13, color: INK_S,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT, display: "inline-block", flexShrink: 0 }} />
        {isZh ? "每天一首古典樂。" : "Your daily dose of classical music."}
      </div>

      {/* ── Main ── */}
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px 80px", opacity: loading ? 0.5 : 1, transition: "opacity 0.2s" }}
        className="sm:px-10"
      >

        {/* Meta row */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ ...tight, fontSize: 26, fontWeight: 600, letterSpacing: "-0.03em" }}>
              {today.split(" ")[0]}
            </span>
            <span style={{ ...mono, fontSize: 11, color: INK_M, letterSpacing: "0.12em" }}>
              {today.split(" ").slice(1).join(" ").toUpperCase()}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
            <span style={{ ...mono, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" as const, padding: "4px 10px", border: `1px solid ${RULE}`, borderRadius: 999, color: INK_S }}>
              {era}
            </span>
            {piece.form && (
              <span style={{ ...mono, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" as const, padding: "4px 10px", border: `1px solid ${RULE}`, borderRadius: 999, color: INK_S }}>
                {piece.form}
              </span>
            )}
          </div>
        </div>

        {/* Kicker */}
        <div style={{ ...mono, fontSize: 11, letterSpacing: "0.2em", color: INK_M, marginBottom: 14, textTransform: "uppercase" as const }}>
          {isZh ? "今日之選" : "Today's piece"}
        </div>

        {/* Title */}
        <h1 style={{ ...tight, fontSize: "clamp(42px, 6vw, 68px)", fontWeight: 500, letterSpacing: "-0.035em", lineHeight: 1.02, margin: "0 0 16px" }}>
          {piece.piece_name}
        </h1>

        {/* Composer · year */}
        <div style={{ fontSize: 17, color: INK_S, display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
          <span style={{ color: INK, fontWeight: 500 }}>{piece.composer}</span>
          <span style={{ color: INK_M }}>·</span>
          <span style={{ ...mono, fontSize: 14, color: INK_M }}>{piece.year}</span>
        </div>

        {/* YouTube embed */}
        <div style={{ marginBottom: videoTitle ? 8 : 40 }}>
          <YoutubeEmbed
            videoId={videoId}
            title={`${piece.piece_name} — ${piece.composer}`}
            searchQuery={`${piece.piece_name} ${piece.composer}`}
          />
        </div>
        {videoTitle && (
          <p style={{ ...mono, fontSize: 11, color: INK_M, marginBottom: 40, lineHeight: 1.4 }}>
            {videoTitle}
          </p>
        )}

        {/* Context / lede */}
        <p className="prose-justify" style={{ fontSize: 18, lineHeight: 1.6, color: INK, marginBottom: 48, textAlign: "justify" }}>
          {piece.context}
        </p>

        {/* Rule */}
        <div style={{ height: 1, background: RULE, margin: "0 0 40px" }} />

        {/* What to listen for */}
        <h2 style={{ ...tight, fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", margin: "0 0 16px" }}>
          {isZh ? "賞析重點" : "What to listen for"}
        </h2>
        <p className="prose-justify" style={{ fontSize: 16, lineHeight: 1.7, color: INK, marginBottom: 40, textAlign: "justify" }}>
          {piece.what_to_listen_for}
        </p>

        {/* Rule */}
        <div style={{ height: 1, background: RULE, margin: "0 0 40px" }} />

        {/* Recommended recording */}
        <h2 style={{ ...tight, fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", margin: "0 0 16px" }}>
          {isZh ? "推薦錄音" : "Recommended recording"}
        </h2>
        <p className="prose-justify" style={{ fontSize: 16, lineHeight: 1.7, color: INK, marginBottom: 12, textAlign: "justify" }}>
          {piece.recommended_recording}
        </p>
        <p style={{ ...mono, fontSize: 11, color: INK_M, letterSpacing: "0.02em", marginBottom: 40 }}>
          {isZh ? "以上建議由 AI 生成，購買前請自行核實。" : "Suggestions are AI-generated. Always verify before purchasing."}
        </p>

      </main>

      {/* ── Footer ── */}
      <footer style={{
        maxWidth: 720, margin: "0 auto", padding: "24px 20px 48px",
        borderTop: `1px solid ${RULE}`, display: "flex", justifyContent: "space-between",
        fontSize: 12, color: INK_M,
      }}>
        <span>{isZh ? "每天一首古典樂。" : "One piece, every day."}</span>
        <span style={{ ...mono, letterSpacing: "0.06em" }}>attuned.today · {today}</span>
      </footer>

    </div>
  );
}
