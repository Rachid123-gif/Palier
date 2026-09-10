import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log(`[DEBUG-LOG] [${body.source}]`, JSON.stringify(body.logs));
  } catch {
    console.log("[DEBUG-LOG] failed to parse body");
  }
  return NextResponse.json({ ok: true });
}
