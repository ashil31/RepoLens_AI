"use client";

import { useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { cn } from "@/lib/utils";

type RepoArchitectureGraphProps = {
  nodes?: Node[];
  edges?: Edge[];
  className?: string;
};

const PLACEHOLDER_NODES: Node[] = [
  { id: "1", type: "input", position: { x: 100, y: 80 }, data: { label: "Frontend" } },
  { id: "2", type: "default", position: { x: 100, y: 180 }, data: { label: "API" } },
  { id: "3", type: "default", position: { x: 100, y: 280 }, data: { label: "Auth Service" } },
  { id: "4", type: "output", position: { x: 100, y: 380 }, data: { label: "Database" } },
];

const PLACEHOLDER_EDGES: Edge[] = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
  { id: "e3-4", source: "3", target: "4" },
];

export function RepoArchitectureGraph({
  nodes: initialNodes,
  edges: initialEdges,
  className,
}: RepoArchitectureGraphProps) {
  const [nodes, , onNodesChange] = useNodesState(
    initialNodes ?? PLACEHOLDER_NODES
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialEdges ?? PLACEHOLDER_EDGES
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className={cn("h-full w-full rounded-lg border border-border bg-card", className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        className="rounded-lg"
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls className="border-border! bg-card! text-foreground! [&>button]:border-border! [&>button]:bg-card! [&>button]:text-foreground!" />
        {/* <MiniMap
          className="bg-muted! border-border!"
          nodeColor="var(--color-muted)"
          maskColor="var(--background)"
        /> */}
      </ReactFlow>
    </div>
  );
}
