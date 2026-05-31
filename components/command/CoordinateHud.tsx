"use client";

type CoordinateHudProps = {
  lat: number | null;
  lon: number | null;
};

export default function CoordinateHud({ lat, lon }: CoordinateHudProps) {
  const displayLat = lat ?? 64.0;
  const displayLon = lon ?? -150.0;

  const latStr = displayLat.toFixed(2).padStart(6, " ");
  const lonStr = displayLon.toFixed(2);

  return (
    <div className="pointer-events-none select-none rounded border border-[var(--color-border-soft)] bg-[var(--color-background)]/80 px-3 py-1.5 backdrop-blur-sm">
      <span className="font-mono text-xs tracking-wider text-cyan-400/80">
        <span className="mr-1 text-cyan-600/60">+</span>
        LAT {latStr}&nbsp;&nbsp;LON {lonStr}
      </span>
    </div>
  );
}
