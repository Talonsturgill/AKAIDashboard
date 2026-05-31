import { createClient } from "@/lib/supabase/server";
import CommandCenter from "@/components/command/CommandCenter";
import type { InfraProject, EntityRow, ContractRow, ArchiveRow } from "@/components/command/DetailPanel";

export const revalidate = 300;

export const metadata = {
  title: "Command Center | Alaska.AI",
  description:
    "Real-time infrastructure command view for the Alaska AI ecosystem. Fiber networks, data centers, power assets, and defense sites.",
};

// Raw row type that mirrors the DB schema (latitude/longitude nullable)
type RawInfraRow = Omit<InfraProject, "latitude" | "longitude" | "metadata"> & {
  latitude: number | null;
  longitude: number | null;
  metadata: Record<string, unknown> | null;
};

export default async function CommandPage() {
  const supabase = await createClient();

  // All four fetches are independent — run in parallel
  const [
    { data: rawProjectsData },
    { data: rawEntities },
    { data: rawContracts },
    { data: rawArticles },
  ] = await Promise.all([
    supabase
      .from("infrastructure_projects")
      .select(
        "id,name,project_type,operator_entity_id,latitude,longitude,location_name,capacity_metric,capacity_value,status,announced_date,operational_date,estimated_cost,source_urls,metadata",
      )
      .not("latitude", "is", null)
      .not("longitude", "is", null),
    supabase
      .from("entities")
      .select("id,name,slug,type")
      .returns<EntityRow[]>(),
    supabase
      .from("contracts")
      .select("id,title,contract_value,status,awarding_entity_id,winning_entity_id")
      .returns<ContractRow[]>(),
    supabase
      .from("archive_content")
      .select("id,title,source_url")
      .returns<ArchiveRow[]>(),
  ]);

  const rawProjects = (rawProjectsData ?? []) as RawInfraRow[];

  // Filter to rows that actually have coordinates (narrowing for TS)
  const projects: InfraProject[] = rawProjects
    .filter(
      (p): p is RawInfraRow & { latitude: number; longitude: number } =>
        p.latitude !== null && p.longitude !== null,
    )
    .map((p) => ({
      id: p.id,
      name: p.name,
      project_type: p.project_type,
      operator_entity_id: p.operator_entity_id,
      latitude: p.latitude,
      longitude: p.longitude,
      location_name: p.location_name,
      capacity_metric: p.capacity_metric,
      capacity_value: p.capacity_value,
      status: p.status,
      announced_date: p.announced_date,
      operational_date: p.operational_date,
      estimated_cost: p.estimated_cost,
      source_urls: p.source_urls,
      metadata: p.metadata,
    }));

  const entities: EntityRow[] = rawEntities ?? [];
  const contracts: ContractRow[] = rawContracts ?? [];
  const articles: ArchiveRow[] = rawArticles ?? [];

  // ── KPI aggregates ───────────────────────────────────────────────────────────
  const totalComputeMw = projects
    .filter((p) => p.capacity_metric === "MW" && p.capacity_value !== null)
    .reduce((sum, p) => sum + (p.capacity_value ?? 0), 0);

  const totalFiberTbps = projects
    .filter((p) => p.capacity_metric === "Tbps" && p.capacity_value !== null)
    .reduce((sum, p) => sum + (p.capacity_value ?? 0), 0);

  const totalCapex = projects
    .filter((p) => p.estimated_cost !== null)
    .reduce((sum, p) => sum + (p.estimated_cost ?? 0), 0);

  return (
    <div
      className="fixed inset-0 top-[var(--nav-height,56px)] bg-[var(--color-background)]"
      style={{ contain: "layout" }}
    >
      <CommandCenter
        projects={projects}
        entities={entities}
        contracts={contracts}
        articles={articles}
        totalComputeMw={totalComputeMw}
        totalFiberTbps={totalFiberTbps}
        totalCapex={totalCapex}
      />
    </div>
  );
}
