export default function ArchiveLoading() {
  return (
    <section className="mx-auto max-w-[1240px] px-6 py-12">
      <div className="mb-10 space-y-3">
        <div className="h-3 w-24 animate-pulse rounded bg-[var(--color-surface)]" />
        <div className="h-10 w-2/3 animate-pulse rounded bg-[var(--color-surface)]" />
      </div>
      <ul className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="h-28 animate-pulse rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)]"
          />
        ))}
      </ul>
    </section>
  );
}
