"use client";

import { useRef, useCallback } from "react";
import type { InfraProject } from "./DetailPanel";
import type { LayerKey } from "./LayerToggles";

// ─── Projection ──────────────────────────────────────────────────────────────
const LON_MIN = -180;
const LON_MAX = -130;
const LAT_MIN = 51;
const LAT_MAX = 72;
const VB_W = 1600;
const VB_H = 1000;

function project(lat: number, lon: number): { x: number; y: number } {
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * VB_W;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * VB_H;
  return { x, y };
}

export function inverseProject(
  svgX: number,
  svgY: number,
): { lat: number; lon: number } {
  const lon = (svgX / VB_W) * (LON_MAX - LON_MIN) + LON_MIN;
  const lat = LAT_MAX - (svgY / VB_H) * (LAT_MAX - LAT_MIN);
  return { lat, lon };
}

// ─── Alaska Silhouette ───────────────────────────────────────────────────────
//
// Derived from well-known geographic approximations of Alaska's outline.
// Covers the mainland, the Aleutian arc, and the SE panhandle at ~30-40 vertices.
// Not cartographically exact — just needs to read as Alaska. Coordinates are
// geographic (lat, lon) projected into viewBox space.
//
const ALASKA_OUTLINE: [number, number][] = [
  // SE panhandle — south tip
  [54.8, -130.1],
  [55.3, -130.0],
  [56.3, -130.2],
  [57.0, -132.5],
  [57.8, -134.3],
  [58.2, -136.4],
  // Gulf of Alaska north coast
  [59.7, -139.7],
  [60.0, -141.0],
  [59.4, -144.2],
  [58.5, -147.0],
  [58.0, -152.0],
  [57.2, -154.5],
  [57.1, -157.5],
  // Alaska Peninsula south coast
  [56.5, -159.5],
  [55.9, -161.0],
  // Aleutian arc (simplified west swing)
  [54.8, -163.4],
  [54.0, -165.3],
  [53.5, -167.0],
  [53.0, -168.4],
  [52.8, -169.5],
  [52.5, -172.0],
  [52.2, -174.0],
  [52.0, -176.5],
  [52.3, -178.5],
  // Turn back east along south side of Alaska Peninsula
  [54.1, -165.0],
  [55.1, -162.5],
  // Bristol Bay / western coast
  [58.4, -161.9],
  [60.5, -162.5],
  [61.5, -163.9],
  [62.5, -164.8],
  // Seward Peninsula
  [63.9, -166.5],
  [64.5, -166.5],
  [65.7, -168.0],
  [66.6, -168.1],
  // North slope — Arctic coast going east
  [68.0, -166.5],
  [69.6, -163.5],
  [70.4, -161.0],
  [71.0, -156.8],
  [71.3, -154.0],
  [70.5, -148.4],
  [70.0, -142.0],
  [69.5, -141.0],
  // Northeast corner / Yukon border going south
  [68.0, -141.0],
  [65.0, -141.0],
  [62.5, -141.0],
  [61.0, -141.0],
  [60.3, -141.0],
  // Back to SE panhandle
  [59.7, -139.7],
  [59.0, -136.5],
  [57.5, -134.0],
  [56.2, -131.5],
  [55.3, -130.5],
  [54.8, -130.1],
];

