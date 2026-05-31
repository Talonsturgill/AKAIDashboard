import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  let body: { q?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const q = (body.q ?? "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("universal_search", {
    query_text: q,
    match_count: 20,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  if (error) {
    return NextResponse.json(
      { error: "search_failed", detail: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json({ results: data ?? [] });
}
