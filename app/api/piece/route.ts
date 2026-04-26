import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const context              = searchParams.get("context") ?? "";
  const what_to_listen_for   = searchParams.get("what_to_listen_for") ?? "";
  const recommended_recording = searchParams.get("recommended_recording") ?? "";

  const today = new Date().toISOString().split("T")[0];
  const cacheFile = `/tmp/piece-${today}-zh.json`;

  // Return cached ZH response if it exists
  try {
    const cached = await fs.readFile(cacheFile, "utf-8");
    return NextResponse.json(JSON.parse(cached));
  } catch {
    // Cache miss — translate
  }

  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: `You are a translator. Translate the following classical music text fields from English into Traditional Chinese (繁體中文).

Rules — non-negotiable:
- Every character must be Traditional Chinese. NEVER use Simplified Chinese (简体字).
- Write in formal 書面語 as used in Hong Kong — NOT Cantonese vernacular (廣東話).
- Translate faithfully — do not add, remove, or rewrite content. The Chinese must reflect exactly what the English says.
- Preserve hedging language: if the English says "reportedly" or "many listeners hear", keep that nuance in Chinese.
- Return only valid JSON with these exact fields: context, what_to_listen_for, recommended_recording. No markdown.`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Translate these three fields into Traditional Chinese:\n\ncontext: ${context}\n\nwhat_to_listen_for: ${what_to_listen_for}\n\nrecommended_recording: ${recommended_recording}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const result = JSON.parse(cleaned);

  await fs.writeFile(cacheFile, JSON.stringify(result), "utf-8");
  return NextResponse.json(result);
}
