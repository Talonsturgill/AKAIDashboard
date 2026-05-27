"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";

type Result = {
  id: string;
  type: string;
  title: string;
  snippet: string;
  url_path: string;
  score: number;
};

export function UniversalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: trimmed }),
        });
        if (res.ok) {
          const data = (await res.json()) as { results: Result[] };
          setResults(data.results ?? []);
        }
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-1.5 focus-within:border-[var(--color-border-strong)]">
        <Search className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search archive, entities, contracts…"
          className="w-full bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none"
        />
      </div>
      {open && query.trim().length >= 2 && (
        <div className="absolute right-0 mt-2 w-[420px] max-w-[90vw] rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] shadow-2xl">
          {loading && (
            <div className="p-3 text-xs text-[var(--color-text-tertiary)]">
              Searching…
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="p-3 text-xs text-[var(--color-text-tertiary)]">
              No results yet. Once the data routines run, results will appear
              here.
            </div>
          )}
          {!loading && results.length > 0 && (
            <ul className="max-h-96 overflow-y-auto py-1">
              {results.map((r) => (
                <li key={`${r.type}-${r.id}`}>
                  <Link
                    href={r.url_path}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 hover:bg-[var(--color-surface)]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-aurora-cyan)]">
                        {r.type}
                      </span>
                      <span className="truncate text-sm text-[var(--color-text-primary)]">
                        {r.title}
                      </span>
                    </div>
                    {r.snippet && (
                      <p className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]">
                        {r.snippet}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
