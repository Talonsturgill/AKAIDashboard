import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils/format";

export const revalidate = 300;

type InfraDetail = {
  id: string;
  name: string;
  project_type: string | null;
  operator_entity_id: string | null;
  location_name: string | null;
  capacity_metric: string | null;
  capacity_value: number | null;
  status: string | null;
  announced_date: string | null;
  operational_date: string | null;
  estimated_cost: number | null;
  source_urls: string[];
};

type EntityMini = { id: string; name: string };

type ProjectType =
  | "data_center"
  | "fiber"
  | "broadband"
  | "power"
  | "compute"
  | "satellite"
  | "other";

const TYPE_LABELS: Record<ProjectType, string> = {
  data_center: "Data Center",
  fiber: "Fiber",
  broadband: "Broadband",
  power: "Power",
  compute: "Compute",
  satellite: "Satellite",
  other: "Other",
};

const TYPE_STYLES: Record<ProjectType, string> = {
  data_center:
    "bg-[hsl(258_90%_66%/0.12)] text-[var(--color-aurora-purple)] border-[hsl(258_90%_66%/0.3)]",
  fiber: "bg-[hsl(189_94%_43%/0.12)] text-[var(--color-aurora-cyan)] border-[hsl(189_94%_43%/0.3)]",
  broadband:
    "bg-[hsl(189_94%_43%/0.08)] text-[var(--color-aurora-cyan)] border-[hsl(189_94%_43%/0.2)]",
  power:
    "bg-[hsl(330_81%_60%/0.12)] text-[var(--color-aurora-magenta)] border-[hsl(330_81%_60%/0.3)]",
  compute:
    "bg-[hsl(258_90%_66%/0.08)] text-[var(--color-aurora-purple)] border-[hsl(258_90%_66%/0.2)]",
  satellite:
    "bg-[hsl(158_64%_39%/0.15)] text-[var(--color-aurora-green)] border-[hsl(158_64%_39%/0.3)]",
  other:
    "bg-[hsl(220_6%_47%/0.12)] text-[var(--color-text-tertiary)] border-[var(--color-border-soft)]",
};

function TypeBadge({ type }: { type: string | null }) {
  if (!type) return null;
  const key = type as ProjectType;
  const label = TYPE_LABELS[key] ?? type;
  const style =
    TYPE_STYLES[key] ??
    "bg-[hsl(220_6%_47%/0.12)] text-[var(--color-text-tertiary)] border-[var(--color-border-soft)]";
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${style}`}
    >
      {label}
    </span>
  );
}

export default async function InfrastructureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("infrastructure_projects")
    .select(
      "id,name,project_type,operator_entity_id,location_name,capacity_metric,capacity_value,status,announced_date,operational_date,estimated_cost,source_urls",
    )
    .eq("id", id)
    .maybeSingle<InfraDetail>();

  if (!data) notFound();

  let operator: EntityMini | null = null;
  if (data.operator_entity_id) {
    const { data: entityRow } = await supabase
      .from("entities")
      .select("id,name")
      .eq("id", data.operator_entity_id)
      .maybeSingle<EntityMini>();
    operator = entityRow ?? null;
  }

  const statusMap: Record<string, string> = {
    planned: "Planned",
    announced: "Announced",
    construction: "Under Construction",
    operational: "Operational",
    cancelled: "Cancelled",
  };

  return (
    <article className="mx-auto max-w-[1100px] px-6 py-12">
      <Link
        href="/infrastructure"
        className="label-eyebrow inline-flex items-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
      >
        ← Infrastructure
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_260px]">
        <div>
          <header className="mb-8 border-b border-[var(--color-border-soft)] pb-8">
            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
              <TypeBadge type={data.project_type} />
              {data.status && (
                <span className="inline-flex items-center rounded border border-[var(--color-border-soft)] bg-[var(--color-surface-elevated)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  {statusMap[data.status] ?? data.status}
                </span>
              )}
            </div>
            <h1 className="font-display text-4xl font-light leading-tight tracking-tight md:text-5xl">
              {data.name}
            </h1>
            {data.location_name && (
              <p className="mt-3 text-lg text-[var(--color-text-secondary)]">
                {data.location_name}
              </p>
            )}
          </header>

          <dl className="space-y-4">
            {operator && (
              <div>
                <dt className="label-eyebrow mb-1">Operator</dt>
                <dd>
                  <Link
                    href={`/companies/${operator.id}`}
                    className="text-[var(--color-aurora-cyan)] hover:underline"
                  >
                    {operator.name}
                  </Link>
                </dd>
              </div>
            )}

            {data.estimated_cost !== null && (
              <div>
                <dt className="label-eyebrow mb-1">Estimated Cost</dt>
                <dd className="font-mono text-[var(--color-text-primary)]">
                  {formatCurrency(data.estimated_cost)}
                </dd>
              </div>
            )}

            {data.capacity_value !== null && data.capacity_metric && (
              <div>
                <dt className="label-eyebrow mb-1">Capacity</dt>
                <dd className="font-mono text-[var(--color-text-primary)]">
                  {data.capacity_value} {data.capacity_metric}
                </dd>
              </div>
            )}

            {data.announced_date && (
              <div>
                <dt className="label-eyebrow mb-1">Announced</dt>
                <dd className="text-[var(--color-text-secondary)]">
                  {formatDate(data.announced_date)}
                </dd>
              </div>
            )}

            {data.operational_date && (
              <div>
                <dt className="label-eyebrow mb-1">Expected Operational</dt>
                <dd className="text-[var(--color-text-secondary)]">
                  {formatDate(data.operational_date)}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          {data.source_urls && data.source_urls.length > 0 && (
            <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
              <p className="label-eyebrow mb-3">Sources</p>
              <ul className="space-y-2">
                {data.source_urls.map((url, i) => (
                  <li key={i}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="break-words text-sm text-[var(--color-aurora-cyan)] hover:underline"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.project_type && (
            <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
              <p className="label-eyebrow mb-3">Project Type</p>
              <TypeBadge type={data.project_type} />
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}
