import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

type EntityDetail = {
  id: string;
  type: string;
  name: string;
  description: string | null;
  aliases: string[] | null;
  relevance_score: number;
  mention_count: number;
  last_mentioned_at: string | null;
};

type RelationshipRow = {
  id: string;
  from_entity_id: string;
  to_entity_id: string;
  relationship_type: string;
  strength: number;
};

type EntityMini = {
  id: string;
  name: string;
  type: string;
};

type ContractRow = {
  id: string;
  title: string;
  contract_value: number | null;
  status: string | null;
};

type PolicyRow = {
  id: string;
  title: string;
  policy_type: string | null;
  status: string | null;
};

type InfrastructureRow = {
  id: string;
  name: string;
  project_type: string | null;
  status: string | null;
};

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("entities")
    .select(
      "id,type,name,description,aliases,relevance_score,mention_count,last_mentioned_at",
    )
    .eq("id", id)
    .maybeSingle<EntityDetail>();

  if (!data) notFound();

  // All six dependent queries are independent of each other — run in parallel
  const [
    { data: fromRels },
    { data: toRels },
    { data: awardingContracts },
    { data: winningContracts },
    { data: policies },
    { data: infraProjects },
  ] = await Promise.all([
    supabase
      .from("relationships")
      .select("id,from_entity_id,to_entity_id,relationship_type,strength")
      .eq("from_entity_id", id)
      .returns<RelationshipRow[]>(),
    supabase
      .from("relationships")
      .select("id,from_entity_id,to_entity_id,relationship_type,strength")
      .eq("to_entity_id", id)
      .returns<RelationshipRow[]>(),
    supabase
      .from("contracts")
      .select("id,title,contract_value,status")
      .eq("awarding_entity_id", id)
      .limit(10)
      .returns<ContractRow[]>(),
    supabase
      .from("contracts")
      .select("id,title,contract_value,status")
      .eq("winning_entity_id", id)
      .limit(10)
      .returns<ContractRow[]>(),
    supabase
      .from("policies")
      .select("id,title,policy_type,status")
      .eq("sponsor_entity_id", id)
      .limit(10)
      .returns<PolicyRow[]>(),
    supabase
      .from("infrastructure_projects")
      .select("id,name,project_type,status")
      .eq("operator_entity_id", id)
      .limit(10)
      .returns<InfrastructureRow[]>(),
  ]);

  const allRels = [...(fromRels ?? []), ...(toRels ?? [])];

  // The "other entity names" lookup depends on relationship results — keep sequential
  const otherIds = allRels.map((r) =>
    r.from_entity_id === id ? r.to_entity_id : r.from_entity_id,
  );

  let otherEntities: EntityMini[] = [];
  if (otherIds.length > 0) {
    const uniqueIds = [...new Set(otherIds)];
    const { data: entityRows } = await supabase
      .from("entities")
      .select("id,name,type")
      .in("id", uniqueIds)
      .returns<EntityMini[]>();
    otherEntities = entityRows ?? [];
  }

  const entityMap = new Map(otherEntities.map((e) => [e.id, e]));

  // Deduplicate contracts by id
  const contractMap = new Map<string, ContractRow>();
  for (const c of [...(awardingContracts ?? []), ...(winningContracts ?? [])]) {
    contractMap.set(c.id, c);
  }
  const contracts = [...contractMap.values()];

  return (
    <article className="mx-auto max-w-[1100px] px-6 py-12">
      <Link
        href="/companies"
        className="label-eyebrow inline-flex items-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
      >
        ← Companies
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_280px]">
        {/* Main column */}
        <div>
          <header className="mb-8 border-b border-[var(--color-border-soft)] pb-8">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-aurora-cyan)]">
                {data.type.replace(/_/g, " ")}
              </span>
            </div>
            <h1 className="font-display text-4xl font-light leading-tight tracking-tight md:text-5xl">
              {data.name}
            </h1>
            {data.description && (
              <p className="mt-4 text-lg text-[var(--color-text-secondary)]">
                {data.description}
              </p>
            )}

            {data.aliases && data.aliases.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {data.aliases.map((alias) => (
                  <span
                    key={alias}
                    className="rounded border border-[var(--color-border-soft)] bg-[var(--color-surface-elevated)] px-2 py-0.5 font-mono text-xs text-[var(--color-text-tertiary)]"
                  >
                    {alias}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Relationships */}
          {allRels.length > 0 && (
            <section className="mb-8">
              <p className="label-eyebrow mb-4">Relationships</p>
              <ul className="space-y-2">
                {allRels.map((rel) => {
                  const otherId =
                    rel.from_entity_id === id
                      ? rel.to_entity_id
                      : rel.from_entity_id;
                  const other = entityMap.get(otherId);
                  const direction =
                    rel.from_entity_id === id ? "→" : "←";
                  return (
                    <li
                      key={rel.id}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 text-sm"
                    >
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        {direction}{" "}
                        {rel.relationship_type.replace(/_/g, " ")}
                      </span>
                      {other ? (
                        <>
                          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                            [{other.type.replace(/_/g, " ")}]
                          </span>
                          <Link
                            href={`/companies/${other.id}`}
                            className="text-[var(--color-text-secondary)] hover:text-[var(--color-aurora-cyan)]"
                          >
                            {other.name}
                          </Link>
                        </>
                      ) : (
                        <span className="text-[var(--color-text-tertiary)]">
                          Unknown entity
                        </span>
                      )}
                      <span className="ml-auto font-mono text-[10px] text-[var(--color-text-tertiary)]">
                        strength {rel.strength.toFixed(2)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Contracts */}
          {contracts.length > 0 && (
            <section className="mb-8">
              <p className="label-eyebrow mb-4">Contracts</p>
              <ul className="space-y-2">
                {contracts.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/contracts/${c.id}`}
                      className="flex items-center gap-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 text-sm transition-colors hover:border-[var(--color-border-strong)]"
                    >
                      <span className="flex-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                        {c.title}
                      </span>
                      {c.contract_value !== null && (
                        <span className="font-mono text-xs text-[var(--color-text-tertiary)]">
                          ${c.contract_value.toLocaleString()}
                        </span>
                      )}
                      {c.status && (
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-aurora-cyan)]">
                          {c.status}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Policies */}
          {(policies ?? []).length > 0 && (
            <section className="mb-8">
              <p className="label-eyebrow mb-4">Policies</p>
              <ul className="space-y-2">
                {(policies ?? []).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/policy/${p.id}`}
                      className="flex items-center gap-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 text-sm transition-colors hover:border-[var(--color-border-strong)]"
                    >
                      <span className="flex-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                        {p.title}
                      </span>
                      {p.policy_type && (
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                          {p.policy_type}
                        </span>
                      )}
                      {p.status && (
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-aurora-cyan)]">
                          {p.status}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Infrastructure projects */}
          {(infraProjects ?? []).length > 0 && (
            <section className="mb-8">
              <p className="label-eyebrow mb-4">Infrastructure projects</p>
              <ul className="space-y-2">
                {(infraProjects ?? []).map((proj) => (
                  <li key={proj.id}>
                    <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 text-sm">
                      <span className="flex-1 text-[var(--color-text-secondary)]">
                        {proj.name}
                      </span>
                      {proj.project_type && (
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                          {proj.project_type}
                        </span>
                      )}
                      {proj.status && (
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-aurora-cyan)]">
                          {proj.status}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
            <p className="label-eyebrow mb-3">Stats</p>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[var(--color-text-tertiary)]">
                  Relevance score
                </dt>
                <dd className="font-mono text-[var(--color-text-primary)]">
                  {data.relevance_score.toFixed(3)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[var(--color-text-tertiary)]">Mentions</dt>
                <dd className="font-mono text-[var(--color-text-primary)]">
                  {data.mention_count.toLocaleString()}
                </dd>
              </div>
              {data.last_mentioned_at && (
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[var(--color-text-tertiary)]">
                    Last mentioned
                  </dt>
                  <dd className="font-mono text-[var(--color-text-primary)]">
                    {new Date(data.last_mentioned_at).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" },
                    )}
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[var(--color-text-tertiary)]">
                  Relationships
                </dt>
                <dd className="font-mono text-[var(--color-text-primary)]">
                  {allRels.length}
                </dd>
              </div>
            </dl>
          </div>

          {data.aliases && data.aliases.length > 0 && (
            <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
              <p className="label-eyebrow mb-3">Also known as</p>
              <ul className="space-y-1.5">
                {data.aliases.map((alias) => (
                  <li
                    key={alias}
                    className="font-mono text-xs text-[var(--color-text-secondary)]"
                  >
                    {alias}
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
