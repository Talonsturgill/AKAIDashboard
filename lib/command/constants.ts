export const STATUS_COLORS: Record<string, string> = {
  operational: "#22d3ee",
  proposed: "#fbbf24",
  construction: "#38bdf8",
  permitting: "#a78bfa",
};

export const STATUS_COLORS_RGBA: Record<string, [number, number, number, number]> = {
  operational: [34, 211, 238, 200],
  proposed: [251, 191, 36, 200],
  construction: [56, 189, 248, 200],
  permitting: [167, 139, 250, 200],
};

export function markerColor(status: string | null): string {
  return STATUS_COLORS[status ?? ""] ?? "#94a3b8";
}

export const MILITARY_KEYWORDS = ["JBER", "Eielson", "Clear"] as const;

export function isMilitary(name: string): boolean {
  return MILITARY_KEYWORDS.some((kw) => name.includes(kw));
}

export const FIBER_ROUTES: {
  id: string;
  positions: [number, number][];
  weight: number;
}[] = [
  {
    id: "quintillion",
    weight: 2.5,
    positions: [
      [64.5, -165.41],
      [66.9, -162.6],
      [68.35, -166.81],
      [70.65, -160.04],
      [71.29, -156.79],
      [70.32, -148.4],
    ],
  },
  {
    id: "alcan",
    weight: 2.5,
    positions: [
      [64.75, -147.35],
      [64.04, -145.73],
      [63.34, -142.99],
      [62.38, -140.87],
    ],
  },
  { id: "airraq-bethel",    weight: 2, positions: [[59.04, -158.46], [60.79, -161.76]] },
  { id: "airraq-platinum",  weight: 2, positions: [[59.04, -158.46], [59.01, -161.82]] },
  { id: "airraq-eek",       weight: 2, positions: [[59.04, -158.46], [60.22, -162.02]] },
  { id: "airraq-quinhagak", weight: 2, positions: [[59.04, -158.46], [59.75, -161.92]] },
  { id: "airraq-togiak",    weight: 2, positions: [[59.04, -158.46], [59.06, -160.39]] },
];

export const AIRRAQ_HUB: [number, number] = [59.04, -158.46];

export const AIRRAQ_BRANCHES: [number, number][] = [
  [60.79, -161.76],
  [59.01, -161.82],
  [60.22, -162.02],
  [59.75, -161.92],
  [59.06, -160.39],
];

export const MILITARY_RINGS: {
  id: string;
  center: [number, number];
  radius: number;
}[] = [
  { id: "jber",    center: [61.3,  -149.71], radius: 50000 },
  { id: "eielson", center: [64.66, -147.05], radius: 50000 },
  { id: "clear",   center: [64.29, -149.17], radius: 50000 },
];

export const STATUS_LEGEND = [
  { status: "operational", label: "OPERATIONAL", color: "#22d3ee" },
  { status: "proposed",    label: "PROPOSED",    color: "#fbbf24" },
  { status: "construction",label: "CONSTRUCTION",color: "#38bdf8" },
  { status: "permitting",  label: "PERMITTING",  color: "#a78bfa" },
] as const;
