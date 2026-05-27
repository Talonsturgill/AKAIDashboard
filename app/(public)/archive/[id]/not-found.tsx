import Link from "next/link";

export default function ArchiveNotFound() {
  return (
    <section className="mx-auto max-w-[800px] px-6 py-24 text-center">
      <p className="label-eyebrow mb-3">Article not found</p>
      <h1 className="font-display text-3xl font-light tracking-tight">
        That article isn&apos;t in the archive.
      </h1>
      <Link
        href="/archive"
        className="mt-8 inline-block rounded-md border border-[var(--color-border-strong)] px-4 py-2 text-sm hover:bg-[var(--color-surface)]"
      >
        Back to archive
      </Link>
    </section>
  );
}
