"use client";

import Link from "next/link";

interface ArchiveEntry {
  date: string;
  piece_name: string;
  composer: string;
  year: string | number;
  form: string;
}

const PAPER  = "oklch(0.97 0.012 80)";
const INK    = "oklch(0.22 0.012 70)";
const INK_M  = "oklch(0.62 0.01 70)";
const INK_S  = "oklch(0.42 0.012 70)";
const RULE   = "oklch(0.86 0.012 80)";
const ACCENT = "oklch(0.55 0.14 45)";

const tight = { fontFamily: "var(--font-inter-tight)" } as React.CSSProperties;
const mono  = { fontFamily: "var(--font-mono)" } as React.CSSProperties;
const sans  = { fontFamily: "var(--font-inter)" } as React.CSSProperties;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ArchiveClient({ entries }: { entries: ArchiveEntry[] }) {
  return (
    <div style={{ background: PAPER, color: INK, minHeight: "100vh", ...sans }}>

      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", borderBottom: `1px solid ${RULE}` }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: INK }}>
          <span style={{ fontSize: 22, color: ACCENT }}>◐</span>
          <span style={{ ...tight, fontWeight: 600, fontSize: 17, letterSpacing: "-0.01em" }}>
            attuned<span style={{ color: ACCENT }}>.</span>today
          </span>
        </Link>
        <Link href="/" style={{ ...mono, fontSize: 11, letterSpacing: "0.06em", color: INK_M, textDecoration: "none" }}>
          ← Today
        </Link>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* Title */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ ...mono, fontSize: 11, letterSpacing: "0.2em", color: INK_M, textTransform: "uppercase", marginBottom: 10 }}>
            Archive
          </div>
          <h1 style={{ ...tight, fontSize: 36, fontWeight: 500, letterSpacing: "-0.03em", margin: 0 }}>
            Every piece, in order.
          </h1>
        </div>

        {/* Count */}
        <div style={{ ...mono, fontSize: 11, color: INK_M, letterSpacing: "0.1em", marginBottom: 20 }}>
          {entries.length} {entries.length === 1 ? "piece" : "pieces"}
        </div>

        {/* List */}
        {entries.length === 0 ? (
          <p style={{ color: INK_M, fontSize: 14 }}>No pieces yet — check back tomorrow.</p>
        ) : (
          <ul style={{ margin: 0, padding: 0 }}>
            {entries.map((e) => (
              <li key={e.date} style={{
                display: "grid",
                gridTemplateColumns: "90px 1fr auto",
                gap: 20,
                alignItems: "center",
                padding: "14px 0",
                borderBottom: `1px solid ${RULE}`,
              }}>
                <span style={{ ...mono, fontSize: 11, letterSpacing: "0.08em", color: INK_M, whiteSpace: "nowrap" }}>
                  {formatDate(e.date)}
                </span>
                <span style={{ ...tight, fontSize: 16, fontWeight: 500, letterSpacing: "-0.015em", color: INK }}>
                  {e.piece_name}
                </span>
                {e.form && (
                  <span style={{ ...mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", padding: "3px 8px", border: `1px solid ${RULE}`, borderRadius: 999, color: INK_S, whiteSpace: "nowrap" }}>
                    {e.form}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

      </main>

      <footer style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px 48px", borderTop: `1px solid ${RULE}`, display: "flex", justifyContent: "space-between", fontSize: 12, color: INK_M }}>
        <span>One piece, every day.</span>
        <span style={mono}>attuned.today</span>
      </footer>

    </div>
  );
}
