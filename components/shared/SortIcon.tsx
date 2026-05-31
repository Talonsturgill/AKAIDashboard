export function SortIcon({ dir }: { dir: "asc" | "desc" | false }) {
  if (!dir)
    return (
      <span className="ml-1 text-[var(--color-border-strong)] opacity-50">
        ↕
      </span>
    );
  return (
    <span className="ml-1 text-[var(--color-aurora-cyan)]">
      {dir === "asc" ? "↑" : "↓"}
    </span>
  );
}
