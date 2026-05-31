"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { CommandPalette } from "./CommandPalette";

export function UniversalSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text-tertiary)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-secondary)]"
        aria-label="Open search palette"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden rounded border border-[var(--color-border-soft)] bg-[var(--color-background)] px-1.5 py-0.5 font-mono text-[10px] leading-none text-[var(--color-text-tertiary)] sm:inline-flex">
          ⌘K
        </kbd>
      </button>

      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
