"use client";

export type LayerKey = "data_center" | "fiber" | "power" | "military";

type LayerToggleProps = {
  activeLayers: Set<LayerKey>;
  onToggle: (layer: LayerKey) => void;
};

const LAYERS: { key: LayerKey; label: string; color: string; activeGlow: string }[] = [
  {
    key: "data_center",
    label: "DATA CENTER",
    color: "border-violet-500/60 text-violet-300",
    activeGlow: "border-violet-400 text-violet-200 [box-shadow:0_0_10px_hsl(258_90%_66%/0.4),inset_0_0_6px_hsl(258_90%_66%/0.1)]",
  },
  {
    key: "fiber",
    label: "FIBER",
    color: "border-cyan-500/60 text-cyan-300",
    activeGlow: "border-cyan-400 text-cyan-200 [box-shadow:0_0_10px_hsl(189_94%_43%/0.5),inset_0_0_6px_hsl(189_94%_43%/0.1)]",
  },
  {
    key: "power",
    label: "POWER",
    color: "border-emerald-500/60 text-emerald-300",
    activeGlow: "border-emerald-400 text-emerald-200 [box-shadow:0_0_10px_hsl(158_64%_39%/0.5),inset_0_0_6px_hsl(158_64%_39%/0.1)]",
  },
  {
    key: "military",
    label: "MILITARY",
    color: "border-purple-500/60 text-purple-300",
    activeGlow: "border-purple-400 text-purple-200 [box-shadow:0_0_10px_hsl(258_90%_66%/0.45),inset_0_0_6px_hsl(258_90%_66%/0.1)]",
  },
];

export default function LayerToggles({ activeLayers, onToggle }: LayerToggleProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="label-eyebrow mb-1 text-[9px] tracking-[0.16em]">LAYERS</span>
      {LAYERS.map(({ key, label, color, activeGlow }) => {
        const isActive = activeLayers.has(key);
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className={`rounded border px-3 py-1.5 font-mono text-[10px] font-semibold tracking-widest transition-all duration-200 ${
              isActive
                ? activeGlow
                : `${color} opacity-40 hover:opacity-60`
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
