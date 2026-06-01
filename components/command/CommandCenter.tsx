"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import type L from "leaflet";
import DetailPanel from "./DetailPanel";
import LayerToggles, { type LayerKey } from "./LayerToggles";
import IntelOverlayToggles, { type IntelKey } from "./IntelOverlayToggles";
import CoordinateHud from "./CoordinateHud";
import KpiBar from "./KpiBar";
import type { InfraProject, EntityRow, ContractRow, ArchiveRow, FiberRoute } from "@/lib/command/types";
import { STATUS_LEGEND } from "@/lib/command/constants";

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
  fiberRoutes: FiberRoute[];
  totalComputeMw: number;
  totalFiberTbps: number;
  totalCapex: number;
};

const ALL_LAYERS: LayerKey[] = ["data_center", "fiber", "power", "military"];

export default function CommandCenter({
  projects,
  entities,
  contracts,
  articles,
  fiberRoutes,
  totalComputeMw,
  totalFiberTbps,
  totalCapex,
}: CommandCenterProps) {
  const [activeLayers, setActiveLayers] = useState<Set<LayerKey>>(
    new Set(ALL_LAYERS),
  );
  const [activeIntel, setActiveIntel] = useState<Set<IntelKey>>(new Set());
  const leafletMapRef = useRef<L.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
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

  const handleIntelToggle = useCallback((key: IntelKey) => {
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

  const handleMapReady = useCallback((map: L.Map) => {
    leafletMapRef.current = map;
    setMapReady(true);
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
      <KpiBar
        totalComputeMw={totalComputeMw}
        totalFiberTbps={totalFiberTbps}
        totalCapex={totalCapex}
      />

      <div
        className="relative flex-1 overflow-hidden"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,0.04) 39px,rgba(255,255,255,0.04) 40px)," +
            "repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,0.04) 39px,rgba(255,255,255,0.04) 40px)",
        }}
      >
        <div className="absolute inset-0">
          <LeafletMap
            projects={projects}
            fiberRoutes={fiberRoutes}
            activeLayers={activeLayers}
            onMarkerClick={handleMarkerClick}
            onCoordsChange={handleCoordsChange}
            selectedProjectId={selectedProject?.id ?? null}
            onMapReady={handleMapReady}
          />
          {mapReady && (
            <DeckOverlayDynamic
              map={leafletMapRef.current}
              layers={activeIntel}
              projects={projects}
              entities={entities}
              contracts={contracts}
            />
          )}
        </div>

        <div className="absolute right-4 top-4 z-[1100] flex max-h-[calc(100vh-7rem)] flex-col gap-3 overflow-y-auto rounded border border-[var(--color-border-soft)] bg-[var(--color-background)]/85 p-3 backdrop-blur-sm">
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

          <LayerToggles activeLayers={activeLayers} onToggle={handleToggle} />

          <div className="h-px bg-[var(--color-border-soft)]" />

          <IntelOverlayToggles
            activeIntel={activeIntel}
            onToggle={handleIntelToggle}
          />
        </div>

        <div className="absolute bottom-4 left-4 z-[1100]">
          <CoordinateHud lat={hoverCoords.lat} lon={hoverCoords.lon} />
        </div>

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
