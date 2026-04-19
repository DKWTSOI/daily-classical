import Anthropic from "@anthropic-ai/sdk";

export const revalidate = 3600;

interface DailyPiece {
  piece_name: string;
  composer: string;
  year: string | number;
  youtube_video_id: string;
  context: string;
}

async function getDailyPiece(): Promise<DailyPiece> {
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
- youtube_video_id: a real YouTube video ID (11 characters) for a well-known recording of this piece — pick a famous, widely-viewed upload you are confident exists
- context: 2-3 sentences, warm and curious tone, not academic — write like you are recommending it to a friend

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
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/,"").trim();
  return JSON.parse(cleaned);
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

  const embedUrl = `https://www.youtube.com/embed/${piece.youtube_video_id}`;

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

        <div className="space-y-2">
          <div className="aspect-video w-full rounded-lg overflow-hidden shadow">
            <iframe
              className="w-full h-full"
              src={embedUrl}
              title={`${piece.piece_name} — ${piece.composer}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="text-xs text-stone-400 text-right">
            Video unavailable?{" "}
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${piece.piece_name} ${piece.composer}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-stone-600"
            >
              Search on YouTube →
            </a>
          </p>
        </div>

        <p className="leading-relaxed text-stone-700">{piece.context}</p>
      </article>
    </main>
  );
}
