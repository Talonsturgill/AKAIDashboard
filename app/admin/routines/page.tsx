import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatNumber } from "@/lib/utils/format";

export const revalidate = 30;

// ── Types ────────────────────────────────────────────────────────────────────

type RoutineRun = {
  id: string;
  routine_name: string;
  started_at: string;
  completed_at: string | null;
  status: "running" | "success" | "failure";
  records_processed: number | null;
  records_created: number | null;
  records_updated: number | null;
  notes: string | null;
  error: string | null;
  metadata: Record<string, unknown> | null;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const KNOWN_ROUTINES = [
  "sync_substack_archive",
  "poll_sam_gov_contracts",
  "poll_state_legislature",
  "poll_federal_register",
  "poll_rss_sources",
  "extract_entities",
  "infer_relationships",
  "refresh_dashboard_metrics",
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(
  startedAt: string,
  completedAt: string | null,
): string {
  if (!completedAt) return "—";
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 0) return "—";
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function formatTimestamp(value: string): string {
  const d = new Date(value);
  return (
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    " " +
    d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
  );
}

// ── Badge component ───────────────────────────────────────────────────────────

type BadgeStatus = "success" | "failure" | "running" | "never";

function StatusBadge({ status }: { status: BadgeStatus }) {
  const map: Record<
    BadgeStatus,
    { label: string; className: string }
  > = {
    success: {
      label: "success",
      className:
        "bg-[hsl(158_64%_39%/0.18)] text-[hsl(158_74%_55%)] border border-[hsl(158_64%_39%/0.4)]",
    },
    failure: {
      label: "failure",
      className:
        "bg-[hsl(0_72%_51%/0.18)] text-[hsl(0_84%_70%)] border border-[hsl(0_72%_51%/0.4)]",
    },
    running: {
      label: "running",
      className:
        "bg-[hsl(189_94%_43%/0.15)] text-[var(--color-aurora-cyan)] border border-[hsl(189_94%_43%/0.35)]",
    },
    never: {
      label: "never run",
      className:
        "bg-[var(--color-surface-elevated)] text-[var(--color-text-tertiary)] border border-[var(--color-border-soft)]",
    },
  };

  const { label, className } = map[status];
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${className}`}
    >
      {label}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function RoutinesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("routine_runs")
    .select(
      "id,routine_name,started_at,completed_at,status,records_processed,records_created,records_updated,notes,error,metadata",
    )
    .order("started_at", { ascending: false })
    .limit(100)
    .returns<RoutineRun[]>();

  const runs: RoutineRun[] = data ?? [];
  const recentRuns = runs.slice(0, 30);

  // Build a lookup: routineName → most recent run
  const latestByRoutine = new Map<string, RoutineRun>();
  for (const run of runs) {
    if (!latestByRoutine.has(run.routine_name)) {
      latestByRoutine.set(run.routine_name, run);
    }
  }

  const hasAnyRuns = runs.length > 0;

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <div className="mx-auto max-w-[1240px] px-6 py-12">

        {/* Top nav */}
        <div className="mb-10">
          <Link
            href="/"
            className="font-mono text-xs text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-aurora-cyan)]"
          >
            ← Alaska.AI
          </Link>
        </div>

        {/* Header */}
        <div className="mb-10">
          <p className="label-eyebrow mb-2">Admin</p>
          <h1 className="font-display text-4xl font-light tracking-tight text-[var(--color-text-primary)]">
            Routine status
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-tertiary)]">
            Live view of the 8 Claude Code Routines — last refreshed every 30 s.
          </p>
        </div>

        {/* ── Summary cards ─────────────────────────────────────────────── */}
        <section className="mb-14">
          <p className="label-eyebrow mb-4">All routines</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
            {KNOWN_ROUTINES.map((name) => {
              const run = latestByRoutine.get(name);
              const badgeStatus: BadgeStatus = run
                ? (run.status as BadgeStatus)
                : "never";

              return (
                <div
                  key={name}
                  className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5"
                >
                  {/* Name + badge */}
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <code className="font-mono text-sm text-[var(--color-text-primary)]">
                      {name}
                    </code>
                    <StatusBadge status={badgeStatus} />
                  </div>

                  {run ? (
                    <div className="space-y-1.5 text-xs text-[var(--color-text-tertiary)]">
                      {/* Timestamp */}
                      <div className="flex items-center justify-between gap-4">
                        <span>Last run</span>
                        <span className="font-mono text-[var(--color-text-secondary)]">
                          {formatTimestamp(run.started_at)}
                        </span>
                      </div>
                      {/* Duration */}
                      <div className="flex items-center justify-between gap-4">
                        <span>Duration</span>
                        <span className="font-mono text-[var(--color-text-secondary)]">
                          {formatDuration(run.started_at, run.completed_at)}
                        </span>
                      </div>
                      {/* Counts */}
                      <div className="flex items-center justify-between gap-4">
                        <span>Processed / Created / Updated</span>
                        <span className="font-mono text-[var(--color-text-secondary)]">
                          {formatNumber(run.records_processed)} /{" "}
                          {formatNumber(run.records_created)} /{" "}
                          {formatNumber(run.records_updated)}
                        </span>
                      </div>
                      {/* Error snippet */}
                      {run.status === "failure" && run.error && (
                        <p className="mt-2 truncate rounded bg-[hsl(0_72%_51%/0.1)] px-2 py-1 font-mono text-[10px] text-[hsl(0_84%_70%)]">
                          {run.error}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      No runs recorded yet.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Recent runs table / empty state ───────────────────────────── */}
        <section>
          <p className="label-eyebrow mb-4">Recent runs</p>

          {!hasAnyRuns ? (
            <div className="rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-12 text-center">
              <p className="label-eyebrow mb-3">No routine runs recorded yet</p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Set up the 8 routines per{" "}
                <code className="rounded bg-[var(--color-surface-elevated)] px-1.5 py-0.5 font-mono text-xs">
                  routines/README.md
                </code>{" "}
                and run each once to populate this dashboard.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-soft)]">
                    <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Routine
                    </th>
                    <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Started
                    </th>
                    <th className="px-4 py-3 text-right font-mono text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-right font-mono text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right font-mono text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Updated
                    </th>
                    <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Error
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentRuns.map((run, idx) => (
                    <tr
                      key={run.id}
                      className={`border-b border-[var(--color-border-soft)] last:border-0 ${
                        idx % 2 === 0
                          ? "bg-transparent"
                          : "bg-[var(--color-surface-elevated)]"
                      }`}
                    >
                      {/* Routine name */}
                      <td className="px-4 py-3">
                        <code className="font-mono text-xs text-[var(--color-text-secondary)]">
                          {run.routine_name}
                        </code>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={run.status as BadgeStatus} />
                      </td>

                      {/* Started at */}
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-[var(--color-text-tertiary)]">
                        {formatDate(run.started_at)}
                      </td>

                      {/* Duration */}
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs text-[var(--color-text-tertiary)]">
                        {formatDuration(run.started_at, run.completed_at)}
                      </td>

                      {/* records_created */}
                      <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-text-secondary)]">
                        {run.records_created !== null
                          ? formatNumber(run.records_created)
                          : "—"}
                      </td>

                      {/* records_updated */}
                      <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-text-secondary)]">
                        {run.records_updated !== null
                          ? formatNumber(run.records_updated)
                          : "—"}
                      </td>

                      {/* Error */}
                      <td className="max-w-[240px] px-4 py-3">
                        {run.status === "failure" && run.error ? (
                          <span className="line-clamp-1 font-mono text-xs text-[hsl(0_84%_70%)]">
                            {run.error}
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-[var(--color-text-tertiary)]">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
