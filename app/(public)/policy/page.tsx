import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";

export const revalidate = 60;

const PAGE_SIZE = 24;

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

function PolicyTypeBadge({ policyType }: { policyType: string | null }) {
  if (!policyType) return null;
  const key = policyType as PolicyType;
  const label = POLICY_TYPE_LABELS[key] ?? policyType;
  const style =
    POLICY_TYPE_STYLES[key] ??
    "bg-[hsl(220_6%_47%/0.12)] text-[var(--color-text-tertiary)] border-[var(--color-border-soft)]";
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${style}`}
    >
      {label}
    </span>
  );
}

type PolicyRow = {
  id: string;
  title: string;
  policy_type: string | null;
  jurisdiction: string | null;
  status: string | null;
  last_action_date: string | null;
};

export default async function PolicyIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const typeFilter = params.type ?? null;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  let query = supabase
    .from("policies")
    .select("id,title,policy_type,jurisdiction,status,last_action_date", {
      count: "exact",
    })
    .order("last_action_date", { ascending: false, nullsFirst: false })
    .range(from, to);

  if (typeFilter) {
    query = query.eq("policy_type", typeFilter);
  }

  const { data, count } = await query.returns<PolicyRow[]>();

  const policies = data ?? [];
  const totalPages = count ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : 1;

  const filterTypes: PolicyType[] = [
    "state_bill",
    "federal_rule",
    "executive_order",
    "agency_guidance",
    "court_ruling",
  ];

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

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/policy"
          className={`inline-flex items-center rounded border px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
            !typeFilter
              ? "border-[var(--color-aurora-cyan)] bg-[hsl(189_94%_43%/0.12)] text-[var(--color-aurora-cyan)]"
              : "border-[var(--color-border-soft)] text-[var(--color-text-tertiary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-secondary)]"
          }`}
        >
          All
        </Link>
        {filterTypes.map((t) => (
          <Link
            key={t}
            href={`/policy?type=${t}`}
            className={`inline-flex items-center rounded border px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
              typeFilter === t
                ? "border-[var(--color-aurora-cyan)] bg-[hsl(189_94%_43%/0.12)] text-[var(--color-aurora-cyan)]"
                : "border-[var(--color-border-soft)] text-[var(--color-text-tertiary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            {POLICY_TYPE_LABELS[t]}
          </Link>
        ))}
      </div>

      {policies.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-3">
          {policies.map((policy) => (
            <li
              key={policy.id}
              className="group rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-border-strong)]"
            >
              <Link href={`/policy/${policy.id}`} className="block">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                  <PolicyTypeBadge policyType={policy.policy_type} />
                  {policy.jurisdiction && (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      {policy.jurisdiction}
                    </span>
                  )}
                  {policy.status && (
                    <span className="text-[var(--color-text-tertiary)]">
                      {policy.status}
                    </span>
                  )}
                  {policy.last_action_date && (
                    <span className="text-[var(--color-text-tertiary)]">
                      · {formatDate(policy.last_action_date)}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-medium text-[var(--color-text-primary)] group-hover:aurora-gradient-text">
                  {policy.title}
                </h2>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link
              href={`/policy?page=${page - 1}${typeFilter ? `&type=${typeFilter}` : ""}`}
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
              href={`/policy?page=${page + 1}${typeFilter ? `&type=${typeFilter}` : ""}`}
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
