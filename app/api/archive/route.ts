import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("daily_pieces")
    .select("date, data")
    .eq("language", "en")
    .order("date", { ascending: false });

  if (error) return NextResponse.json([]);
  return NextResponse.json(
    (data ?? []).map((row) => ({ date: row.date, ...row.data }))
  );
}
