"use client";

export type IntelKey = "ARCS" | "COLUMNS" | "HEAT";

type IntelOverlayTogglesProps = {
  activeIntel: Set<IntelKey>;
  onToggle: (k: IntelKey) => void;
};

const INTEL_LAYERS: {
  key: IntelKey;
  label: string;
  color: string;
  activeGlow: string;
}[] = [
  {
    key: "ARCS",
    label: "ARCS",
    color: "border-cyan-500/60 text-cyan-300",
    activeGlow:
      "border-cyan-400 text-cyan-200 [box-shadow:0_0_10px_hsl(189_94%_43%/0.5),inset_0_0_6px_hsl(189_94%_43%/0.1)]",
  },
  {
    key: "COLUMNS",
    label: "COLUMNS",
    color: "border-amber-500/60 text-amber-300",
    activeGlow:
      "border-amber-400 text-amber-200 [box-shadow:0_0_10px_hsl(38_92%_50%/0.5),inset_0_0_6px_hsl(38_92%_50%/0.1)]",
  },
  {
    key: "HEAT",
    label: "HEAT",
    color: "border-rose-500/60 text-rose-300",
    activeGlow:
      "border-rose-400 text-rose-200 [box-shadow:0_0_10px_hsl(351_83%_53%/0.5),inset_0_0_6px_hsl(351_83%_53%/0.1)]",
  },
];

export default function IntelOverlayToggles({
  activeIntel,
  onToggle,
}: IntelOverlayTogglesProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="label-eyebrow mb-1 text-[9px] tracking-[0.16em]">
        INTEL OVERLAYS
      </span>
      {INTEL_LAYERS.map(({ key, label, color, activeGlow }) => {
        const isActive = activeIntel.has(key);
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className={`rounded border px-3 py-1.5 font-mono text-[10px] font-semibold tracking-widest transition-all duration-200 ${
              isActive ? activeGlow : `${color} opacity-40 hover:opacity-60`
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
