"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import DetailPanel from "./DetailPanel";
import LayerToggles, { type LayerKey } from "./LayerToggles";
import CoordinateHud from "./CoordinateHud";
import KpiBar from "./KpiBar";
import type { InfraProject, EntityRow, ContractRow, ArchiveRow } from "./DetailPanel";

// LeafletMap is client-only. Leaflet touches window/document at module load
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[var(--color-background)]" />
  ),
});

type CommandCenterProps = {
  projects: InfraProject[];
  entities: EntityRow[];
  contracts: ContractRow[];
  articles: ArchiveRow[];
  totalComputeMw: number;
  totalFiberTbps: number;
  totalCapex: number;
};

const ALL_LAYERS: LayerKey[] = ["data_center", "fiber", "power", "military"];

const STATUS_LEGEND = [
  { status: "operational", label: "OPERATIONAL", color: "#22d3ee" },
  { status: "proposed", label: "PROPOSED", color: "#fbbf24" },
  { status: "construction", label: "CONSTRUCTION", color: "#38bdf8" },
  { status: "permitting", label: "PERMITTING", color: "#a78bfa" },
] as const;

export default function CommandCenter({
  projects,
  entities,
  contracts,
  articles,
  totalComputeMw,
  totalFiberTbps,
  totalCapex,
}: CommandCenterProps) {
  const [activeLayers, setActiveLayers] = useState<Set<LayerKey>>(
    new Set(ALL_LAYERS),
  );
  const [selectedProject, setSelectedProject] = useState<InfraProject | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{
    lat: number | null;
    lon: number | null;
  }>({ lat: null, lon: null });

  const handleToggle = useCallback((layer: LayerKey) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) {
        next.delete(layer);
      } else {
        next.add(layer);
      }
      return next;
    });
  }, []);

  const handleMarkerClick = useCallback((project: InfraProject) => {
    setSelectedProject((prev) => (prev?.id === project.id ? null : project));
  }, []);

  const handleCoordsChange = useCallback((lat: number, lon: number) => {
    setHoverCoords({ lat, lon });
  }, []);

  const handleClose = useCallback(() => {
    setSelectedProject(null);
  }, []);

  return (
    <div className="flex h-full flex-col bg-[var(--color-background)]">
      {/* KPI strip */}
      <KpiBar
        totalComputeMw={totalComputeMw}
        totalFiberTbps={totalFiberTbps}
        totalCapex={totalCapex}
      />

      {/* Map area */}
      <div
        className="relative flex-1 overflow-hidden"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,0.04) 39px,rgba(255,255,255,0.04) 40px)," +
            "repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,0.04) 39px,rgba(255,255,255,0.04) 40px)",
        }}
      >
        {/* Full-bleed Leaflet map */}
        <div className="absolute inset-0">
          <LeafletMap
            projects={projects}
            activeLayers={activeLayers}
            onMarkerClick={handleMarkerClick}
            onCoordsChange={handleCoordsChange}
            selectedProjectId={selectedProject?.id ?? null}
          />
        </div>

        {/* Top-right overlay panel: legend + layer toggles */}
        <div className="absolute right-4 top-4 z-[1100] flex flex-col gap-4 rounded border border-[var(--color-border-soft)] bg-[var(--color-background)]/85 p-4 backdrop-blur-sm">
          {/* Status legend */}
          <div className="flex flex-col gap-1.5">
            <span className="label-eyebrow mb-1 text-[9px] tracking-[0.16em]">STATUS</span>
            {STATUS_LEGEND.map(({ status, label, color }) => (
              <div key={status} className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 6px ${color}`,
                  }}
                />
                <span className="font-mono text-[10px] tracking-wider text-[var(--color-text-secondary)]">
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="h-px bg-[var(--color-border-soft)]" />

          {/* Layer toggles */}
          <LayerToggles activeLayers={activeLayers} onToggle={handleToggle} />
        </div>

        {/* Bottom-left coordinate HUD */}
        <div className="absolute bottom-4 left-4 z-[1100]">
          <CoordinateHud lat={hoverCoords.lat} lon={hoverCoords.lon} />
        </div>

        {/* Detail panel: positioned inside the map area */}
        <DetailPanel
          project={selectedProject}
          entities={entities}
          contracts={contracts}
          articles={articles}
          onClose={handleClose}
        />
      </div>
    </div>
  );
}
