import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const piece_name = searchParams.get("piece_name") ?? "";
  const composer = searchParams.get("composer") ?? "";
  const year = searchParams.get("year") ?? "";

  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: `You are a classical music guide. You will be given a specific classical piece and must write about it in Traditional Chinese (繁體中文) as used in formal written Hong Kong Chinese — 書面語, NOT Cantonese vernacular (廣東話). Use formal written Chinese throughout.

Return a JSON object with exactly these fields:
- context: 2-3 sentences, warm and curious tone, not academic. Always open with one intriguing hook sentence that makes someone want to press play. Write in 書面語 Traditional Chinese.
- what_to_listen_for: one specific musical detail to actively notice while listening — a motif, instrument, structural moment, or feeling shift. One sentence, concrete and vivid. Write in 書面語 Traditional Chinese.
- recommended_recording: one specific performer, conductor, or ensemble whose interpretation is considered definitive or particularly interesting, with one sentence on why. Write in 書面語 Traditional Chinese.

Return only valid JSON, no markdown.`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `The piece is: ${piece_name} by ${composer} (${year}).`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  return NextResponse.json(JSON.parse(cleaned));
}
