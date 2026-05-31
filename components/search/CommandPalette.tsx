"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Building2, FileText, ScrollText } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type SearchResult = {
  id: string;
  type: string;
  title: string;
  snippet: string;
  url_path: string;
  score: number;
};

type GroupedResults = Record<string, SearchResult[]>;

const GROUP_META: Record<string, { label: string; Icon: React.ElementType }> = {
  archive: { label: "Archive", Icon: BookOpen },
  entity: { label: "Entities", Icon: Building2 },
  contract: { label: "Contracts", Icon: FileText },
  policy: { label: "Policies", Icon: ScrollText },
};

function groupByType(results: SearchResult[]): GroupedResults {
  const groups: GroupedResults = {};
  for (const r of results) {
    const key = r.type.toLowerCase();
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  }
  return groups;
}

function ResultShimmer() {
  return (
    <div className="px-3 py-2 space-y-3">
      {[1, 2, 3].map((n) => (
        <div key={n} className="flex items-center gap-3 animate-pulse">
          <div className="h-3 w-12 rounded bg-[var(--color-border-strong)] opacity-40" />
          <div className="h-3 flex-1 rounded bg-[var(--color-border-strong)] opacity-25" />
        </div>
      ))}
    </div>
  );
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) { setResults([]); return; }
    const controller = new AbortController();
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: trimmed }),
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data.results ?? []);
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          // non-abort errors are swallowed; add logging here if needed
        }
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => { clearTimeout(handle); controller.abort(); };
  }, [query]);

  function handleSelect(urlPath: string) {
    onOpenChange(false);
    router.push(urlPath);
  }

  const grouped = groupByType(results);
  const groupKeys = Object.keys(grouped);
  const hasResults = groupKeys.length > 0;
  const showEmpty = query.trim().length >= 2 && !loading && !hasResults;

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search archive, entities, contracts, and policies"
      showCloseButton={false}
      className="bg-[var(--color-surface-elevated)] border-[var(--color-border-strong)]"
    >
      <CommandInput
        placeholder="Search archive, entities, contracts, policies..."
        value={query}
        onValueChange={setQuery}
        className="text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
      />
      <CommandList className="max-h-[400px]">
        {loading && <ResultShimmer />}

        {showEmpty && (
          <CommandEmpty className="text-[var(--color-text-tertiary)]">
            No matches
          </CommandEmpty>
        )}

        {!loading &&
          groupKeys.map((key) => {
            const meta = GROUP_META[key] ?? {
              label: key.charAt(0).toUpperCase() + key.slice(1),
              Icon: FileText,
            };
            const { label, Icon } = meta;

            return (
              <CommandGroup key={key} heading={label}>
                {grouped[key].map((r) => (
                  <CommandItem
                    key={`${r.type}-${r.id}`}
                    value={`${r.type}-${r.id}-${r.title}`}
                    onSelect={() => handleSelect(r.url_path)}
                    className="cursor-pointer data-[selected=true]:bg-[var(--color-surface)] data-[selected=true]:text-[var(--color-text-primary)]"
                  >
                    <Icon className="shrink-0 text-[var(--color-aurora-cyan)]" />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-aurora-cyan)]">
                          {r.type}
                        </span>
                        <span className="truncate text-sm text-[var(--color-text-primary)]">
                          {r.title}
                        </span>
                      </div>
                      {r.snippet && (
                        <p className="truncate text-xs text-[var(--color-text-tertiary)]">
                          {r.snippet}
                        </p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
      </CommandList>
    </CommandDialog>
  );
}
