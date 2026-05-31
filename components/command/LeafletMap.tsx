"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { InfraProject } from "@/lib/command/types";
import type { LayerKey } from "./LayerToggles";
import {
  STATUS_COLORS,
  MILITARY_KEYWORDS,
  FIBER_ROUTES,
  MILITARY_RINGS,
} from "@/lib/command/constants";

function markerColor(status: string | null): string {
  return STATUS_COLORS[status ?? ""] ?? "#94a3b8";
}

function isMilitary(name: string): boolean {
  return MILITARY_KEYWORDS.some((kw) => name.includes(kw));
}

function buildDivIcon(color: string, isSelected: boolean, isNonOp: boolean): L.DivIcon {
  const ringSize = isSelected ? 28 : 20;
  const dotSize = isSelected ? 14 : 10;
  const ringOpacity = isSelected ? 0.9 : 0.35;
  const ringBorder = isSelected ? 2 : 1.5;
  const glowSize = isSelected ? 14 : 8;
  const glowAlpha = isSelected ? "cc" : "55";
  const coreSize = isSelected ? 5 : 3;
  const pulseClass = isNonOp ? " leaflet-marker-pulse" : "";

  const html = `
    <div style="position:relative;width:${ringSize}px;height:${ringSize}px;pointer-events:all;">
      <div style="
        position:absolute;top:0;left:0;
        width:${ringSize}px;height:${ringSize}px;
        border-radius:50%;
        border:${ringBorder}px solid ${color};
        opacity:${ringOpacity};
        box-shadow:0 0 ${glowSize}px ${color}${glowAlpha};
        pointer-events:none;
      "></div>
      <div class="${pulseClass}" style="
        position:absolute;top:50%;left:50%;
        transform:translate(-50%,-50%);
        width:${dotSize}px;height:${dotSize}px;
        border-radius:50%;
        background:${color};
        box-shadow:0 0 ${isSelected ? 10 : 6}px ${color};
        pointer-events:none;
      "></div>
      <div style="
        position:absolute;top:50%;left:50%;
        transform:translate(-50%,-50%);
        width:${coreSize}px;height:${coreSize}px;
        border-radius:50%;
        background:white;
        opacity:0.9;
        pointer-events:none;
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "",
    iconSize: [ringSize, ringSize],
    iconAnchor: [ringSize / 2, ringSize / 2],
  });
}

function isVisible(p: InfraProject, activeLayers: Set<LayerKey>): boolean {
  if (isMilitary(p.name)) return activeLayers.has("military");
  const typeKey = (p.project_type ?? "") as LayerKey;
  return activeLayers.has(typeKey);
}

type LeafletMapProps = {
  projects: InfraProject[];
  activeLayers: Set<LayerKey>;
  selectedProjectId: string | null;
  onMarkerClick: (project: InfraProject) => void;
  onCoordsChange: (lat: number, lon: number) => void;
  onMapReady?: (map: L.Map) => void;
};

export default function LeafletMap({
  projects,
  activeLayers,
  selectedProjectId,
  onMarkerClick,
  onCoordsChange,
  onMapReady,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const overlaysRef = useRef<L.Layer[]>([]);

  // Stable refs so the init effect stays with [] deps and doesn't re-run on every render
  const onCoordsChangeRef = useRef(onCoordsChange);
  const onMarkerClickRef = useRef(onMarkerClick);
  const onMapReadyRef = useRef(onMapReady);
  useEffect(() => { onCoordsChangeRef.current = onCoordsChange; }, [onCoordsChange]);
  useEffect(() => { onMarkerClickRef.current = onMarkerClick; }, [onMarkerClick]);
  useEffect(() => { onMapReadyRef.current = onMapReady; }, [onMapReady]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      center: [63, -152],
      zoom: 4,
      minZoom: 3,
      maxZoom: 11,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
      worldCopyJump: false,
      preferCanvas: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: ["a", "b", "c", "d"],
      maxZoom: 19,
    }).addTo(map);

    map.on("mousemove", (e: L.LeafletMouseEvent) => {
      onCoordsChangeRef.current(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;
    onMapReadyRef.current?.(map);

    return () => {
      map.remove();
      mapRef.current = null;
      overlaysRef.current = [];
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const layer of overlaysRef.current) {
      map.removeLayer(layer);
    }
    overlaysRef.current = [];

    const fiberActive = activeLayers.has("fiber");
    const militaryActive = activeLayers.has("military");

    if (fiberActive) {
      for (const route of FIBER_ROUTES) {
        const line = L.polyline(route.positions, {
          color: "#22d3ee",
          weight: route.weight,
          opacity: 0.7,
        }).addTo(map);
        overlaysRef.current.push(line);
      }
    }

    if (militaryActive) {
      for (const ring of MILITARY_RINGS) {
        const circle = L.circle(ring.center, {
          radius: ring.radius,
          color: "#a78bfa",
          weight: 1.5,
          opacity: 0.55,
          fill: false,
          dashArray: "6 4",
          className: "leaflet-military-ring",
        }).addTo(map);
        overlaysRef.current.push(circle);
      }
    }

    for (const p of projects) {
      if (!isVisible(p, activeLayers)) continue;
      const color = markerColor(p.status);
      const isSelected = p.id === selectedProjectId;
      const isNonOp = p.status !== "operational";
      const icon = buildDivIcon(color, isSelected, isNonOp);
      const marker = L.marker([p.latitude, p.longitude], { icon }).addTo(map);
      marker.on("click", () => onMarkerClickRef.current(p));
      marker.bindTooltip(
        `<span style="font-family:ui-monospace,monospace;font-size:11px;color:#e2e8f0;">${p.name}</span>`,
        { direction: "top", offset: [0, -8], opacity: 0.95 },
      );
      overlaysRef.current.push(marker);
    }
  }, [projects, activeLayers, selectedProjectId]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ background: "hsl(222 8% 4%)" }}
    />
  );
}
