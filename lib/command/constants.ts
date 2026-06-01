// Visual constants for the /command map that are stable enough to live in code
// (status color palette, legend ordering). Everything that could grow with new
// data — fiber routes, territory rings, entity HQ coordinates — moved to the
// database in migration 0014_data_driven_map.sql.

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

// Name fragments that classify an infrastructure_projects row as belonging to
// the "military" layer toggle. This is purely a UI filter for marker
// visibility, separate from whether a project gets a visual territory ring
// (which is now controlled by infrastructure_projects.display_radius_km).
export const MILITARY_KEYWORDS = ["JBER", "Eielson", "Clear"] as const;

export function isMilitary(name: string): boolean {
  return MILITARY_KEYWORDS.some((kw) => name.includes(kw));
}

export const STATUS_LEGEND = [
  { status: "operational", label: "OPERATIONAL", color: "#22d3ee" },
  { status: "proposed",    label: "PROPOSED",    color: "#fbbf24" },
  { status: "construction",label: "CONSTRUCTION",color: "#38bdf8" },
  { status: "permitting",  label: "PERMITTING",  color: "#a78bfa" },
] as const;