const ALASKA_PATH_D = (() => {
  const pts = ALASKA_OUTLINE.map(([lat, lon]) => {
    const { x, y } = project(lat, lon);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `M ${pts.join(" L ")} Z`;
})();

// ─── Status colors ────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  operational: "#22d3ee",
  proposed: "#fbbf24",
  construction: "#38bdf8",
  permitting: "#a78bfa",
};

function markerColor(status: string | null): string {
  return STATUS_COLORS[status ?? ""] ?? "#94a3b8";
}

// ─── Military project IDs ─────────────────────────────────────────────────────
const MILITARY_KEYWORDS = ["JBER", "Eielson", "Clear"];

function isMilitary(name: string): boolean {
  return MILITARY_KEYWORDS.some((kw) => name.includes(kw));
}

// ─── Fiber route definitions ──────────────────────────────────────────────────
type FiberRoute = {
  id: string;
  color: string;
  dash?: string;
  points: [number, number][];
};

const FIBER_ROUTES: FiberRoute[] = [
  {
    id: "quintillion",
    color: "#22d3ee",
    points: [
      [64.5, -165.41], // Nome
      [66.9, -162.6],  // Kotzebue
      [68.35, -166.81], // Point Hope
      [70.65, -160.04], // Wainwright
      [71.29, -156.79], // Utqiagvik
      [70.32, -148.4],  // Prudhoe Bay
    ],
  },
  {
    id: "alcan",
    color: "#22d3ee",
    points: [
      [64.75, -147.35], // North Pole / Fairbanks
      [64.04, -145.73], // Delta Junction
      [63.34, -142.99], // Tok
      [62.38, -140.87], // AK border Beaver Creek
    ],
  },
  {
    id: "airraq-bethel",
    color: "#22d3ee",
    points: [
      [59.04, -158.46], // Dillingham hub
      [60.79, -161.76], // Bethel
    ],
  },
  {
    id: "airraq-platinum",
    color: "#22d3ee",
    points: [
      [59.04, -158.46],
      [59.01, -161.82], // Platinum
    ],
  },
  {
    id: "airraq-eek",
    color: "#22d3ee",
    points: [
      [59.04, -158.46],
      [60.22, -162.02], // Eek
    ],
  },
  {
    id: "airraq-quinhagak",
    color: "#22d3ee",
    points: [
      [59.04, -158.46],
      [59.75, -161.92], // Quinhagak
    ],
  },
  {
    id: "airraq-togiak",
    color: "#22d3ee",
    points: [
      [59.04, -158.46],
      [59.06, -160.39], // Togiak
    ],
  },
];

function routePathD(points: [number, number][]): string {
  const projected = points.map(([lat, lon]) => project(lat, lon));
  return projected
    .map(({ x, y }, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
}

// ─── Main component ───────────────────────────────────────────────────────────
type AlaskaSvgProps = {
  projects: InfraProject[];
  activeLayers: Set<LayerKey>;
  onMarkerClick: (project: InfraProject) => void;
  onMouseMove: (lat: number, lon: number) => void;
  onMouseLeave: () => void;
  selectedProjectId: string | null;
};

export default function AlaskaSvg({
  projects,
  activeLayers,
  onMarkerClick,
  onMouseMove,
  onMouseLeave,
  selectedProjectId,
}: AlaskaSvgProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      const svgX = (rawX / rect.width) * VB_W;
      const svgY = (rawY / rect.height) * VB_H;
      const { lat, lon } = inverseProject(svgX, svgY);
      onMouseMove(lat, lon);
    },
    [onMouseMove],
  );

  // Determine which projects to show by active layers
  function isVisible(p: InfraProject): boolean {
    const mil = isMilitary(p.name);
    if (mil && !activeLayers.has("military")) return false;
    const typeKey = (p.project_type ?? "") as LayerKey;
    if (!mil && !activeLayers.has(typeKey)) return false;
    return true;
  }

  const visibleProjects = projects.filter(isVisible);
  const militaryProjects = projects.filter(
    (p) => isMilitary(p.name) && activeLayers.has("military"),
  );

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className="h-full w-full cursor-crosshair"
      style={{ background: "hsl(222 8% 4%)" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={onMouseLeave}
      role="img"
      aria-label="Alaska AI infrastructure command map"
    >
      <defs>
        {/* Grid pattern */}
        <pattern id="cmd-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="rgba(255,255,255,0.035)"
            strokeWidth="0.5"
          />
        </pattern>

        {/* Glow filter for markers */}
        <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="glow-violet" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="glow-silhouette" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Scan-line sweep animation clip */}
        <clipPath id="scan-clip">
          <rect x="0" y="0" width={VB_W} height={VB_H} />
        </clipPath>
      </defs>

      {/* ── Background grid ────────────────────────────────────────────────── */}
      <rect width={VB_W} height={VB_H} fill="url(#cmd-grid)" />

      {/* ── Alaska silhouette ───────────────────────────────────────────────── */}
      <path
        d={ALASKA_PATH_D}
        fill="hsl(222 8% 7%)"
        stroke="#22d3ee"
        strokeWidth="1.2"
        strokeOpacity="0.55"
        filter="url(#glow-silhouette)"
      />

      {/* ── Scan-line sweep ────────────────────────────────────────────────── */}
      <rect
        clipPath="url(#scan-clip)"
        x="-80"
        y="0"
        width="80"
        height={VB_H}
        fill="url(#scan-gradient)"
        opacity="0.18"
        style={{ animation: "cmd-scan 5s linear infinite" }}
      />

      {/* Need inline gradient def for the scan beam */}
      <defs>
        <linearGradient id="scan-gradient" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.6" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      {/* ── Fiber route lines ───────────────────────────────────────────────── */}
      {activeLayers.has("fiber") &&
        FIBER_ROUTES.map((route) => (
          <path
            key={route.id}
            d={routePathD(route.points)}
            fill="none"
            stroke={route.color}
            strokeWidth="1.5"
            strokeOpacity="0.7"
            strokeDasharray={route.dash}
            filter="url(#glow-cyan)"
          />
        ))}

      {/* ── Military territory rings ─────────────────────────────────────────── */}
      {militaryProjects.map((p) => {
        const { x, y } = project(p.latitude, p.longitude);
        return (
          <g key={`ring-${p.id}`}>
            <circle
              cx={x}
              cy={y}
              r="42"
              fill="none"
              stroke="#a78bfa"
              strokeWidth="1"
              strokeOpacity="0.5"
              strokeDasharray="6 4"
              style={{ animation: "cmd-pulse-ring 3s ease-in-out infinite alternate" }}
            />
            <circle
              cx={x}
              cy={y}
              r="62"
              fill="none"
              stroke="#a78bfa"
              strokeWidth="0.6"
              strokeOpacity="0.25"
              strokeDasharray="3 8"
              style={{ animation: "cmd-pulse-ring 3s ease-in-out infinite alternate", animationDelay: "0.5s" }}
            />
          </g>
        );
      })}

      {/* ── Markers ─────────────────────────────────────────────────────────── */}
      {visibleProjects.map((p) => {
        const { x, y } = project(p.latitude, p.longitude);
        const color = markerColor(p.status);
        const isSelected = p.id === selectedProjectId;
        const isNonOp = p.status !== "operational";
        const truncName = p.name.length > 18 ? p.name.slice(0, 18) + "…" : p.name;
        const filterId =
          p.status === "proposed"
            ? "glow-amber"
            : p.status === "permitting"
            ? "glow-violet"
            : "glow-cyan";

        return (
          <g
            key={p.id}
            onClick={() => onMarkerClick(p)}
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label={p.name}
            onKeyDown={(e) => { if (e.key === "Enter") onMarkerClick(p); }}
          >
            {/* Outer glow ring (always) */}
            <circle
              cx={x}
              cy={y}
              r={isSelected ? 18 : 14}
              fill="none"
              stroke={color}
              strokeWidth={isSelected ? 2 : 1}
              strokeOpacity={isSelected ? 0.9 : 0.3}
              filter={`url(#${filterId})`}
            />
            {/* Main dot */}
            <circle
              cx={x}
              cy={y}
              r={isSelected ? 8 : 6}
              fill={color}
              filter={`url(#${filterId})`}
              style={
                isNonOp
                  ? { animation: "cmd-pulse-marker 2s ease-in-out infinite alternate" }
                  : undefined
              }
            />
            {/* Inner bright dot */}
            <circle
              cx={x}
              cy={y}
              r={isSelected ? 3 : 2}
              fill="white"
              opacity={0.9}
            />
            <title>{p.name}</title>
            {/* Label */}
            <text
              x={x + 10}
              y={y - 8}
              fill={color}
              fontSize="9"
              fontFamily="ui-monospace, monospace"
              opacity="0.85"
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              {truncName}
            </text>
          </g>
        );
      })}

      {/* ── CSS animations (inline <style>) ─────────────────────────────────── */}
      <style>{`
        @keyframes cmd-scan {
          0%   { transform: translateX(0); }
          100% { transform: translateX(${VB_W + 80}px); }
        }
        @keyframes cmd-pulse-marker {
          0%   { r: 6; opacity: 1; }
          100% { r: 9; opacity: 0.45; }
        }
        @keyframes cmd-pulse-ring {
          0%   { stroke-opacity: 0.5; }
          100% { stroke-opacity: 0.15; }
        }
      `}</style>
    </svg>
  );
}
