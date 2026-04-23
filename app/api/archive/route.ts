import { promises as fs } from "fs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await fs.readFile("/tmp/archive.json", "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json([]);
  }
}
