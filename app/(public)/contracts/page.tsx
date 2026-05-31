import { createClient } from "@/lib/supabase/server";
import ContractsTable, {
  type ContractRow,
  type EntityStub,
} from "@/components/contracts/ContractsTable";

export const revalidate = 60;

export default async function ContractsIndexPage() {
  const supabase = await createClient();

  const { data: contractsData, count } = await supabase
    .from("contracts")
    .select(
      "id,external_id,title,description,contract_value,contract_type,status,award_date,ai_relevance_score,awarding_entity_id,winning_entity_id,source_url,metadata",
      { count: "exact" },
    )
    .order("contract_value", { ascending: false, nullsFirst: false })
    .limit(500)
    .returns<ContractRow[]>();

  const contracts = contractsData ?? [];

  // Collect all entity IDs referenced in this result set
  const entityIds = new Set<string>();
  for (const c of contracts) {
    if (c.awarding_entity_id) entityIds.add(c.awarding_entity_id);
    if (c.winning_entity_id) entityIds.add(c.winning_entity_id);
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
          <p className="label-eyebrow mb-2">Contracts</p>
          <h1 className="font-display text-4xl font-light tracking-tight">
            Alaska AI contract tracker
          </h1>
        </div>
        {count !== null && count !== undefined && (
          <span className="font-mono text-sm text-[var(--color-text-tertiary)]">
            {count.toLocaleString()} contracts
          </span>
        )}
      </div>

      {contracts.length === 0 ? (
        <EmptyState />
      ) : (
        <ContractsTable rows={contracts} entities={entities} />
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-12 text-center">
      <p className="label-eyebrow mb-3">No contracts yet</p>
      <p className="text-sm text-[var(--color-text-secondary)]">
        Contracts will populate once the{" "}
        <code className="rounded bg-[var(--color-surface-elevated)] px-1.5 py-0.5 font-mono text-xs">
          poll_sam_gov_contracts
        </code>{" "}
        routine runs.
      </p>
      <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
        See{" "}
        <code className="font-mono">routines/README.md</code> for the schedule
        and dependency order.
      </p>
    </div>
  );
}
