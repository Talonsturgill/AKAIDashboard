"use client";

import dynamic from "next/dynamic";

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

// Leaflet fallback map loaded client-side only
const InfraLeafletMap = dynamic(() => import("./InfraLeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[520px] overflow-hidden rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)]" />
  ),
});

// Mapbox map loaded client-side only, never bundled when token is absent
const MapboxMap = dynamic(() => import("./MapboxMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[520px] overflow-hidden rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)]" />
  ),
});

export default function InfraMap({ projects, mapboxToken }: Props) {
  if (!mapboxToken) {
    return <InfraLeafletMap projects={projects} />;
  }

  return <MapboxMap projects={projects} mapboxToken={mapboxToken} />;
}
