type StatusBadgeProps = {
  status: string;
};

const STATUS_MAP: Record<
  string,
  { label: string; bg: string; text: string; ring: string }
> = {
  operational: {
    label: "OPERATIONAL",
    bg: "bg-cyan-950/60",
    text: "text-cyan-300",
    ring: "ring-cyan-500/40",
  },
  proposed: {
    label: "PROPOSED",
    bg: "bg-amber-950/60",
    text: "text-amber-300",
    ring: "ring-amber-500/40",
  },
  construction: {
    label: "CONSTRUCTION",
    bg: "bg-sky-950/60",
    text: "text-sky-300",
    ring: "ring-sky-500/40",
  },
  permitting: {
    label: "PERMITTING",
    bg: "bg-violet-950/60",
    text: "text-violet-300",
    ring: "ring-violet-500/40",
  },
};

const FALLBACK = {
  label: "UNKNOWN",
  bg: "bg-neutral-900/60",
  text: "text-neutral-400",
  ring: "ring-neutral-600/40",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_MAP[status.toLowerCase()] ?? FALLBACK;
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-xs font-semibold tracking-widest ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}
    >
      {cfg.label}
    </span>
  );
}
