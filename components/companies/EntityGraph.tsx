"use client";

import { ReactFlow, Background, Controls } from "@xyflow/react";
import type { Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export type GraphNode = {
  id: string;
  name: string;
  type: string;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
};

type Props = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

const TYPE_COLORS: Record<string, string> = {
  company: "hsl(189 94% 43%)",
  person: "hsl(258 90% 66%)",
  project: "hsl(158 64% 39%)",
  agency: "hsl(330 81% 60%)",
  anc: "hsl(45 95% 55%)",
  university: "hsl(200 80% 55%)",
  infrastructure: "hsl(25 90% 55%)",
  tribe: "hsl(120 55% 45%)",
  contract_holder: "hsl(0 70% 60%)",
};

function circlePosition(
  index: number,
  total: number,
  radius = 320,
): { x: number; y: number } {
  if (total === 0) return { x: 0, y: 0 };
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return {
    x: Math.round(radius * Math.cos(angle)),
    y: Math.round(radius * Math.sin(angle)),
  };
}

export default function EntityGraph({ nodes, edges }: Props) {
  if (nodes.length === 0) {
    return (
      <div className="flex h-[480px] items-center justify-center rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)]">
        <p className="text-sm text-[var(--color-text-tertiary)]">
          Network graph will render once entities and relationships exist
        </p>
      </div>
    );
  }

  const flowNodes: Node[] = nodes.map((n, i) => {
    const { x, y } = circlePosition(i, nodes.length, Math.max(220, nodes.length * 14));
    const color = TYPE_COLORS[n.type] ?? "hsl(220 9% 70%)";
    return {
      id: n.id,
      position: { x, y },
      data: { label: n.name },
      style: {
        background: "hsl(225 11% 9%)",
        border: `1.5px solid ${color}`,
        borderRadius: 6,
        color: "hsl(220 14% 96%)",
        fontSize: 11,
        fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
        padding: "4px 8px",
        boxShadow: `0 0 8px ${color}40`,
        maxWidth: 140,
        whiteSpace: "nowrap" as const,
        overflow: "hidden",
        textOverflow: "ellipsis",
      },
    };
  });

  const flowEdges: Edge[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: false,
    style: { stroke: "hsl(222 16% 28%)", strokeWidth: 1 },
    labelStyle: {
      fill: "hsl(220 6% 47%)",
      fontSize: 9,
      fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
    },
    labelBgStyle: { fill: "hsl(225 11% 9%)", fillOpacity: 0.85 },
  }));

  return (
    <div className="h-[480px] rounded-lg border border-[var(--color-border-soft)] overflow-hidden">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
        colorMode="dark"
      >
        <Background color="hsl(222 16% 16%)" gap={24} />
        <Controls
          showInteractive={false}
          style={{
            background: "hsl(224 12% 13%)",
            border: "1px solid hsl(222 16% 16%)",
            borderRadius: 6,
          }}
        />
      </ReactFlow>
    </div>
  );
}
