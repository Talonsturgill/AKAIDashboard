"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { InfraMapProject } from "./InfraMap";

type Props = {
  projects: InfraMapProject[];
  mapboxToken: string;
};

export default function MapboxMap({ projects, mapboxToken }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapboxToken || !containerRef.current) return;

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-152, 64],
      zoom: 3.3,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    const mappable = projects.filter(
      (p): p is InfraMapProject & { latitude: number; longitude: number } =>
        p.latitude !== null && p.longitude !== null,
    );

    map.on("load", () => {
      for (const project of mappable) {
        const popup = new mapboxgl.Popup({ offset: 12, closeButton: false })
          .setHTML(
            `<div style="font-family:monospace;font-size:12px;color:#e2e8f0;padding:2px 0">
              <strong style="display:block;margin-bottom:2px;color:#06b6d4">${escapeHtml(project.name)}</strong>
              ${project.location_name ? `<span style="color:#94a3b8">${escapeHtml(project.location_name)}</span>` : ""}
            </div>`,
          );

        new mapboxgl.Marker({ color: "#06b6d4" })
          .setLngLat([project.longitude, project.latitude])
          .setPopup(popup)
          .addTo(map);
      }
    });

    return () => {
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxToken]);

  return (
    <div
      ref={containerRef}
      className="h-[520px] overflow-hidden rounded-lg border border-[var(--color-border-soft)]"
    />
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
