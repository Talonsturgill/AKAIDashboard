import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// universal_search() requires a vector(1536) embedding argument. Until an
// embedding service is wired in (Phase 3), pass a zero-vector so the SQL
// function evaluates the text-rank branch and returns lexical matches.
const ZERO_EMBEDDING = `[${Array(1536).fill(0).join(",")}]`;

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
    query_embedding: ZERO_EMBEDDING,
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
