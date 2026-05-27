import { createClient } from "@/lib/supabase/server";
import { AuroraBackground } from "@/components/brand/AuroraBackground";
import { formatNumber } from "@/lib/utils/format";

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

export default async function HomePage() {
  const stats = await loadStats();
  const tiles: Array<{ label: string; value: number | undefined }> = [
    { label: "Entities", value: stats.entities },
    { label: "Contracts", value: stats.contracts },
    { label: "Policies tracked", value: stats.policies },
    { label: "Archive articles", value: stats.archive },
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
          A searchable dataset of who is doing AI work in Alaska — the
          contracts, the policy, the infrastructure, and the content that
          surrounds it all. Updated daily.
        </p>

        <div className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-border-soft)] md:grid-cols-4">
          {tiles.map((tile) => (
            <div
              key={tile.label}
              className="bg-[var(--color-surface)] px-4 py-6"
            >
              <p className="font-mono text-2xl text-[var(--color-text-primary)]">
                {formatNumber(tile.value ?? 0)}
              </p>
              <p className="label-eyebrow mt-2">{tile.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center gap-3">
          <span className="label-eyebrow">Network coming online</span>
          <p className="max-w-md text-sm text-[var(--color-text-tertiary)]">
            The relationship graph will render here once the entity and
            relationship-inference routines have run their first cycle.
          </p>
        </div>
      </div>
    </section>
  );
}
