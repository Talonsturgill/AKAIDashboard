"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { InfraMapProject } from "./InfraMap";

const TYPE_COLORS: Record<string, string> = {
  data_center: "#a78bfa",
  fiber: "#22d3ee",
  power: "#34d399",
};

function projectColor(type: string | null): string {
  return TYPE_COLORS[type ?? ""] ?? "#94a3b8";
}

function buildIcon(color: string): L.DivIcon {
  const html = `
    <div style="
      width:12px;height:12px;
      border-radius:50%;
      background:${color};
      border:1.5px solid rgba(255,255,255,0.4);
      box-shadow:0 0 8px ${color}88;
      pointer-events:all;
    "></div>
  `;
  return L.divIcon({
    html,
    className: "",
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

type InfraLeafletMapProps = {
  projects: InfraMapProject[];
};

export default function InfraLeafletMap({ projects }: InfraLeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

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
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: ["a", "b", "c", "d"],
      maxZoom: 19,
    }).addTo(map);

    const mappable = projects.filter(
      (p): p is InfraMapProject & { latitude: number; longitude: number } =>
        p.latitude !== null && p.longitude !== null,
    );

    for (const p of mappable) {
      const marker = L.marker([p.latitude, p.longitude], {
        icon: buildIcon(projectColor(p.project_type)),
      }).addTo(map);
      const tip = `<span style="font-family:ui-monospace,monospace;font-size:11px;color:#e2e8f0;">${p.name}${p.location_name ? ` / ${p.location_name}` : ""}</span>`;
      marker.bindTooltip(tip, { direction: "top", offset: [0, -6], opacity: 0.95 });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [projects]);

  return (
    <div
      ref={containerRef}
      className="h-[520px] overflow-hidden rounded-lg border border-[var(--color-border-soft)]"
      style={{ background: "hsl(222 8% 4%)" }}
    />
  );
}
