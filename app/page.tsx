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

interface YouTubeResult {
  videoId: string;
  title: string;
}

interface DailyData {
  piece: DailyPiece;
  yt: YouTubeResult | null;
}

function getEra(claudeEra: string | undefined, year: string | number): string {
  if (claudeEra) return claudeEra;
  const y = Number(year);
  if (y < 1600) return "Renaissance";
  if (y < 1750) return "Baroque";
  if (y < 1820) return "Classical";
  if (y < 1900) return "Romantic";
  if (y < 1945) return "Late Romantic · Modern";
  return "Contemporary";
}

// ── Claude generation ──────────────────────────────────────────────────────
async function getRecentPieces(): Promise<string> {
  const { data } = await supabase
    .from("daily_pieces")
    .select("data")
    .eq("language", "en")
    .order("date", { ascending: false })
    .limit(7);
  if (!data || data.length === 0) return "";
  return data
    .map((r) => `- ${r.data.piece_name} by ${r.data.composer}`)
    .join("\n");
}

async function generatePieceFromClaude(today: string): Promise<DailyPiece> {
  const recentPieces = await getRecentPieces();
  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1536,
    system: [
      {
        type: "text",
        text: `You are a classical music guide. Each day, suggest one classical piece worth discovering.

Strict rules:
- Never suggest overplayed classics: no Beethoven's 5th Symphony or Moonlight Sonata, no Pachelbel's Canon in D, no Vivaldi's Four Seasons, no Beethoven's Für Elise, no Debussy's Clair de Lune.
- Prioritise lesser-known, surprising pieces a curious listener wouldn't have heard.
- Vary the form strictly. The rotation must cycle through: piano solo, solo violin, solo cello, flute sonata, French horn, oboe concerto, string quartet, piano trio, song cycle, opera aria, choral work, piano concerto, violin concerto, cello concerto, chamber music — and only occasionally a symphony or orchestral work. Never suggest a symphony more than once every 7 days. Today's date is the seed — use it to pick a form that has not appeared recently.
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
- piece_name: name of the piece in English. If the piece has a widely recognised English title, use that. If it is universally known by its original-language title (e.g. "Das Lied von der Erde", "La Mer"), keep the original. Otherwise translate or transliterate to English.
- composer: composer's full name (always in original language)
- year: year of composition (number)
- era: one of exactly: "Renaissance", "Baroque", "Classical", "Romantic", "Late Romantic · Modern", "Neoclassical", "Contemporary"
- form: the musical form or genre in 1-3 words, e.g. "Piano sonata", "String quartet", "Nocturne", "Symphony", "Tone poem"
- context: 2-3 sentences. Warm and literary tone, not academic, not a Wikipedia summary. Open with one intriguing hook sentence that makes someone want to press play. Honesty rules: (1) Never present invented or paraphrased quotes as direct quotes — use "reportedly" or "it is said that". (2) Distinguish fact from interpretation — write "many listeners hear this as..." not "the composer intended...". Do NOT use em-dashes (—) anywhere in this field. Do not reference music-theory notation or note-name codes (like "D–S–C–H") without immediately explaining what they mean in plain language accessible to a non-musician.
- what_to_listen_for: 2-3 sentences. Go deeper than a single observation. Tailor the guidance to the form: for a concerto or symphony, describe a specific solo or orchestral moment and what makes it striking — the texture, the emotional shift, how a theme is passed between parts. For a solo piece, describe the atmosphere and intention the performer is creating, how the mood evolves, or what the silences or dynamics are doing. Be concrete and sensory. Do not use em-dashes (—). Do not name a specific instrument unless it is unmistakably prominent at that exact moment.
- Before returning, verify internal consistency: the piece_name, composer, year, era, and all text in context and what_to_listen_for must refer to exactly the same work. If you mention a symphony number, opus number, or catalogue number anywhere in the text, it must match piece_name exactly. Double-check this before outputting.
- recommended_recording: recommend only internationally recognised performers whose association with this specific piece is well documented — e.g. Glenn Gould, Martha Argerich, Claudio Abbado, Carlos Kleiber, Herbert von Karajan, Yuja Wang, Daniel Barenboim, Wilhelm Furtwängler, Murray Perahia. Never invent a specific recording label, catalogue number, or year. If unsure about a specific recording, describe the performer's general interpretive approach instead of citing a specific release. One sentence.

Use today's date as a seed so the same piece shows all day but changes daily. Return only valid JSON, no markdown.`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: `Today's date: ${today}.${recentPieces ? `\n\nDo NOT suggest any of these recently played pieces:\n${recentPieces}` : ""}` }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const piece = JSON.parse(cleaned);
  // Strip em-dashes from all text fields, replace with a comma or colon depending on context
  for (const key of ["context", "what_to_listen_for", "recommended_recording"] as const) {
    if (typeof piece[key] === "string") {
      piece[key] = piece[key].replace(/ — /g, ", ").replace(/—/g, ", ");
    }
  }
  return piece;
}

// ── YouTube search ─────────────────────────────────────────────────────────
async function searchYouTube(query: string): Promise<YouTubeResult | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;
  const params = new URLSearchParams({
    part: "id,snippet",
    type: "video",
    maxResults: "1",
    videoEmbeddable: "true",
    order: "relevance",
    q: query,
    key: apiKey,
  });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) return null;
  return { videoId: item.id.videoId, title: item.snippet.title };
}

