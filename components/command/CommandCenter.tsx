"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import type L from "leaflet";
import DetailPanel from "./DetailPanel";
import LayerToggles, { type LayerKey } from "./LayerToggles";
import IntelOverlayToggles from "./IntelOverlayToggles";
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

// DeckOverlay is also client-only (WebGL + Leaflet DOM access)
const DeckOverlayDynamic = dynamic(() => import("./DeckOverlay"), {
  ssr: false,
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

// Leaflet stores its Map instance on the container element under this key at runtime.
// This is a well-known community pattern; one `any` cast is acceptable per project rules.
type LeafletContainerEl = HTMLElement & { _leaflet_map?: L.Map };

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
  const [activeIntel, setActiveIntel] = useState<Set<string>>(new Set());
  const [leafletMap, setLeafletMap] = useState<L.Map | null>(null);
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

  const handleIntelToggle = useCallback((key: string) => {
    setActiveIntel((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Poll for the Leaflet map instance after the dynamic component has mounted.
  // Leaflet attaches itself to the container element; we read it here once ready.
  useEffect(() => {
    let rafId: number;
    let attempts = 0;
    const MAX_ATTEMPTS = 200; // ~4 seconds at 60fps

    function poll() {
      attempts++;
      const el = document.querySelector(
        ".leaflet-container"
      ) as LeafletContainerEl | null;
      const map = el?._leaflet_map ?? null;
      if (map) {
        setLeafletMap(map);
        return;
      }
      if (attempts < MAX_ATTEMPTS) {
        rafId = requestAnimationFrame(poll);
      }
    }

    rafId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(rafId);
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
          {/* deck.gl WebGL overlay synced to Leaflet viewport */}
          <DeckOverlayDynamic
            map={leafletMap}
            layers={activeIntel}
            projects={projects}
            entities={entities}
            contracts={contracts}
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

          <div className="h-px bg-[var(--color-border-soft)]" />

          {/* Intel overlay toggles (all off by default) */}
          <IntelOverlayToggles
            activeIntel={activeIntel}
            onToggle={handleIntelToggle}
          />
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
