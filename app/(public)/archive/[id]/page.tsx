import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";

export const revalidate = 300;

type ArchiveDetail = {
  id: string;
  title: string;
  subtitle: string | null;
  author: string | null;
  source_platform: string;
  source_url: string;
  body: string;
  published_at: string;
  entities_mentioned: string[] | null;
  cover_image_url: string | null;
};

export default async function ArchiveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("archive_content")
    .select(
      "id,title,subtitle,author,source_platform,source_url,body,published_at,entities_mentioned,cover_image_url",
    )
    .eq("id", id)
    .maybeSingle<ArchiveDetail>();

  if (!data) notFound();

  const entityIds = (data.entities_mentioned ?? []) as string[];
  type EntityMini = { id: string; name: string; type: string };
  let entities: EntityMini[] = [];
  if (entityIds.length > 0) {
    const { data: entityRows } = await supabase
      .from("entities")
      .select("id,name,type")
      .in("id", entityIds)
      .returns<EntityMini[]>();
    entities = entityRows ?? [];
  }

  const isHtml = /<\w+[^>]*>/.test(data.body);

  return (
    <article className="mx-auto max-w-[1100px] px-6 py-12">
      <Link
        href="/archive"
        className="label-eyebrow inline-flex items-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
      >
        ← Archive
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_260px]">
        <div>
          <header className="mb-8 border-b border-[var(--color-border-soft)] pb-8">
            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
              <span className="font-mono uppercase tracking-wider text-[var(--color-aurora-cyan)]">
                {data.source_platform}
              </span>
              <span className="text-[var(--color-text-tertiary)]">
                {formatDate(data.published_at)}
              </span>
              {data.author && (
                <span className="text-[var(--color-text-tertiary)]">
                  · {data.author}
                </span>
              )}
            </div>
            <h1 className="font-display text-4xl font-light leading-tight tracking-tight md:text-5xl">
              {data.title}
            </h1>
            {data.subtitle && (
              <p className="mt-3 text-lg text-[var(--color-text-secondary)]">
                {data.subtitle}
              </p>
            )}
          </header>

          <div className="prose prose-invert max-w-none prose-headings:font-display prose-headings:font-light prose-a:text-[var(--color-aurora-cyan)] prose-strong:text-[var(--color-text-primary)] prose-code:rounded prose-code:bg-[var(--color-surface)] prose-code:px-1 prose-code:py-0.5 prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none">
            {isHtml ? (
              <div dangerouslySetInnerHTML={{ __html: data.body }} />
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {data.body}
              </ReactMarkdown>
            )}
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
            <p className="label-eyebrow mb-3">Source</p>
            <a
              href={data.source_url}
              target="_blank"
              rel="noreferrer noopener"
              className="break-words text-sm text-[var(--color-aurora-cyan)] hover:underline"
            >
              {data.source_url}
            </a>
          </div>

          {entities.length > 0 && (
            <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
              <p className="label-eyebrow mb-3">Mentioned</p>
              <ul className="space-y-2">
                {entities.map((entity) => (
                  <li key={entity.id}>
                    <Link
                      href={`/companies/${entity.id}`}
                      className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    >
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        {entity.type}
                      </span>
                      <span>{entity.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}
