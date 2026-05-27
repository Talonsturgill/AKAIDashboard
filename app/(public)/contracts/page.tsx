import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils/format";

export const revalidate = 60;

const PAGE_SIZE = 24;

type ContractRow = {
  id: string;
  title: string;
  contract_value: number | null;
  contract_type: string | null;
  status: string | null;
  award_date: string | null;
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
      className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${style}`}
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
    <span className="inline-flex items-center rounded border border-[var(--color-border-soft)] bg-[var(--color-surface-elevated)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
      {labels[type] ?? type}
    </span>
  );
}

export default async function ContractsIndexPage({
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
    .from("contracts")
    .select("id,title,contract_value,contract_type,status,award_date", {
      count: "exact",
    })
    .order("contract_value", { ascending: false, nullsFirst: false })
    .range(from, to)
    .returns<ContractRow[]>();

  const contracts = data ?? [];
  const totalPages = count ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : 1;

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
        <ul className="space-y-3">
          {contracts.map((contract) => (
            <li
              key={contract.id}
              className="group rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-border-strong)]"
            >
              <Link href={`/contracts/${contract.id}`} className="block">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                  <StatusBadge status={contract.status} />
                  <TypeTag type={contract.contract_type} />
                  {contract.award_date && (
                    <span className="text-[var(--color-text-tertiary)]">
                      {formatDate(contract.award_date)}
                    </span>
                  )}
                </div>
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-medium text-[var(--color-text-primary)] group-hover:aurora-gradient-text">
                    {contract.title}
                  </h2>
                  <span className="shrink-0 font-mono text-sm text-[var(--color-text-secondary)]">
                    {formatCurrency(contract.contract_value)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link
              href={`/contracts?page=${page - 1}`}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="font-mono text-xs text-[var(--color-text-tertiary)]">
            page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/contracts?page=${page + 1}`}
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
