import ArchiveClient from "./ArchiveClient";
import { supabase } from "@/lib/supabase";

export const revalidate = 3600;

export const metadata = {
  title: "Archive — Attuned.today",
};

interface ArchiveEntry {
  date: string;
  piece_name: string;
  composer: string;
  year: string | number;
  form: string;
}

async function getArchive(): Promise<ArchiveEntry[]> {
  const { data, error } = await supabase
    .from("daily_pieces")
    .select("date, data")
    .eq("language", "en")
    .order("date", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => ({ date: row.date, ...row.data }));
}

export default async function ArchivePage() {
  const entries = await getArchive();
  return <ArchiveClient entries={entries} />;
}
