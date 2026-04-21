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
        text: `You are a classical music guide. You will be given a specific classical piece and must write about it EXCLUSIVELY in Traditional Chinese (繁體中文). This is non-negotiable: every single character must be Traditional Chinese. NEVER use Simplified Chinese (简体字) under any circumstances. Write in formal 書面語 as used in Hong Kong — NOT Cantonese vernacular (廣東話), NOT Mainland Chinese Simplified script. If you are unsure whether a character is Traditional or Simplified, use the Traditional form. Examples of correct script: 樂、聽、這、時、來、個、為、說、國、愛.

Return a JSON object with exactly these fields:
- context: 2-3 sentences, warm and curious tone, not academic. Always open with one intriguing hook sentence that makes someone want to press play. Write in 書面語 Traditional Chinese.
- what_to_listen_for: one specific detail to actively notice while listening — focus on structural, emotional, or compositional elements: how a theme develops or transforms, a mood shift, a moment of tension or release, a surprising harmonic turn, or the emotional arc of a passage. Do NOT name specific instruments unless that instrument is absolutely central and unmistakable in the piece. One sentence, concrete and vivid. Write in 書面語 Traditional Chinese.
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
