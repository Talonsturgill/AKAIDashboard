"use client";

import dynamic from "next/dynamic";
import type { GraphNode, GraphEdge } from "./EntityGraph";

const EntityGraph = dynamic(() => import("./EntityGraph"), {
  ssr: false,
  loading: () => (
    <div className="h-[480px] rounded-lg border border-[var(--color-border-soft)]" />
  ),
});

type Props = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export default function GraphPanel({ nodes, edges }: Props) {
  return <EntityGraph nodes={nodes} edges={edges} />;
}
