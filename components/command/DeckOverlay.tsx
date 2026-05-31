"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { Deck } from "@deck.gl/core";
import type { MapViewState, Layer } from "@deck.gl/core";
import { ArcLayer, ColumnLayer } from "@deck.gl/layers";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import type { InfraProject, EntityRow, ContractRow } from "@/lib/command/types";
import type { IntelKey } from "./IntelOverlayToggles";
import { STATUS_COLORS_RGBA } from "@/lib/command/constants";

const FEDERAL_SOURCE: [number, number] = [-149.9, 61.2]; // Anchorage, as federal origin

// HQ coords for entities that win contracts but have no infrastructure_projects
// row pointing to them. Without these, most ARC entries would be dropped because
// the target endpoint could not be resolved.
const ENTITY_HQ_FALLBACK: Record<string, [number, number]> = {
  "nana-regional-corporation": [-149.9, 61.2],
  "doyon-limited": [-147.72, 64.84],
  "sealaska-corporation": [-134.42, 58.3],
  "chugach-alaska-corporation": [-149.9, 61.2],
  "calista-corporation": [-149.9, 61.2],
  "cook-inlet-region-inc": [-149.9, 61.2],
  "bering-straits-native-corporation": [-165.41, 64.5],
  "bristol-bay-native-corporation": [-149.9, 61.2],
  "the-aleut-corporation": [-149.9, 61.2],
  "koniag-inc": [-152.4, 57.79],
  "gci-communication-corp": [-149.9, 61.2],
  "alaska-communications-systems": [-149.9, 61.2],
  "matanuska-telecom-association": [-149.1, 61.6],
  "university-of-alaska-anchorage": [-149.83, 61.19],
  "university-of-alaska-fairbanks": [-147.85, 64.86],
  "university-of-alaska-southeast": [-134.42, 58.3],
  "alaska-pacific-university": [-149.81, 61.19],
  "alaska-industrial-development-and-export-authority": [-149.9, 61.2],
  "alaska-energy-authority": [-149.9, 61.2],
  "alaska-dcced": [-134.42, 58.3],
  "alaska-dot-pf": [-134.42, 58.3],
  "joint-base-elmendorf-richardson": [-149.71, 61.3],
  "eielson-air-force-base": [-147.05, 64.66],
  "noaa-alaska-regional-office": [-134.42, 58.3],
  "usgs-alaska-science-center": [-149.9, 61.2],
  "quintillion": [-149.9, 61.2],
  "alcan-one": [-147.35, 64.75],
  "alaska-federation-of-natives": [-149.9, 61.2],
  "cook-inlet-tribal-council": [-149.9, 61.2],
  "tanana-chiefs-conference": [-147.72, 64.84],
  "association-of-village-council-presidents": [-161.76, 60.79],
  "bristol-bay-native-association": [-158.46, 59.04],
  "alaska-bead-program": [-149.9, 61.2],
};

function entityLocation(
  entityId: string | null,
  entityMap: Map<string, EntityRow>,
  projectsByEntity: Map<string, InfraProject>,
): [number, number] | null {
  if (!entityId) return null;
  const entity = entityMap.get(entityId);
  if (!entity) return null;
  const project = projectsByEntity.get(entityId);
  if (project) return [project.longitude, project.latitude];
  const slug = entity.slug ?? "";
  return ENTITY_HQ_FALLBACK[slug] ?? null;
}

function logScale(value: number, min = 2, max = 16): number {
  if (value <= 0) return min;
  return min + (Math.log(value + 1) / Math.log(1e8)) * (max - min);
}

function statusColor(status: string | null): [number, number, number, number] {
  return STATUS_COLORS_RGBA[status ?? ""] ?? [148, 163, 184, 180];
}

type ArcDatum = {
  sourcePosition: [number, number];
  targetPosition: [number, number];
  width: number;
  contractTitle: string;
  contractValue: number | null;
  awardingName: string;
  winningName: string;
};

