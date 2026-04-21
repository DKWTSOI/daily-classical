import Anthropic from "@anthropic-ai/sdk";
import { cache } from "react";
import YoutubeEmbed from "./YoutubeEmbed";

export const revalidate = 3600;

interface DailyPiece {
  piece_name: string;
  composer: string;
  year: string | number;
  context: string;
  what_to_listen_for: string;
  recommended_recording: string;
}

function getEra(year: string | number): string {
  const y = Number(year);
  if (y < 1600) return "Renaissance";
  if (y < 1750) return "Baroque";
  if (y < 1820) return "Classical";
  if (y < 1900) return "Romantic";
  if (y < 1945) return "Late Romantic · Modern";
  return "20th Century";
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const getDailyPiece = cache(async (): Promise<DailyPiece> => {
  const today = new Date().toISOString().split("T")[0];
  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: `You are a classical music guide. Each day, suggest one classical piece worth discovering.

Strict rules:
- Never suggest overplayed classics: no Beethoven's 5th Symphony or Moonlight Sonata, no Pachelbel's Canon in D, no Vivaldi's Four Seasons, no Beethoven's Für Elise, no Debussy's Clair de Lune.
- Prioritise lesser-known, surprising pieces a curious listener wouldn't have heard.
- Occasionally include pieces stylistically related to: Mozart Fantasia K.397, Beethoven Pathétique Op.13, Satie Gymnopédies, Ravel, Debussy Rêverie — same mood or era, but unexpected choices.

Return a JSON object with these exact fields:
- piece_name: name of the piece
- composer: composer's full name
- year: year of composition (number)
- context: 2-3 sentences, warm and curious tone, not academic. Always open with one intriguing hook sentence that makes someone want to press play — before explaining anything else.
- what_to_listen_for: one specific musical detail to actively notice while listening — a motif, instrument, structural moment, or feeling shift. One sentence, concrete and vivid.
- recommended_recording: one specific performer, conductor, or ensemble whose interpretation is considered definitive or particularly interesting, with one sentence on why.

Use today's date as a seed so the same piece shows all day but changes daily. Return only valid JSON, no markdown.`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Today's date: ${today}.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(cleaned);
});

async function searchYouTube(query: string): Promise<string | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  const url = `https://www.googleapis.com/youtube/v3/search?part=id&type=video&maxResults=1&q=${encodeURIComponent(query)}&key=${apiKey}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;

  const data = await res.json();
  return data.items?.[0]?.id?.videoId ?? null;
}

export async function generateMetadata() {
  try {
    const piece = await getDailyPiece();
    return {
      title: `${piece.piece_name} — ${piece.composer}`,
      description: piece.context,
    };
  } catch {
    return {
      title: "Attuned.today",
      description: "A classical piece worth discovering, every day.",
    };
  }
}

export default async function Home() {
  let piece: DailyPiece | null = null;
  let error: string | null = null;

  try {
    piece = await getDailyPiece();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  if (error || !piece) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "#0d0d14" }}>
        <p className="text-sm font-mono max-w-md break-all" style={{ color: "#6b6b7a" }}>
          Error: {error ?? "unknown"}
        </p>
      </main>
    );
  }

  const videoId = await searchYouTube(`${piece.piece_name} ${piece.composer}`);
  const era = getEra(piece.year);
  const today = formatDate(new Date());

  return (
    <main
      className="min-h-screen flex flex-col items-center px-6 py-12"
      style={{ background: "#0d0d14", color: "#f0ead8" }}
    >
      <div className="w-full max-w-[680px]">

        {/* Top bar */}
        <div className="flex justify-between items-center mb-16">
          <span
            className="text-xs tracking-[0.2em] uppercase"
            style={{ color: "#6b6b7a", fontFamily: "var(--font-inter)" }}
          >
            {today}
          </span>
          <span
            className="text-xs tracking-[0.2em] uppercase"
            style={{ color: "#6b6b7a", fontFamily: "var(--font-inter)" }}
          >
            Attuned.today
          </span>
        </div>

        <article className="space-y-10">

          {/* Header */}
          <header className="space-y-3">
            <p
              className="text-xs tracking-[0.25em] uppercase"
              style={{ color: "#8b7355", fontFamily: "var(--font-inter)" }}
            >
              {era}
            </p>
            <h1
              className="text-5xl leading-tight font-normal"
              style={{ fontFamily: "var(--font-garamond)", color: "#f0ead8" }}
            >
              {piece.piece_name}
            </h1>
            <p
              className="text-base tracking-wide"
              style={{ color: "#a89880", fontFamily: "var(--font-inter)" }}
            >
              {piece.composer} · {piece.year}
            </p>
          </header>

          {/* Embed */}
          <YoutubeEmbed
            videoId={videoId}
            title={`${piece.piece_name} — ${piece.composer}`}
            searchQuery={`${piece.piece_name} ${piece.composer}`}
          />

          {/* Context */}
          <p
            className="text-xl leading-relaxed"
            style={{ fontFamily: "var(--font-garamond)", color: "#ddd5c0" }}
          >
            {piece.context}
          </p>

          {/* Divider sections */}
          <div
            className="space-y-8 pt-8"
            style={{ borderTop: "1px solid #2a2a3a" }}
          >
            <div className="space-y-2">
              <p
                className="text-xs tracking-[0.25em] uppercase"
                style={{ color: "#8b7355", fontFamily: "var(--font-inter)" }}
              >
                What to listen for
              </p>
              <p
                className="text-lg leading-relaxed"
                style={{ fontFamily: "var(--font-garamond)", color: "#ddd5c0" }}
              >
                {piece.what_to_listen_for}
              </p>
            </div>

            <div className="space-y-2">
              <p
                className="text-xs tracking-[0.25em] uppercase"
                style={{ color: "#8b7355", fontFamily: "var(--font-inter)" }}
              >
                Recommended recording
              </p>
              <p
                className="text-lg leading-relaxed"
                style={{ fontFamily: "var(--font-garamond)", color: "#ddd5c0" }}
              >
                {piece.recommended_recording}
              </p>
            </div>
          </div>

        </article>

        {/* Footer */}
        <footer className="mt-20 pb-8">
          <p
            className="text-xs tracking-[0.2em] uppercase text-center"
            style={{ color: "#3a3a4a", fontFamily: "var(--font-inter)" }}
          >
            One piece, every day
          </p>
        </footer>

      </div>
    </main>
  );
}
