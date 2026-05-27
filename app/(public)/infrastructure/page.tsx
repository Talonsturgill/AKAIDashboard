import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import InfraMap from "@/components/infrastructure/InfraMap";

export const revalidate = 60;

type InfraRow = {
  id: string;
  name: string;
  project_type: string | null;
  location_name: string | null;
  status: string | null;
  estimated_cost: number | null;
  capacity_value: number | null;
  capacity_metric: string | null;
  announced_date: string | null;
  latitude: number | null;
  longitude: number | null;
};

type ProjectType =
  | "data_center"
  | "fiber"
  | "broadband"
  | "power"
  | "compute"
  | "satellite"
  | "other";

const TYPE_LABELS: Record<ProjectType, string> = {
  data_center: "Data Center",
  fiber: "Fiber",
  broadband: "Broadband",
  power: "Power",
  compute: "Compute",
  satellite: "Satellite",
  other: "Other",
};

const TYPE_STYLES: Record<ProjectType, string> = {
  data_center:
    "bg-[hsl(258_90%_66%/0.12)] text-[var(--color-aurora-purple)] border-[hsl(258_90%_66%/0.3)]",
  fiber: "bg-[hsl(189_94%_43%/0.12)] text-[var(--color-aurora-cyan)] border-[hsl(189_94%_43%/0.3)]",
  broadband:
    "bg-[hsl(189_94%_43%/0.08)] text-[var(--color-aurora-cyan)] border-[hsl(189_94%_43%/0.2)]",
  power:
    "bg-[hsl(330_81%_60%/0.12)] text-[var(--color-aurora-magenta)] border-[hsl(330_81%_60%/0.3)]",
  compute:
    "bg-[hsl(258_90%_66%/0.08)] text-[var(--color-aurora-purple)] border-[hsl(258_90%_66%/0.2)]",
  satellite:
    "bg-[hsl(158_64%_39%/0.15)] text-[var(--color-aurora-green)] border-[hsl(158_64%_39%/0.3)]",
  other:
    "bg-[hsl(220_6%_47%/0.12)] text-[var(--color-text-tertiary)] border-[var(--color-border-soft)]",
};

function TypeBadge({ type }: { type: string | null }) {
  if (!type) return null;
  const key = type as ProjectType;
  const label = TYPE_LABELS[key] ?? type;
  const style =
    TYPE_STYLES[key] ??
    "bg-[hsl(220_6%_47%/0.12)] text-[var(--color-text-tertiary)] border-[var(--color-border-soft)]";
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${style}`}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const statusMap: Record<string, string> = {
    planned: "Planned",
    announced: "Announced",
    construction: "Under Construction",
    operational: "Operational",
    cancelled: "Cancelled",
  };
  return (
    <span className="inline-flex items-center rounded border border-[var(--color-border-soft)] bg-[var(--color-surface-elevated)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
      {statusMap[status] ?? status}
    </span>
  );
}

export default async function InfrastructureIndexPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("infrastructure_projects")
    .select(
      "id,name,project_type,location_name,status,estimated_cost,capacity_value,capacity_metric,announced_date,latitude,longitude",
    )
    .order("name", { ascending: true })
    .returns<InfraRow[]>();

  const projects = data ?? [];

  const mapProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    latitude: p.latitude,
    longitude: p.longitude,
    project_type: p.project_type,
    location_name: p.location_name,
  }));

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

  return (
    <section className="mx-auto max-w-[1240px] px-6 py-12">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="label-eyebrow mb-2">Infrastructure</p>
          <h1 className="font-display text-4xl font-light tracking-tight">
            Alaska AI infrastructure map
          </h1>
        </div>
        {projects.length > 0 && (
          <span className="font-mono text-sm text-[var(--color-text-tertiary)]">
            {projects.length.toLocaleString()} project
            {projects.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="mb-10">
        <InfraMap projects={mapProjects} mapboxToken={mapboxToken} />
      </div>

      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-3">
          {projects.map((project) => (
            <li
              key={project.id}
              className="group rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-border-strong)]"
            >
              <Link href={`/infrastructure/${project.id}`} className="block">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                  <TypeBadge type={project.project_type} />
                  <StatusBadge status={project.status} />
                  {project.announced_date && (
                    <span className="text-[var(--color-text-tertiary)]">
                      {formatDate(project.announced_date)}
                    </span>
                  )}
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-medium text-[var(--color-text-primary)] group-hover:aurora-gradient-text">
                      {project.name}
                    </h2>
                    {project.location_name && (
                      <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                        {project.location_name}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    {project.estimated_cost !== null && (
                      <span className="font-mono text-sm text-[var(--color-text-secondary)]">
                        {formatCurrency(project.estimated_cost)}
                      </span>
                    )}
                    {project.capacity_value !== null &&
                      project.capacity_metric && (
                        <p className="font-mono text-xs text-[var(--color-text-tertiary)]">
                          {project.capacity_value} {project.capacity_metric}
                        </p>
                      )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-12 text-center">
      <p className="label-eyebrow mb-3">No projects yet</p>
      <p className="text-sm text-[var(--color-text-secondary)]">
        Infrastructure projects will appear here as the routines surface data
        centers, fiber, and power projects.
      </p>
      <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
        See{" "}
        <code className="font-mono">routines/README.md</code> for the schedule
        and dependency order.
      </p>
    </div>
  );
}
