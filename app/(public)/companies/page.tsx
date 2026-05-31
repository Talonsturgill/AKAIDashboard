import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import GraphPanel from "@/components/companies/GraphPanel";
import type { GraphNode, GraphEdge } from "@/components/companies/EntityGraph";

export const revalidate = 60;

const PAGE_SIZE = 24;

const ENTITY_TYPES = [
  "company",
  "person",
  "project",
  "agency",
  "anc",
  "university",
  "infrastructure",
  "tribe",
  "contract_holder",
] as const;

type EntityType = (typeof ENTITY_TYPES)[number];

type EntityRow = {
  id: string;
  type: string;
  name: string;
  description: string | null;
  mention_count: number;
  relevance_score: number;
};

type GraphEntityRow = {
  id: string;
  name: string;
  type: string;
};

type RelationshipRow = {
  id: string;
  from_entity_id: string;
  to_entity_id: string;
  relationship_type: string;
};

export default async function CompaniesIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const typeFilter = ENTITY_TYPES.includes(params.type as EntityType)
    ? (params.type as EntityType)
    : null;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  // Paginated entity list query
  let listQuery = supabase
    .from("entities")
    .select("id,type,name,description,mention_count,relevance_score", {
      count: "exact",
    })
    .order("relevance_score", { ascending: false, nullsFirst: false })
    .range(from, to);

  if (typeFilter) {
    listQuery = listQuery.eq("type", typeFilter);
  }

  // Parallel: list + graph entity fetches are independent
  const [listResult, graphEntityResult] = await Promise.all([
    listQuery.returns<EntityRow[]>(),
    supabase
      .from("entities")
      .select("id,name,type")
      .order("relevance_score", { ascending: false, nullsFirst: false })
      .limit(60)
      .returns<GraphEntityRow[]>(),
  ]);

  const { data: listData, count } = listResult;
  const entities = listData ?? [];
  const totalPages = count ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : 1;

  const graphEntities = graphEntityResult.data ?? [];
  const graphEntityIds = new Set(graphEntities.map((e) => e.id));

  // Fetch relationships; filter to only those where both endpoints are in the set
  let graphEdges: GraphEdge[] = [];
  if (graphEntities.length > 0) {
    const { data: relData } = await supabase
      .from("relationships")
      .select("id,from_entity_id,to_entity_id,relationship_type")
      .in("from_entity_id", [...graphEntityIds])
      .returns<RelationshipRow[]>();

    const rels = relData ?? [];
    graphEdges = rels
      .filter((r) => graphEntityIds.has(r.to_entity_id))
      .map((r) => ({
        id: r.id,
        source: r.from_entity_id,
        target: r.to_entity_id,
        label: r.relationship_type.replace(/_/g, " "),
      }));
  }

  const graphNodes: GraphNode[] = graphEntities.map((e) => ({
    id: e.id,
    name: e.name,
    type: e.type,
  }));

  const paginationHref = (p: number) => {
    const qs = new URLSearchParams();
    qs.set("page", String(p));
    if (typeFilter) qs.set("type", typeFilter);
    return `/companies?${qs.toString()}`;
  };

  const typeHref = (t: EntityType | null) => {
    const qs = new URLSearchParams();
    if (t) qs.set("type", t);
    return t ? `/companies?${qs.toString()}` : "/companies";
  };

  return (
    <section className="mx-auto max-w-[1240px] px-6 py-12">
      {/* Header */}
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="label-eyebrow mb-2">Entities</p>
          <h1 className="font-display text-4xl font-light tracking-tight">
            Alaska AI network
          </h1>
        </div>
        {count !== null && count !== undefined && (
          <span className="font-mono text-sm text-[var(--color-text-tertiary)]">
            {count.toLocaleString()} entities
          </span>
        )}
      </div>

      {/* Network graph */}
      <div className="mb-10">
        <p className="label-eyebrow mb-3">Relationship network</p>
        <GraphPanel nodes={graphNodes} edges={graphEdges} />
      </div>

      {/* Type filter row */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href={typeHref(null)}
          className={`rounded px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${
            !typeFilter
              ? "bg-[var(--color-border-strong)] text-[var(--color-text-primary)]"
              : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
          }`}
        >
          All
        </Link>
        {ENTITY_TYPES.map((t) => (
          <Link
            key={t}
            href={typeHref(t)}
            className={`rounded px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${
              typeFilter === t
                ? "bg-[var(--color-border-strong)] text-[var(--color-text-primary)]"
                : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            {t.replace(/_/g, " ")}
          </Link>
        ))}
      </div>

      {entities.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-3">
          {entities.map((entity) => (
            <li
              key={entity.id}
              className="group rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-border-strong)]"
            >
              <Link href={`/companies/${entity.id}`} className="block">
                <div className="mb-2 flex items-center gap-3">
                  <TypeBadge type={entity.type} />
                  <span className="font-mono text-xs text-[var(--color-text-tertiary)]">
                    {entity.mention_count.toLocaleString()} mentions
                  </span>
                </div>
                <h2 className="text-lg font-medium text-[var(--color-text-primary)] group-hover:aurora-gradient-text">
                  {entity.name}
                </h2>
                {entity.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-secondary)]">
                    {entity.description}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link
              href={paginationHref(page - 1)}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              ← Prev
            </Link>
          ) : (
            <span />
          )}
          <span className="font-mono text-xs text-[var(--color-text-tertiary)]">
            page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={paginationHref(page + 1)}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              Next →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </section>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-aurora-cyan)]">
      {type.replace(/_/g, " ")}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-12 text-center">
      <p className="label-eyebrow mb-3">No entities yet</p>
      <p className="text-sm text-[var(--color-text-secondary)]">
        This section populates once the{" "}
        <code className="rounded bg-[var(--color-surface-elevated)] px-1.5 py-0.5 font-mono text-xs">
          extract_entities
        </code>{" "}
        and{" "}
        <code className="rounded bg-[var(--color-surface-elevated)] px-1.5 py-0.5 font-mono text-xs">
          infer_relationships
        </code>{" "}
        routines run.
      </p>
      <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
        See <code className="font-mono">routines/README.md</code> for setup.
      </p>
    </div>
  );
}
