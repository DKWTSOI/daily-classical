import Anthropic from "@anthropic-ai/sdk";
import { cache } from "react";
import { promises as fs } from "fs";
import PieceDisplay from "./PieceDisplay";

export const revalidate = 3600;

interface DailyPiece {
  piece_name: string;
  composer: string;
  year: string | number;
  form: string;
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

const getDailyPiece = cache(async (): Promise<DailyPiece> => {
  const today = new Date().toISOString().split("T")[0];
  const cacheFile = `/tmp/piece-${today}.json`;

  // Return cached response if it exists
  try {
    const cached = await fs.readFile(cacheFile, "utf-8");
    return JSON.parse(cached);
  } catch {
    // Cache miss — call Claude
  }

  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
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
- piece_name: name of the piece (always in original language)
- composer: composer's full name (always in original language)
- year: year of composition (number)
- form: the musical form or genre in 1-3 words, e.g. "Piano sonata", "String quartet", "Nocturne", "Symphony", "Tone poem"
- context: 2-3 sentences, warm and curious tone, not academic. Always open with one intriguing hook sentence that makes someone want to press play.
- what_to_listen_for: one specific detail to actively notice while listening — focus on structural, emotional, or compositional elements: how a theme develops or transforms, a mood shift, a moment of tension or release, a surprising harmonic turn, or the emotional arc of a passage. Do NOT name specific instruments unless that instrument is absolutely central and unmistakable in the piece. One sentence, concrete and vivid.
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
  const piece = JSON.parse(cleaned);

  // Save to daily cache
  await fs.writeFile(cacheFile, JSON.stringify(piece), "utf-8");

  // Append to archive
  const archiveFile = "/tmp/archive.json";
  let archive: Array<{ date: string } & DailyPiece> = [];
  try {
    archive = JSON.parse(await fs.readFile(archiveFile, "utf-8"));
  } catch { /* starts empty */ }
  if (!archive.find((e) => e.date === today)) {
    archive.unshift({ date: today, ...piece });
    await fs.writeFile(archiveFile, JSON.stringify(archive), "utf-8");
  }

  return piece;
});

interface YouTubeResult {
  videoId: string;
  title: string;
}

async function searchYouTube(query: string): Promise<YouTubeResult | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;
  const params = new URLSearchParams({
    part: "id,snippet",
    type: "video",
    maxResults: "1",
    videoCategoryId: "10",
    videoEmbeddable: "true",
    order: "relevance",
    q: query,
    key: apiKey,
  });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) return null;
  return {
    videoId: item.id.videoId,
    title: item.snippet.title,
  };
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
      <main className="min-h-screen flex items-center justify-center px-6">
        <p className="text-sm font-mono max-w-md break-all" style={{ color: "#b5a48a" }}>
          Error: {error ?? "unknown"}
        </p>
      </main>
    );
  }

  const dateKey = new Date().toISOString().split("T")[0];
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const yt = await searchYouTube(`${piece.piece_name} ${piece.composer} classical music full performance`);
  const era = getEra(piece.year);

  return (
    <main>
      <PieceDisplay
        initial={piece}
        videoId={yt?.videoId ?? null}
        videoTitle={yt?.title ?? null}
        today={today}
        dateKey={dateKey}
        era={era}
      />
    </main>
  );
}
