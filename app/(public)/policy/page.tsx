import { createClient } from "@/lib/supabase/server";
import PolicyTable, {
  type PolicyRow,
  type EntityStub,
} from "@/components/policy/PolicyTable";

export const revalidate = 60;

export default async function PolicyIndexPage() {
  const supabase = await createClient();

  const { data: policiesData, count } = await supabase
    .from("policies")
    .select(
      "id,external_id,title,description,policy_type,jurisdiction,status,sponsor_entity_id,document_url,introduced_date,last_action_date,ai_relevance_score,metadata",
      { count: "exact" },
    )
    .order("last_action_date", { ascending: false, nullsFirst: false })
    .limit(500)
    .returns<PolicyRow[]>();

  const policies = policiesData ?? [];

  // Collect sponsor entity IDs referenced in this result set
  const entityIds = new Set<string>();
  for (const p of policies) {
    if (p.sponsor_entity_id) entityIds.add(p.sponsor_entity_id);
  }

  let entities: EntityStub[] = [];
  if (entityIds.size > 0) {
    const { data: entData } = await supabase
      .from("entities")
      .select("id,name")
      .in("id", Array.from(entityIds))
      .returns<EntityStub[]>();
    entities = entData ?? [];
  }

  return (
    <section className="mx-auto max-w-[1240px] px-6 py-12">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="label-eyebrow mb-2">Policy Pulse</p>
          <h1 className="font-display text-4xl font-light tracking-tight">
            Alaska AI policy tracker
          </h1>
        </div>
        {count !== null && count !== undefined && (
          <span className="font-mono text-sm text-[var(--color-text-tertiary)]">
            {count.toLocaleString()} entries
          </span>
        )}
      </div>

      {policies.length === 0 ? (
        <EmptyState />
      ) : (
        <PolicyTable rows={policies} entities={entities} />
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-12 text-center">
      <p className="label-eyebrow mb-3">No policies yet</p>
      <p className="text-sm text-[var(--color-text-secondary)]">
        Policy entries will populate once the{" "}
        <code className="rounded bg-[var(--color-surface-elevated)] px-1.5 py-0.5 font-mono text-xs">
          poll_state_legislature
        </code>{" "}
        and{" "}
        <code className="rounded bg-[var(--color-surface-elevated)] px-1.5 py-0.5 font-mono text-xs">
          poll_federal_register
        </code>{" "}
        routines run.
      </p>
      <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
        See <code className="font-mono">routines/README.md</code> for the
        schedule and dependency order.
      </p>
    </div>
  );
}