// ── Match check ────────────────────────────────────────────────────────────
// A YouTube result is "good" if the video title contains the composer's last name.
// This catches the wrong-symphony problem (Nielsen Sym 1 vs Sym 7).
function isGoodMatch(piece: DailyPiece, videoTitle: string): boolean {
  const vtLower = videoTitle.toLowerCase();
  // Composer last name must appear in video title
  const lastName = piece.composer.trim().split(/\s+/).pop()?.toLowerCase() ?? "";
  return !!lastName && vtLower.includes(lastName);
}

// ── Main data fetch with retry loop ───────────────────────────────────────
const getDailyData = cache(async (): Promise<DailyData> => {
  const today = new Date().toISOString().split("T")[0];

  // Return cached piece if available (already verified on a previous run)
  const { data: cached } = await supabase
    .from("daily_pieces")
    .select("data")
    .eq("date", today)
    .eq("language", "en")
    .single();

  if (cached) {
    const piece = cached.data as DailyPiece;
    const yt = await searchYouTube(`"${piece.piece_name}" ${piece.composer} complete full`);
    return { piece, yt };
  }

  // Retry loop — up to 3 attempts to find a piece with a matching YouTube video
  const MAX_ATTEMPTS = 3;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const piece = await generatePieceFromClaude(today);
    const yt = await searchYouTube(`"${piece.piece_name}" ${piece.composer} complete full`);

    const matched = !yt || isGoodMatch(piece, yt.title);
    if (matched) {
      // Save winner to Supabase and return
      await supabase.from("daily_pieces").insert({ date: today, language: "en", data: piece });
      return { piece, yt };
    }
    // Mismatch — loop and try a different piece
  }

  // Exhausted retries — save whatever Claude last gave us and show without video
  const fallback = await generatePieceFromClaude(today);
  await supabase.from("daily_pieces").upsert(
    { date: today, language: "en", data: fallback },
    { onConflict: "date,language" }
  );
  return { piece: fallback, yt: null };
});

// ── Metadata ───────────────────────────────────────────────────────────────
export async function generateMetadata() {
  try {
    const { piece } = await getDailyData();
    return { title: `${piece.piece_name} — ${piece.composer} · Attuned.today` };
  } catch {
    return {};
  }
}

// ── Page ───────────────────────────────────────────────────────────────────
export default async function Home() {
  let data: DailyData | null = null;
  let error: string | null = null;

  try {
    data = await getDailyData();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  if (error || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <p className="text-sm font-mono max-w-md break-all" style={{ color: "#b5a48a" }}>
          Error: {error ?? "unknown"}
        </p>
      </main>
    );
  }

  const { piece, yt } = data;
  const dateKey = new Date().toISOString().split("T")[0];
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
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
