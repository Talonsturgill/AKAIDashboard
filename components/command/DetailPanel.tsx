"use client";

import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { formatCurrency, formatNumber } from "@/lib/utils/format";

export type InfraProject = {
  id: string;
  name: string;
  project_type: string | null;
  operator_entity_id: string | null;
  latitude: number;
  longitude: number;
  location_name: string | null;
  capacity_metric: string | null;
  capacity_value: number | null;
  status: string | null;
  announced_date: string | null;
  operational_date: string | null;
  estimated_cost: number | null;
  source_urls: string[] | null;
  metadata: Record<string, unknown> | null;
};

export type EntityRow = {
  id: string;
  name: string;
  slug: string | null;
  type: string;
};

export type ContractRow = {
  id: string;
  title: string;
  contract_value: number | null;
  status: string | null;
  awarding_entity_id: string | null;
  winning_entity_id: string | null;
};

export type ArchiveRow = {
  id: string;
  title: string;
  source_url: string;
};

type DetailPanelProps = {
  project: InfraProject | null;
  entities: EntityRow[];
  contracts: ContractRow[];
  articles: ArchiveRow[];
  onClose: () => void;
};

// Keyword map for archive article relevance matching
const PROJECT_KEYWORDS: Record<string, string[]> = {
  quintillion: ["quintillion"],
  alcan: ["alcan", "alcyone"],
  stak: ["stak", "dalton", "hpc"],
  jber: ["jber", "joint base"],
  eielson: ["eielson"],
  airraq: ["airraq"],
  fish: ["fish", "cordova", "seward", "seak"],
  bradley: ["bradley", "hydroelectric"],
  clear: ["clear space", "clear sfs"],
};

function getKeywords(projectName: string): string[] {
  const lower = projectName.toLowerCase();
  for (const [key, kws] of Object.entries(PROJECT_KEYWORDS)) {
    if (lower.includes(key)) return kws;
  }
  // Fallback: first meaningful word
  const word = lower.split(/\s+/).find((w) => w.length > 4) ?? lower.slice(0, 8);
  return [word];
}

function typeLabel(t: string | null): string {
  switch (t) {
    case "data_center": return "DATA CENTER";
    case "fiber": return "FIBER";
    case "power": return "POWER";
    default: return (t ?? "INFRASTRUCTURE").toUpperCase();
  }
}

export default function DetailPanel({
  project,
  entities,
  contracts,
  articles,
  onClose,
}: DetailPanelProps) {
  const isOpen = project !== null;

  if (!isOpen) {
    return (
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[480px] translate-x-full transition-transform duration-300 ease-in-out"
        aria-hidden="true"
      />
    );
  }

  const operator = entities.find((e) => e.id === project.operator_entity_id);

  const relatedContracts = contracts
    .filter(
      (c) =>
        c.awarding_entity_id === project.operator_entity_id ||
        c.winning_entity_id === project.operator_entity_id,
    )
    .slice(0, 5);

  const keywords = getKeywords(project.name);
  const relatedArticles = articles
    .filter((a) =>
      keywords.some((kw) => a.title.toLowerCase().includes(kw)),
    )
    .slice(0, 3);

  const hasCapacity =
    project.capacity_value !== null && project.capacity_metric !== null;

  return (
    <div
      className="absolute inset-y-0 right-0 z-[1500] w-[480px] translate-x-0 transition-transform duration-300 ease-in-out"
    >
      {/* Glass background */}
      <div className="relative flex h-full flex-col overflow-y-auto border-l border-[var(--color-border-soft)] bg-[var(--color-background)]/95 backdrop-blur-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[var(--color-border-soft)] bg-[var(--color-background)]/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex flex-col gap-2 pr-8">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-tertiary)]">
                {typeLabel(project.project_type)}
              </span>
              {project.status && <StatusBadge status={project.status} />}
            </div>
            <h2 className="font-display text-lg font-semibold leading-tight text-[var(--color-text-primary)]">
              {project.name}
            </h2>
            {project.location_name && (
              <p className="font-mono text-xs text-[var(--color-text-tertiary)]">
                {project.location_name}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded border border-[var(--color-border-soft)] font-mono text-sm text-[var(--color-text-tertiary)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
            aria-label="Close panel"
          >
            X
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-6 px-6 py-5">
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3">
            {hasCapacity && (
              <div className="rounded border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3">
                <p className="label-eyebrow mb-1 text-[9px]">CAPACITY</p>
                <p className="font-mono text-sm font-semibold text-[var(--color-aurora-cyan)]">
                  {formatNumber(project.capacity_value)}{" "}
                  <span className="text-[var(--color-text-tertiary)]">
                    {project.capacity_metric}
                  </span>
                </p>
              </div>
            )}
            {project.estimated_cost !== null && (
              <div className="rounded border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3">
                <p className="label-eyebrow mb-1 text-[9px]">EST COST</p>
                <p className="font-mono text-sm font-semibold text-[var(--color-aurora-cyan)]">
                  {formatCurrency(project.estimated_cost)}
                </p>
              </div>
            )}
            <div className="rounded border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3">
              <p className="label-eyebrow mb-1 text-[9px]">COORDINATES</p>
              <p className="font-mono text-xs text-[var(--color-text-secondary)]">
                {project.latitude.toFixed(4)}, {project.longitude.toFixed(4)}
              </p>
            </div>
          </div>

          {/* Operator */}
          {operator && (
            <div>
              <p className="label-eyebrow mb-2 text-[9px]">OPERATOR</p>
              <Link
                href={`/companies/${operator.id}`}
                className="group inline-flex items-center gap-1.5 font-mono text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-aurora-cyan)]"
              >
                {operator.name}
                <span className="text-[var(--color-text-tertiary)] transition-colors group-hover:text-[var(--color-aurora-cyan)]">
                  →
                </span>
              </Link>
            </div>
          )}

          {/* Related contracts */}
          {relatedContracts.length > 0 && (
            <div>
              <p className="label-eyebrow mb-2 text-[9px]">
                RELATED CONTRACTS
              </p>
              <ul className="flex flex-col gap-1.5">
                {relatedContracts.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/contracts/${c.id}`}
                      className="group flex items-center justify-between rounded border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 transition-colors hover:border-[var(--color-border-strong)]"
                    >
                      <span className="line-clamp-1 text-xs text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]">
                        {c.title}
                      </span>
                      {c.contract_value !== null && (
                        <span className="ml-3 shrink-0 font-mono text-xs text-[var(--color-text-tertiary)]">
                          {formatCurrency(c.contract_value)}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related articles */}
          {relatedArticles.length > 0 && (
            <div>
              <p className="label-eyebrow mb-2 text-[9px]">RELATED INTEL</p>
              <ul className="flex flex-col gap-1.5">
                {relatedArticles.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/archive/${a.id}`}
                      className="group flex items-center gap-2 rounded border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 transition-colors hover:border-[var(--color-border-strong)]"
                    >
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        ARC
                      </span>
                      <span className="line-clamp-1 text-xs text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]">
                        {a.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Source links */}
          {project.source_urls && project.source_urls.length > 0 && (
            <div>
              <p className="label-eyebrow mb-2 text-[9px]">SOURCES</p>
              <ul className="flex flex-col gap-1">
                {project.source_urls.map((url, i) => (
                  <li key={i}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[10px] text-[var(--color-text-tertiary)] underline underline-offset-2 hover:text-[var(--color-aurora-cyan)]"
                    >
                      {url.replace(/^https?:\/\//, "").slice(0, 60)}
                      {url.replace(/^https?:\/\//, "").length > 60 ? "…" : ""}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
