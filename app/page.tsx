import Anthropic from "@anthropic-ai/sdk";
import { cache } from "react";
import { supabase } from "@/lib/supabase";
import PieceDisplay from "./PieceDisplay";

export const revalidate = 3600;

interface DailyPiece {
  piece_name: string;
  composer: string;
  year: string | number;
  era: string;
  form: string;
  context: string;
  what_to_listen_for: string;
  recommended_recording: string;
}

function getEra(claudeEra: string | undefined, year: string | number): string {
  // Trust Claude's era classification for contemporary/neoclassical
  if (claudeEra) return claudeEra;
  // Fallback by year
  const y = Number(year);
  if (y < 1600) return "Renaissance";
  if (y < 1750) return "Baroque";
  if (y < 1820) return "Classical";
  if (y < 1900) return "Romantic";
  if (y < 1945) return "Late Romantic · Modern";
  return "Contemporary";
}

const getDailyPiece = cache(async (): Promise<DailyPiece> => {
  const today = new Date().toISOString().split("T")[0];

  // Check Supabase cache
  const { data: cached } = await supabase
    .from("daily_pieces")
    .select("data")
    .eq("date", today)
    .eq("language", "en")
    .single();
  if (cached) return cached.data as DailyPiece;

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
- Vary the form broadly across days: piano solo, symphony, string quartet, song cycle, piano concerto, violin concerto, choral work, opera aria, chamber music, solo violin, cello sonata, and more. Do NOT default to piano solo — actively rotate across very different forms and ensembles.
- Occasionally include pieces stylistically related to: Mozart Fantasia K.397, Beethoven Pathétique Op.13, Satie Gymnopédies, Ravel, Debussy Rêverie — same mood or era, but unexpected choices and varied instrumentation.
- Roughly 1 in 5 pieces should be from contemporary or modern composers, including: Arvo Pärt, Philip Glass, John Adams, Max Richter, Ólafur Arnalds, Ludovico Einaudi, György Ligeti, Alfred Schnittke, Sofia Gubaidulina, Nils Frahm. These provide accessible entry points and variety alongside traditional repertoire.

Era classification guide for the 'era' field:
- Renaissance: before 1600
- Baroque: 1600–1750
- Classical: 1750–1820
- Romantic: 1820–1900
- Late Romantic · Modern: 1900–1945
- Neoclassical: composers like Einaudi, Richter, Arnalds, Nils Frahm — tonal, meditative, minimalist-adjacent
- Contemporary: composers like Pärt, Glass, Adams, Ligeti, Schnittke, Gubaidulina — post-1945 art music

Return a JSON object with these exact fields:
- piece_name: name of the piece (always in original language)
- composer: composer's full name (always in original language)
- year: year of composition (number)
- era: one of exactly: "Renaissance", "Baroque", "Classical", "Romantic", "Late Romantic · Modern", "Neoclassical", "Contemporary"
- form: the musical form or genre in 1-3 words, e.g. "Piano sonata", "String quartet", "Nocturne", "Symphony", "Tone poem"
- context: 2-3 sentences, warm and literary tone — not academic, not a Wikipedia summary. Always open with one intriguing hook sentence that makes someone want to press play. Follow these honesty rules strictly: (1) Never present invented or paraphrased quotes as direct quotes — if referencing what a composer said, write "reportedly" or "it is said that" rather than presenting it as verified. (2) Distinguish clearly between documented fact and critical interpretation — write "many listeners hear this as..." rather than "Brahms wrote this as...". Keep the literary quality — just be honest about what is fact versus feeling.
- what_to_listen_for: one specific detail a listener can verify with their own ears — structural or emotional only: how a theme develops or transforms, a mood shift, a moment of tension or release, a surprising harmonic turn, or the arc of a passage. Never name a specific instrument unless you are certain it is prominent and unmistakable at that moment. One sentence, concrete and vivid.
- recommended_recording: recommend only internationally recognised performers whose association with this specific piece is well documented — e.g. Glenn Gould, Martha Argerich, Claudio Abbado, Carlos Kleiber, Herbert von Karajan, Yuja Wang, Daniel Barenboim, Wilhelm Furtwängler, Murray Perahia. Never invent a specific recording label, catalogue number, or year. If unsure about a specific recording, describe the performer's general interpretive approach instead of citing a specific release. One sentence.

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

  // Save to Supabase
  await supabase.from("daily_pieces").insert({ date: today, language: "en", data: piece });

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
  const era = getEra(piece.era, piece.year);

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
