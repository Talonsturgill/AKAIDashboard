import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";

export const revalidate = 60;

const PAGE_SIZE = 24;

type ArchiveRow = {
  id: string;
  title: string;
  subtitle: string | null;
  author: string | null;
  source_platform: string;
  source_url: string;
  body: string;
  published_at: string;
};

export default async function ArchiveIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const { data, count } = await supabase
    .from("archive_content")
    .select(
      "id,title,subtitle,author,source_platform,source_url,body,published_at",
      { count: "exact" },
    )
    .order("published_at", { ascending: false })
    .range(from, to)
    .returns<ArchiveRow[]>();

  const articles = data ?? [];
  const totalPages = count ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : 1;

  return (
    <section className="mx-auto max-w-[1240px] px-6 py-12">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="label-eyebrow mb-2">Archive</p>
          <h1 className="font-display text-4xl font-light tracking-tight">
            Everything written about Alaska AI
          </h1>
        </div>
        {count !== null && count !== undefined && (
          <span className="font-mono text-sm text-[var(--color-text-tertiary)]">
            {count.toLocaleString()} articles
          </span>
        )}
      </div>

      {articles.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-3">
          {articles.map((article) => (
            <li
              key={article.id}
              className="group rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-border-strong)]"
            >
              <Link href={`/archive/${article.id}`} className="block">
                <div className="mb-2 flex items-center gap-3 text-xs">
                  <span className="font-mono uppercase tracking-wider text-[var(--color-aurora-cyan)]">
                    {article.source_platform}
                  </span>
                  <span className="text-[var(--color-text-tertiary)]">
                    {formatDate(article.published_at)}
                  </span>
                  {article.author && (
                    <span className="text-[var(--color-text-tertiary)]">
                      · {article.author}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-medium text-[var(--color-text-primary)] group-hover:aurora-gradient-text">
                  {article.title}
                </h2>
                {article.subtitle && (
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {article.subtitle}
                  </p>
                )}
                <p className="mt-3 line-clamp-2 text-sm text-[var(--color-text-tertiary)]">
                  {stripMarkup(article.body).slice(0, 240)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link
              href={`/archive?page=${page - 1}`}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="font-mono text-xs text-[var(--color-text-tertiary)]">
            page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/archive?page=${page + 1}`}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-12 text-center">
      <p className="label-eyebrow mb-3">Archive empty</p>
      <p className="text-sm text-[var(--color-text-secondary)]">
        The archive will populate once the{" "}
        <code className="rounded bg-[var(--color-surface-elevated)] px-1.5 py-0.5 font-mono text-xs">
          sync_substack_archive
        </code>{" "}
        routine runs.
      </p>
      <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
        See <code className="font-mono">routines/sync_substack_archive.md</code>{" "}
        for setup.
      </p>
    </div>
  );
}

function stripMarkup(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
