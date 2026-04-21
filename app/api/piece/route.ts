import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];
  const lang = searchParams.get("lang") ?? "en";

  const isZh = lang === "zh";

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
- piece_name: name of the piece (always in original language)
- composer: composer's full name (always in original language)
- year: year of composition (number)
- context: 2-3 sentences, warm and curious tone, not academic. Always open with one intriguing hook sentence that makes someone want to press play.${isZh ? " Write in Traditional Chinese (繁體中文) as used in formal written Hong Kong Chinese — 書面語, NOT Cantonese vernacular (廣東話). Use formal written Chinese throughout." : ""}
- what_to_listen_for: one specific musical detail to actively notice while listening — a motif, instrument, structural moment, or feeling shift. One sentence, concrete and vivid.${isZh ? " Write in Traditional Chinese (繁體中文), 書面語 only." : ""}
- recommended_recording: one specific performer, conductor, or ensemble whose interpretation is considered definitive or particularly interesting, with one sentence on why.${isZh ? " Write in Traditional Chinese (繁體中文), 書面語 only." : ""}

Use today's date as a seed so the same piece shows all day but changes daily. Return only valid JSON, no markdown.`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Today's date: ${date}.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  return NextResponse.json(JSON.parse(cleaned));
}
