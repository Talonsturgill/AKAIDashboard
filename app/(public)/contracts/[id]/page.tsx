import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils/format";

export const revalidate = 300;

type ContractDetail = {
  id: string;
  title: string;
  description: string | null;
  contract_value: number | null;
  contract_type: string | null;
  status: string | null;
  award_date: string | null;
  period_of_performance: string | null;
  ai_relevance_score: number | null;
  solicitation_url: string | null;
  source_url: string | null;
  awarding_entity_id: string | null;
  winning_entity_id: string | null;
};

type EntityMini = {
  id: string;
  name: string;
};

type ContractStatus = "solicitation" | "awarded" | "in_progress" | "completed" | "cancelled";

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;

  const styles: Record<ContractStatus, string> = {
    awarded: "bg-[hsl(158_64%_39%/0.15)] text-[var(--color-aurora-green)] border-[hsl(158_64%_39%/0.3)]",
    in_progress: "bg-[hsl(189_94%_43%/0.12)] text-[var(--color-aurora-cyan)] border-[hsl(189_94%_43%/0.3)]",
    solicitation: "bg-[hsl(258_90%_66%/0.12)] text-[var(--color-aurora-purple)] border-[hsl(258_90%_66%/0.3)]",
    completed: "bg-[hsl(220_6%_47%/0.12)] text-[var(--color-text-tertiary)] border-[var(--color-border-soft)]",
    cancelled: "bg-[hsl(220_6%_47%/0.08)] text-[var(--color-text-tertiary)] border-[var(--color-border-soft)] opacity-60",
  };

  const labels: Record<ContractStatus, string> = {
    awarded: "Awarded",
    in_progress: "In Progress",
    solicitation: "Solicitation",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  const key = status as ContractStatus;
  const style = styles[key] ?? "bg-[hsl(220_6%_47%/0.12)] text-[var(--color-text-tertiary)] border-[var(--color-border-soft)]";
  const label = labels[key] ?? status;

  return (
    <span
      className={`inline-flex items-center rounded border px-2.5 py-1 font-mono text-xs uppercase tracking-wider ${style}`}
    >
      {label}
    </span>
  );
}

function TypeTag({ type }: { type: string | null }) {
  if (!type) return null;
  const labels: Record<string, string> = {
    state: "State",
    federal: "Federal",
    military: "Military",
    anc: "ANC",
    municipal: "Municipal",
  };
  return (
    <span className="inline-flex items-center rounded border border-[var(--color-border-soft)] bg-[var(--color-surface-elevated)] px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
      {labels[type] ?? type}
    </span>
  );
}

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("contracts")
    .select(
      "id,title,description,contract_value,contract_type,status,award_date,period_of_performance,ai_relevance_score,solicitation_url,source_url,awarding_entity_id,winning_entity_id",
    )
    .eq("id", id)
    .maybeSingle<ContractDetail>();

  if (!data) notFound();

  // Resolve entity names with a single .in() query
  const entityIds = [data.awarding_entity_id, data.winning_entity_id].filter(
    (v): v is string => v !== null,
  );

  let entityMap: Map<string, EntityMini> = new Map();
  if (entityIds.length > 0) {
    const { data: entityRows } = await supabase
      .from("entities")
      .select("id,name")
      .in("id", entityIds)
      .returns<EntityMini[]>();
    if (entityRows) {
      for (const e of entityRows) {
        entityMap.set(e.id, e);
      }
    }
  }

  const awardingEntity = data.awarding_entity_id
    ? entityMap.get(data.awarding_entity_id) ?? null
    : null;
  const winningEntity = data.winning_entity_id
    ? entityMap.get(data.winning_entity_id) ?? null
    : null;

  const relevancePercent =
    data.ai_relevance_score !== null
      ? Math.round(data.ai_relevance_score * 100)
      : null;

  return (
    <article className="mx-auto max-w-[1100px] px-6 py-12">
      <Link
        href="/contracts"
        className="label-eyebrow inline-flex items-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
      >
        ← Contracts
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_280px]">
        {/* Main content */}
        <div>
          <header className="mb-8 border-b border-[var(--color-border-soft)] pb-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={data.status} />
              <TypeTag type={data.contract_type} />
            </div>
            <h1 className="font-display text-4xl font-light leading-tight tracking-tight md:text-5xl">
              {data.title}
            </h1>
            <p className="mt-4 font-mono text-3xl text-[var(--color-text-primary)]">
              {formatCurrency(data.contract_value)}
            </p>
          </header>

          {data.description && (
            <div className="mb-8">
              <p className="label-eyebrow mb-3">Description</p>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                {data.description}
              </p>
            </div>
          )}

          <dl className="grid gap-4 sm:grid-cols-2">
            {data.award_date && (
              <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
                <dt className="label-eyebrow mb-1">Award date</dt>
                <dd className="text-sm text-[var(--color-text-primary)]">
                  {formatDate(data.award_date)}
                </dd>
              </div>
            )}

            {data.period_of_performance && (
              <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
                <dt className="label-eyebrow mb-1">Period of performance</dt>
                <dd className="font-mono text-xs text-[var(--color-text-secondary)] break-all">
                  {data.period_of_performance}
                </dd>
              </div>
            )}

            {awardingEntity && (
              <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
                <dt className="label-eyebrow mb-1">Awarding agency</dt>
                <dd>
                  <Link
                    href={`/companies/${awardingEntity.id}`}
                    className="text-sm text-[var(--color-aurora-cyan)] hover:underline"
                  >
                    {awardingEntity.name}
                  </Link>
                </dd>
              </div>
            )}

            {winningEntity && (
              <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
                <dt className="label-eyebrow mb-1">Awarded to</dt>
                <dd>
                  <Link
                    href={`/companies/${winningEntity.id}`}
                    className="text-sm text-[var(--color-aurora-cyan)] hover:underline"
                  >
                    {winningEntity.name}
                  </Link>
                </dd>
              </div>
            )}

            {relevancePercent !== null && (
              <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
                <dt className="label-eyebrow mb-1">AI relevance</dt>
                <dd className="font-mono text-sm text-[var(--color-text-primary)]">
                  {relevancePercent}%
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {data.solicitation_url && (
            <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
              <p className="label-eyebrow mb-3">Solicitation</p>
              <a
                href={data.solicitation_url}
                target="_blank"
                rel="noreferrer noopener"
                className="break-words text-sm text-[var(--color-aurora-cyan)] hover:underline"
              >
                View on SAM.gov ↗
              </a>
            </div>
          )}

          {data.source_url && (
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
          )}

          <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
            <p className="label-eyebrow mb-3">Contract ID</p>
            <p className="break-all font-mono text-xs text-[var(--color-text-tertiary)]">
              {id}
            </p>
          </div>
        </aside>
      </div>
    </article>
  );
}
