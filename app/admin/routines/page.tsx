import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatNumber } from "@/lib/utils/format";
import { Card, Metric, Text, Tracker, Badge } from "@tremor/react";

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

type TrackerBlock = {
  key?: string | number;
  color?: string;
  tooltip?: string;
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

type KnownRoutine = (typeof KNOWN_ROUTINES)[number];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(
  startedAt: string,
  completedAt: string | null,
): string {
  if (!completedAt) return "in progress";
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 0) return "unknown";
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

function statusToTrackerColor(status: RoutineRun["status"]): string {
  switch (status) {
    case "success":
      return "emerald";
    case "failure":
      return "red";
    case "running":
      return "cyan";
    default:
      return "gray";
  }
}

function statusToTrackerTooltip(run: RoutineRun): string {
  const date = formatDate(run.started_at);
  const dur = formatDuration(run.started_at, run.completed_at);
  if (run.status === "failure") {
    return `${date} - failed (${dur})`;
  }
  if (run.status === "running") {
    return `${date} - running`;
  }
  return `${date} - success (${dur})`;
}

function buildTrackerData(runs: RoutineRun[]): TrackerBlock[] {
  // Pad to 30 blocks; most-recent run is on the right
  const BLOCK_COUNT = 30;
  const blocks: TrackerBlock[] = Array.from({ length: BLOCK_COUNT }, (_, i) => ({
    key: `empty-${i}`,
    color: "zinc",
    tooltip: "No data",
  }));
  const reversed = [...runs].reverse(); // oldest first
  const start = Math.max(0, BLOCK_COUNT - reversed.length);
  reversed.forEach((run, idx) => {
    blocks[start + idx] = {
      key: run.id,
      color: statusToTrackerColor(run.status),
      tooltip: statusToTrackerTooltip(run),
    };
  });
  return blocks;
}

type BadgeStatus = "success" | "failure" | "running" | "never";

function statusBadgeColor(
  status: BadgeStatus,
): "emerald" | "red" | "cyan" | "zinc" {
  switch (status) {
    case "success":
      return "emerald";
    case "failure":
      return "red";
    case "running":
      return "cyan";
    default:
      return "zinc";
  }
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
    .limit(200)
    .returns<RoutineRun[]>();

  const runs: RoutineRun[] = data ?? [];

  // Build per-routine lookup
  const runsByRoutine = new Map<KnownRoutine, RoutineRun[]>();
  for (const name of KNOWN_ROUTINES) {
    runsByRoutine.set(name, []);
  }
  for (const run of runs) {
    const name = run.routine_name as KnownRoutine;
    if (runsByRoutine.has(name)) {
      runsByRoutine.get(name)!.push(run);
    }
  }

  const latestByRoutine = new Map<KnownRoutine, RoutineRun | undefined>();
  for (const [name, routineRuns] of runsByRoutine) {
    latestByRoutine.set(name, routineRuns[0]);
  }

  // Summary stats
  const totalRuns = runs.length;
  const successCount = runs.filter((r) => r.status === "success").length;
  const failureCount = runs.filter((r) => r.status === "failure").length;
  const successRate =
    totalRuns > 0 ? Math.round((successCount / totalRuns) * 100) : 0;
  const recentRuns = runs.slice(0, 30);
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
            &larr; Alaska.AI
          </Link>
        </div>

        {/* Header */}
        <div className="mb-10">
          <p className="label-eyebrow mb-2">Admin</p>
          <h1 className="font-display text-4xl font-light tracking-tight text-[var(--color-text-primary)]">
            Routine status
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-tertiary)]">
            Live view of the 8 Claude Code Routines. Refreshed every 30 s.
          </p>
        </div>

        {/* ── Summary metric cards ────────────────────────────────────────── */}
        <section className="mb-14">
          <p className="label-eyebrow mb-4">Overview</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card
              decoration="top"
              decorationColor="cyan"
              className="bg-[var(--color-surface)] ring-[var(--color-border-soft)] shadow-none"
            >
              <Text className="label-eyebrow">Total runs</Text>
              <Metric className="mt-2 font-mono text-[var(--color-text-primary)]">
                {formatNumber(totalRuns)}
              </Metric>
              <Text className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                Across all 8 routines
              </Text>
            </Card>

            <Card
              decoration="top"
              decorationColor="emerald"
              className="bg-[var(--color-surface)] ring-[var(--color-border-soft)] shadow-none"
            >
              <Text className="label-eyebrow">Success rate</Text>
              <Metric className="mt-2 font-mono text-[var(--color-text-primary)]">
                {totalRuns > 0 ? `${successRate}%` : "No data"}
              </Metric>
              <Text className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                {successCount} succeeded, {failureCount} failed
              </Text>
            </Card>

            <Card
              decoration="top"
              decorationColor="amber"
              className="bg-[var(--color-surface)] ring-[var(--color-border-soft)] shadow-none"
            >
              <Text className="label-eyebrow">Last run</Text>
              <Metric className="mt-2 font-mono text-[var(--color-text-primary)] text-base">
                {runs[0] ? formatDate(runs[0].started_at) : "Never"}
              </Metric>
              <Text className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                {runs[0] ? runs[0].routine_name.replace(/_/g, " ") : "No runs recorded"}
              </Text>
            </Card>
          </div>
        </section>

        {/* ── Routine cards ─────────────────────────────────────────────── */}
        <section className="mb-14">
          <p className="label-eyebrow mb-4">All routines</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {KNOWN_ROUTINES.map((name) => {
              const routineRuns = runsByRoutine.get(name) ?? [];
              const latest = latestByRoutine.get(name);
              const badgeStatus: BadgeStatus = latest
                ? (latest.status as BadgeStatus)
                : "never";
              const trackerData = buildTrackerData(routineRuns.slice(0, 30));

              return (
                <Card
                  key={name}
                  className="bg-[var(--color-surface)] ring-[var(--color-border-soft)] shadow-none"
                >
                  {/* Name + badge row */}
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                    <code className="font-mono text-sm text-[var(--color-text-primary)]">
                      {name}
                    </code>
                    <Badge
                      color={statusBadgeColor(badgeStatus)}
                      size="xs"
                      className="capitalize"
                    >
                      {badgeStatus === "never" ? "never run" : badgeStatus}
                    </Badge>
                  </div>

                  {/* Run history tracker */}
                  <div className="mb-4">
                    <Text className="mb-1.5 text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] font-semibold">
                      Last 30 runs
                    </Text>
                    <Tracker data={trackerData} className="h-8" />
                  </div>

                  {/* Latest run details */}
                  {latest ? (
                    <div className="space-y-1.5 text-xs text-[var(--color-text-tertiary)]">
                      <div className="flex items-center justify-between gap-4">
                        <span>Last run</span>
                        <span className="font-mono text-[var(--color-text-secondary)]">
                          {formatTimestamp(latest.started_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Duration</span>
                        <span className="font-mono text-[var(--color-text-secondary)]">
                          {formatDuration(latest.started_at, latest.completed_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Processed / Created / Updated</span>
                        <span className="font-mono text-[var(--color-text-secondary)]">
                          {formatNumber(latest.records_processed)} /{" "}
                          {formatNumber(latest.records_created)} /{" "}
                          {formatNumber(latest.records_updated)}
                        </span>
                      </div>
                      {latest.status === "failure" && latest.error && (
                        <p className="mt-2 truncate rounded bg-[hsl(0_72%_51%/0.1)] px-2 py-1 font-mono text-[10px] text-[hsl(0_84%_70%)]">
                          {latest.error}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      No runs recorded yet.
                    </p>
                  )}
                </Card>
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
                      <td className="px-4 py-3">
                        <code className="font-mono text-xs text-[var(--color-text-secondary)]">
                          {run.routine_name}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          color={statusBadgeColor(run.status as BadgeStatus)}
                          size="xs"
                          className="capitalize"
                        >
                          {run.status}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-[var(--color-text-tertiary)]">
                        {formatDate(run.started_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs text-[var(--color-text-tertiary)]">
                        {formatDuration(run.started_at, run.completed_at)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-text-secondary)]">
                        {run.records_created !== null
                          ? formatNumber(run.records_created)
                          : "0"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-text-secondary)]">
                        {run.records_updated !== null
                          ? formatNumber(run.records_updated)
                          : "0"}
                      </td>
                      <td className="max-w-[240px] px-4 py-3">
                        {run.status === "failure" && run.error ? (
                          <span className="line-clamp-1 font-mono text-xs text-[hsl(0_84%_70%)]">
                            {run.error}
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-[var(--color-text-tertiary)]">
                            ok
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
