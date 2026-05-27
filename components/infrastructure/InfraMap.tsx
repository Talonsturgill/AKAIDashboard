"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export type InfraMapProject = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  project_type: string | null;
  location_name: string | null;
};

type Props = {
  projects: InfraMapProject[];
  mapboxToken: string;
};

export default function InfraMap({ projects, mapboxToken }: Props) {
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

  if (!mapboxToken) {
    return (
      <div className="flex h-[520px] items-center justify-center rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)]">
        <div className="max-w-sm text-center">
          <p className="label-eyebrow mb-2">Map unavailable</p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Interactive map needs a Mapbox token — add{" "}
            <code className="rounded bg-[var(--color-surface-elevated)] px-1.5 py-0.5 font-mono text-xs">
              NEXT_PUBLIC_MAPBOX_TOKEN
            </code>{" "}
            to{" "}
            <code className="rounded bg-[var(--color-surface-elevated)] px-1.5 py-0.5 font-mono text-xs">
              .env.local
            </code>{" "}
            to enable it.
          </p>
        </div>
      </div>
    );
  }

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
