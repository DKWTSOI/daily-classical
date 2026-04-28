import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { context, what_to_listen_for, recommended_recording } = await req.json();

  const today = new Date().toISOString().split("T")[0];

  // Check Supabase cache
  const { data: cached } = await supabase
    .from("daily_pieces")
    .select("data")
    .eq("date", today)
    .eq("language", "zh")
    .single();
  if (cached) return NextResponse.json(cached.data);

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

  await supabase.from("daily_pieces").insert({ date: today, language: "zh", data: result });
  return NextResponse.json(result);
}
