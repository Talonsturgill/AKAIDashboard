import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AuroraBackground } from "@/components/brand/AuroraBackground";
import { formatNumber } from "@/lib/utils/format";
import { Card, Metric, Text, Callout } from "@tremor/react";

export const revalidate = 300;

type PlatformStats = {
  entities?: number;
  contracts?: number;
  policies?: number;
  archive?: number;
};

async function loadStats(): Promise<PlatformStats> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dashboard_metrics")
    .select("value")
    .eq("key", "platform_stats")
    .maybeSingle<{ value: PlatformStats }>();
  return data?.value ?? {};
}

type StatTile = {
  label: string;
  value: number | undefined;
  description: string;
};

export default async function HomePage() {
  const stats = await loadStats();

  const tiles: StatTile[] = [
    {
      label: "Entities",
      value: stats.entities,
      description: "Organizations and agencies active in Alaska AI",
    },
    {
      label: "Contracts",
      value: stats.contracts,
      description: "Federal contracts with AI scope tracked",
    },
    {
      label: "Policies tracked",
      value: stats.policies,
      description: "State and federal policy documents indexed",
    },
    {
      label: "Archive articles",
      value: stats.archive,
      description: "News and analysis articles in the archive",
    },
  ];

  return (
    <section className="relative min-h-[calc(100vh-3.5rem-12rem)] overflow-hidden">
      <AuroraBackground />
      <div className="relative mx-auto flex max-w-[1440px] flex-col items-center px-6 py-24 text-center md:py-36">
        <p className="label-eyebrow mb-6">Alaska AI Intelligence Platform</p>
        <h1 className="font-display text-5xl font-light leading-[1.05] tracking-tight md:text-7xl">
          The intelligence layer
        </h1>
        <h2 className="font-display mt-2 text-5xl font-light tracking-tight md:text-7xl">
          <span className="aurora-gradient-text">for AI in Alaska</span>
        </h2>
        <p className="mt-8 max-w-2xl text-base text-[var(--color-text-secondary)] md:text-lg">
          A searchable dataset of who is doing AI work in Alaska, covering the
          contracts, the policy, the infrastructure, and the content that
          surrounds it all. Updated daily.
        </p>

        {/* Systems status callout */}
        <div className="mt-10 w-full max-w-3xl text-left">
          <Callout
            title="All systems nominal"
            color="cyan"
            className="bg-[hsl(189_94%_43%/0.08)] ring-[hsl(189_94%_43%/0.25)] text-[var(--color-text-secondary)]"
          >
            Data pipelines running. Last index refresh within 24 hours.
          </Callout>
        </div>

        {/* Metric tiles */}
        <div className="mt-10 grid w-full max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
          {tiles.map((tile) => (
            <Card
              key={tile.label}
              decoration="top"
              decorationColor="cyan"
              className="bg-[var(--color-surface)] ring-[var(--color-border-soft)] shadow-none text-left hover:ring-[var(--color-border-strong)] transition-all duration-200"
            >
              <Text className="label-eyebrow">{tile.label}</Text>
              <Metric className="mt-2 font-mono text-[var(--color-text-primary)]">
                {formatNumber(tile.value ?? 0)}
              </Metric>
              <Text className="mt-1.5 text-xs text-[var(--color-text-tertiary)] leading-snug">
                {tile.description}
              </Text>
            </Card>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center gap-3">
          <span className="label-eyebrow text-[var(--color-aurora-cyan)]">
            Network online
          </span>
          <p className="max-w-md text-sm text-[var(--color-text-tertiary)]">
            The entity network is live and explorable. Open the relationship
            graph or jump straight into the command center.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/companies"
              className="rounded border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-aurora-cyan)] hover:text-[var(--color-aurora-cyan)]"
            >
              Open relationship graph →
            </Link>
            <Link
              href="/command"
              className="rounded border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-aurora-cyan)] hover:text-[var(--color-aurora-cyan)]"
            >
              Open command center →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
