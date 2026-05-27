import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";

export const revalidate = 300;

type PolicyType =
  | "state_bill"
  | "federal_rule"
  | "executive_order"
  | "agency_guidance"
  | "court_ruling";

const POLICY_TYPE_LABELS: Record<PolicyType, string> = {
  state_bill: "State Bill",
  federal_rule: "Federal Rule",
  executive_order: "Executive Order",
  agency_guidance: "Agency Guidance",
  court_ruling: "Court Ruling",
};

const POLICY_TYPE_STYLES: Record<PolicyType, string> = {
  state_bill:
    "bg-[hsl(189_94%_43%/0.12)] text-[var(--color-aurora-cyan)] border-[hsl(189_94%_43%/0.3)]",
  federal_rule:
    "bg-[hsl(258_90%_66%/0.12)] text-[var(--color-aurora-purple)] border-[hsl(258_90%_66%/0.3)]",
  executive_order:
    "bg-[hsl(158_64%_39%/0.15)] text-[var(--color-aurora-green)] border-[hsl(158_64%_39%/0.3)]",
  agency_guidance:
    "bg-[hsl(40_100%_60%/0.12)] text-[hsl(40_100%_65%)] border-[hsl(40_100%_60%/0.3)]",
  court_ruling:
    "bg-[hsl(220_6%_47%/0.12)] text-[var(--color-text-tertiary)] border-[var(--color-border-soft)]",
};

type PolicyDetail = {
  id: string;
  title: string;
  description: string | null;
  policy_type: string | null;
  jurisdiction: string | null;
  status: string | null;
  sponsor_entity_id: string | null;
  document_url: string | null;
  introduced_date: string | null;
  last_action_date: string | null;
  ai_relevance_score: number | null;
};

type EntityMini = {
  id: string;
  name: string;
};

export default async function PolicyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("policies")
    .select(
      "id,title,description,policy_type,jurisdiction,status,sponsor_entity_id,document_url,introduced_date,last_action_date,ai_relevance_score",
    )
    .eq("id", id)
    .maybeSingle<PolicyDetail>();

  if (!data) notFound();

  let sponsor: EntityMini | null = null;
  if (data.sponsor_entity_id) {
    const { data: entityRow } = await supabase
      .from("entities")
      .select("id,name")
      .eq("id", data.sponsor_entity_id)
      .maybeSingle<EntityMini>();
    sponsor = entityRow ?? null;
  }

  const policyTypeKey = data.policy_type as PolicyType | null;
  const policyTypeLabel =
    policyTypeKey && POLICY_TYPE_LABELS[policyTypeKey]
      ? POLICY_TYPE_LABELS[policyTypeKey]
      : data.policy_type;
  const policyTypeStyle =
    policyTypeKey && POLICY_TYPE_STYLES[policyTypeKey]
      ? POLICY_TYPE_STYLES[policyTypeKey]
      : "bg-[hsl(220_6%_47%/0.12)] text-[var(--color-text-tertiary)] border-[var(--color-border-soft)]";

  const relevancePercent =
    data.ai_relevance_score !== null
      ? Math.round(data.ai_relevance_score * 100)
      : null;

  return (
    <article className="mx-auto max-w-[1100px] px-6 py-12">
      <Link
        href="/policy"
        className="label-eyebrow inline-flex items-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
      >
        ← Policy
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_260px]">
        <div>
          <header className="mb-8 border-b border-[var(--color-border-soft)] pb-8">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {policyTypeLabel && (
                <span
                  className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${policyTypeStyle}`}
                >
                  {policyTypeLabel}
                </span>
              )}
              {data.jurisdiction && (
                <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  {data.jurisdiction}
                </span>
              )}
              {data.status && (
                <span className="font-mono text-xs text-[var(--color-text-tertiary)]">
                  {data.status}
                </span>
              )}
            </div>
            <h1 className="font-display text-4xl font-light leading-tight tracking-tight md:text-5xl">
              {data.title}
            </h1>
          </header>

          {data.description && (
            <p className="text-base leading-relaxed text-[var(--color-text-secondary)]">
              {data.description}
            </p>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
            <p className="label-eyebrow mb-3">Details</p>
            <dl className="space-y-3 text-sm">
              {data.introduced_date && (
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    Introduced
                  </dt>
                  <dd className="mt-0.5 text-[var(--color-text-secondary)]">
                    {formatDate(data.introduced_date)}
                  </dd>
                </div>
              )}
              {data.last_action_date && (
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    Last Action
                  </dt>
                  <dd className="mt-0.5 text-[var(--color-text-secondary)]">
                    {formatDate(data.last_action_date)}
                  </dd>
                </div>
              )}
              {relevancePercent !== null && (
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    AI Relevance
                  </dt>
                  <dd className="mt-0.5 font-mono text-[var(--color-aurora-cyan)]">
                    {relevancePercent}%
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {sponsor && (
            <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
              <p className="label-eyebrow mb-3">Sponsor</p>
              <Link
                href={`/companies/${sponsor.id}`}
                className="text-sm text-[var(--color-aurora-cyan)] hover:underline"
              >
                {sponsor.name}
              </Link>
            </div>
          )}

          {data.document_url && (
            <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
              <p className="label-eyebrow mb-3">Document</p>
              <a
                href={data.document_url}
                target="_blank"
                rel="noreferrer noopener"
                className="break-words text-sm text-[var(--color-aurora-cyan)] hover:underline"
              >
                View source document ↗
              </a>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}