function buildArcData(
  contracts: ContractRow[],
  entities: EntityRow[],
  projects: InfraProject[]
): ArcDatum[] {
  const entityMap = new Map(entities.map((e) => [e.id, e]));
  const projectsByEntity = new Map<string, InfraProject>();
  for (const p of projects) {
    if (p.operator_entity_id) {
      projectsByEntity.set(p.operator_entity_id, p);
    }
  }

  const arcs: ArcDatum[] = [];
  for (const c of contracts) {
    const target = entityLocation(c.winning_entity_id, entityMap, projectsByEntity);
    if (!target) continue;
    const source =
      entityLocation(c.awarding_entity_id, entityMap, projectsByEntity) ?? FEDERAL_SOURCE;
    const winningEntity = c.winning_entity_id ? entityMap.get(c.winning_entity_id) : null;
    const awardingEntity = c.awarding_entity_id ? entityMap.get(c.awarding_entity_id) : null;

    arcs.push({
      sourcePosition: source,
      targetPosition: target,
      width: logScale(c.contract_value ?? 0),
      contractTitle: c.title,
      contractValue: c.contract_value,
      awardingName: awardingEntity?.name ?? "Federal grant",
      winningName: winningEntity?.name ?? "Unknown",
    });
  }
  return arcs;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type ColumnDatum = {
  position: [number, number];
  elevation: number;
  color: [number, number, number, number];
  name: string;
  status: string | null;
  capacityValue: number | null;
  capacityMetric: string | null;
};

function buildColumnData(projects: InfraProject[]): ColumnDatum[] {
  return projects
    .filter((p) => p.project_type === "data_center" && p.latitude && p.longitude)
    .map((p) => ({
      position: [p.longitude, p.latitude] as [number, number],
      elevation: Math.max((p.capacity_value ?? 1) * 800, 5000),
      color: statusColor(p.status),
      name: p.name,
      status: p.status,
      capacityValue: p.capacity_value,
      capacityMetric: p.capacity_metric,
    }));
}

type HeatPoint = { position: [number, number]; weight: number };

function buildHeatData(projects: InfraProject[]): HeatPoint[] {
  return projects
    .filter((p) => p.latitude && p.longitude)
    .map((p) => ({
      position: [p.longitude, p.latitude] as [number, number],
      weight: 1,
    }));
}

type DeckOverlayProps = {
  map: L.Map | null;
  layers: Set<IntelKey>;
  projects: InfraProject[];
  entities: EntityRow[];
  contracts: ContractRow[];
};

export default function DeckOverlay({
  map,
  layers,
  projects,
  entities,
  contracts,
}: DeckOverlayProps) {
  const deckRef = useRef<Deck | null>(null);

  useEffect(() => {
    if (!map) return;

    // Create a dedicated Leaflet pane at z-index 350 (between tile pane 200
    // and marker pane 600) so the deck canvas never blocks marker clicks.
    let pane = map.getPane("deckGlPane");
    if (!pane) {
      pane = map.createPane("deckGlPane");
    }
    (pane as HTMLElement).style.zIndex = "350";
    (pane as HTMLElement).style.pointerEvents = "none";

    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    (pane as HTMLElement).appendChild(canvas);

    function buildViewState(): MapViewState {
      const center = map!.getCenter();
      return {
        longitude: center.lng,
        latitude: center.lat,
        zoom: map!.getZoom() - 1, // deck.gl zoom is offset by 1 from Leaflet's zoom
        pitch: 45,
        bearing: 0,
      };
    }

    const mapContainer = map.getContainer();

    function syncViewport(): void {
      if (!deckRef.current) return;
      deckRef.current.setProps({ viewState: buildViewState() });
    }

    function resizeCanvas(): void {
      if (!deckRef.current) return;
      const { width: w, height: h } = mapContainer.getBoundingClientRect();
      deckRef.current.setProps({ width: w, height: h });
    }

    // Deck canvas has pointer-events:none (so Leaflet markers stay clickable),
    // which means deck.gl's built-in getTooltip cannot fire. We do hit-testing
    // manually via Leaflet's mousemove + Deck.pickObject and render our own
    // tooltip element appended to the map container.
    const tooltipEl = document.createElement("div");
    tooltipEl.dataset.deckTooltip = "true";
    tooltipEl.style.cssText =
      "position:absolute;pointer-events:none;z-index:1000;display:none;max-width:280px;font-family:ui-monospace,monospace;color:#e2e8f0;background:rgba(10,12,18,0.95);border-radius:4px;padding:8px 10px;box-shadow:0 4px 18px rgba(0,0,0,0.5);line-height:1.5;";
    mapContainer.appendChild(tooltipEl);

    function showTooltipForPick(e: L.LeafletMouseEvent): void {
      if (!deckRef.current) return;
      const rect = mapContainer.getBoundingClientRect();
      const x = e.originalEvent.clientX - rect.left;
      const y = e.originalEvent.clientY - rect.top;
      const picked = deckRef.current.pickObject({ x, y, radius: 6 });
      if (picked?.object && picked.layer) {
        const layerId = picked.layer.id;
        let html = "";
        let border = "rgba(255,255,255,0.2)";
        if (layerId === "intel-arcs") {
          const a = picked.object as ArcDatum;
          const dollars =
            a.contractValue !== null
              ? new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                }).format(a.contractValue)
              : "value not disclosed";
          html = `<div style="font-weight:600;color:#22d3ee;margin-bottom:6px;font-size:11px">${escapeHtml(a.contractTitle)}</div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em">VALUE</div><div style="font-size:11px;margin-bottom:4px">${dollars}</div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em">FLOW</div><div style="font-size:11px">${escapeHtml(a.awardingName)} <span style="color:#fbbf24">to</span> ${escapeHtml(a.winningName)}</div>`;
          border = "rgba(34,211,238,0.5)";
        } else if (layerId === "intel-columns") {
          const col = picked.object as ColumnDatum;
          const cap =
            col.capacityValue !== null
              ? `${col.capacityValue.toLocaleString()} ${col.capacityMetric ?? ""}`
              : "capacity not disclosed";
          html = `<div style="font-weight:600;color:#fbbf24;margin-bottom:6px;font-size:11px">${escapeHtml(col.name)}</div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em">STATUS</div><div style="font-size:11px;margin-bottom:4px">${escapeHtml(col.status ?? "unknown")}</div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em">CAPACITY</div><div style="font-size:11px">${cap}</div>`;
          border = "rgba(251,191,36,0.5)";
        }
        if (html) {
          tooltipEl.innerHTML = html;
          tooltipEl.style.border = `1px solid ${border}`;
          tooltipEl.style.left = `${x + 14}px`;
          tooltipEl.style.top = `${y + 14}px`;
          tooltipEl.style.display = "block";
          return;
        }
      }
      tooltipEl.style.display = "none";
    }

    function hideTooltip(): void {
      tooltipEl.style.display = "none";
    }

    // Defer Deck init until Leaflet has positioned its internal panes.
    // Without whenReady, map.getCenter() throws on _leaflet_pos before the
    // map's first layout pass completes.
    let cancelled = false;
    map.whenReady(() => {
      if (cancelled) return;
      const { width, height } = mapContainer.getBoundingClientRect();
      const deck = new Deck({
        canvas,
        width,
        height,
        controller: false,
        viewState: buildViewState(),
        layers: [],
      });
      deckRef.current = deck;
      map.on("move", syncViewport);
      map.on("zoom", syncViewport);
      map.on("resize", resizeCanvas);
      map.on("mousemove", showTooltipForPick);
      map.on("mouseout", hideTooltip);
    });

    return () => {
      cancelled = true;
      map.off("move", syncViewport);
      map.off("zoom", syncViewport);
      map.off("resize", resizeCanvas);
      map.off("mousemove", showTooltipForPick);
      map.off("mouseout", hideTooltip);
      if (deckRef.current) {
        deckRef.current.finalize();
        deckRef.current = null;
      }
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      if (tooltipEl.parentNode) {
        tooltipEl.parentNode.removeChild(tooltipEl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;

    const arcData = buildArcData(contracts, entities, projects);
    const columnData = buildColumnData(projects);
    const heatData = buildHeatData(projects);

    const activeLayers: Layer[] = [];

    if (layers.has("ARCS") && arcData.length > 0) {
      activeLayers.push(
        new ArcLayer<ArcDatum>({
          id: "intel-arcs",
          data: arcData,
          getSourcePosition: (d) => d.sourcePosition,
          getTargetPosition: (d) => d.targetPosition,
          getWidth: (d) => d.width,
          getSourceColor: [0, 255, 255, 180],
          getTargetColor: [251, 191, 36, 220],
          widthUnits: "pixels",
          widthMinPixels: 1,
          widthMaxPixels: 12,
          greatCircle: true,
          pickable: true,
        })
      );
    }

    if (layers.has("COLUMNS") && columnData.length > 0) {
      activeLayers.push(
        new ColumnLayer<ColumnDatum>({
          id: "intel-columns",
          data: columnData,
          getPosition: (d) => d.position,
          getElevation: (d) => d.elevation,
          getFillColor: (d) => d.color,
          radius: 8000,
          extruded: true,
          diskResolution: 6,
          elevationScale: 1,
          pickable: true,
        })
      );
    }

    if (layers.has("HEAT") && heatData.length > 0) {
      activeLayers.push(
        new HeatmapLayer<HeatPoint>({
          id: "intel-heat",
          data: heatData,
          getPosition: (d) => d.position,
          getWeight: () => 1,
          radiusPixels: 60,
          intensity: 1,
          threshold: 0.05,
          colorRange: [
            [0, 0, 255, 0],
            [0, 128, 255, 80],
            [0, 255, 200, 140],
            [34, 211, 238, 180],
            [251, 191, 36, 210],
            [255, 60, 60, 240],
          ],
          pickable: true,
        })
      );
    }

    deck.setProps({ layers: activeLayers });
  }, [layers, projects, entities, contracts]);

  // Nothing to render; deck.gl owns the canvas directly inside the Leaflet pane.
  return null;
}
