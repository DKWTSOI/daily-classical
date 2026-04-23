import { promises as fs } from "fs";
import ArchiveClient from "./ArchiveClient";

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
  difficulty: string;
}

async function getArchive(): Promise<ArchiveEntry[]> {
  try {
    const data = await fs.readFile("/tmp/archive.json", "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export default async function ArchivePage() {
  const entries = await getArchive();
  return <ArchiveClient entries={entries} />;
}
