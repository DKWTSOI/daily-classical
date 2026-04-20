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

const getDailyPiece = cache(async (): Promise<DailyPiece> => {
  const today = new Date().toISOString().split("T")[0];
  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: `You are a classical music guide. Each day, suggest one classical piece worth discovering. Return a JSON object with these exact fields:
- piece_name: name of the piece
- composer: composer's full name
- year: year of composition (number)
- context: 2-3 sentences, warm and curious tone, not academic — write like you are recommending it to a friend
- what_to_listen_for: one specific musical detail to actively notice while listening — a motif, instrument, structural moment, or feeling shift. One sentence, concrete and vivid.
- recommended_recording: one specific performer, conductor, or ensemble whose interpretation is considered definitive or particularly interesting, with one sentence on why

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
      <main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
        <p className="text-stone-400 text-sm font-mono max-w-md break-all">
          Error: {error ?? "unknown"}
        </p>
      </main>
    );
  }

  const videoId = await searchYouTube(`${piece.piece_name} ${piece.composer}`);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 flex flex-col items-center justify-start px-6 py-16">
      <article className="max-w-xl w-full space-y-8">
        <header className="space-y-1">
          <p className="text-sm tracking-widest uppercase text-stone-400">
            {piece.composer} · {piece.year}
          </p>
          <h1 className="text-4xl font-serif font-semibold">
            {piece.piece_name}
          </h1>
        </header>

        <YoutubeEmbed
          videoId={videoId}
          title={`${piece.piece_name} — ${piece.composer}`}
          searchQuery={`${piece.piece_name} ${piece.composer}`}
        />

        <p className="leading-relaxed text-stone-700">{piece.context}</p>

        <div className="space-y-4 border-t border-stone-200 pt-6">
          <div className="space-y-1">
            <p className="text-xs tracking-widest uppercase text-stone-400">What to listen for</p>
            <p className="leading-relaxed text-stone-700">{piece.what_to_listen_for}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs tracking-widest uppercase text-stone-400">Recommended recording</p>
            <p className="leading-relaxed text-stone-700">{piece.recommended_recording}</p>
          </div>
        </div>
      </article>
    </main>
  );
}
