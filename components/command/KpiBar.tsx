import { formatCurrency } from "@/lib/utils/format";

type KpiBarProps = {
  totalComputeMw: number;
  totalFiberTbps: number;
  totalCapex: number;
};

function KpiItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-6 py-3">
      <span className="label-eyebrow text-[10px] tracking-[0.14em] text-[var(--color-text-tertiary)]">
        {label}
      </span>
      <span className="font-mono text-xl font-semibold tracking-tight text-[var(--color-aurora-cyan)] [text-shadow:0_0_12px_hsl(189_94%_43%/0.6)]">
        {value}
      </span>
    </div>
  );
}

export default function KpiBar({
  totalComputeMw,
  totalFiberTbps,
  totalCapex,
}: KpiBarProps) {
  const computeLabel = `${totalComputeMw.toLocaleString("en-US")} MW`;
  const fiberLabel = `${totalFiberTbps.toFixed(1)} Tbps`;
  const capexLabel = formatCurrency(totalCapex);

  return (
    <div className="flex items-stretch border-b border-[var(--color-border-soft)] bg-[var(--color-background)]/95 backdrop-blur-sm">
      <div className="flex items-center gap-px">
        <KpiItem label="TOTAL COMPUTE" value={computeLabel} />
        <div className="h-10 w-px bg-[var(--color-border-soft)]" />
        <KpiItem label="TOTAL FIBER" value={fiberLabel} />
        <div className="h-10 w-px bg-[var(--color-border-soft)]" />
        <KpiItem label="TOTAL CAPEX" value={capexLabel} />
      </div>
      <div className="ml-auto flex items-center px-6">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)]">
          ALASKA AI INFRASTRUCTURE
        </span>
      </div>
    </div>
  );
}
