"use client";

import type React from "react";
import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type ReactFlowInstance,
  BackgroundVariant,
  Handle,
  Position,
} from "reactflow";
import ELK from "elkjs/lib/elk.bundled.js";
import "reactflow/dist/style.css";
import {
  SiTypescript,
  SiJavascript,
  SiCss3,
  SiHtml5,
  SiJson,
  SiMarkdown,
} from "react-icons/si";
import { VscFileCode } from "react-icons/vsc";
import { architectureToReactFlow } from "@/lib/architecture-to-reactflow";
import type { RepositoryFile, RepositoryDependency } from "@/types/user";
import { cn } from "@/lib/utils";
import "./RepoArchitectureGraph.module.css";

const elk = new ELK();

const ELK_OPTIONS = {
  "elk.algorithm": "layered",
  "elk.layered.spacing.nodeNodeBetweenLayers": "80",
  "elk.spacing.nodeNode": "60",
};

const FILE_ICONS: Record<string, React.ComponentType<{ className?: string }> | undefined> = {
  ts: SiTypescript,
  tsx: SiTypescript,
  js: SiJavascript,
  jsx: SiJavascript,
  css: SiCss3,
  scss: SiCss3,
  html: SiHtml5,
  json: SiJson,
  md: SiMarkdown,
  mdx: SiMarkdown,
};

function FileNode({ data }: { data: { label: string; path?: string; language?: string | null } }) {
  const ext = (data.language ?? "").toLowerCase();
  const IconComponent = FILE_ICONS[ext] ?? VscFileCode;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
      <Handle type="target" position={Position.Top} className="h-1! w-1! border-0! bg-muted-foreground!" />
      <IconComponent className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="max-w-[120px] truncate font-mono text-xs text-foreground" title={data.path}>
        {data.label}
      </span>
      <Handle type="source" position={Position.Bottom} className="h-1! w-1! border-0! bg-muted-foreground!" />
    </div>
  );
}

const nodeTypes = { file: FileNode };

function ReactFlowInstanceCapture({
  onInstance,
}: {
  onInstance: (instance: ReturnType<typeof useReactFlow> | null) => void;
}) {
  const instance = useReactFlow();
  useEffect(() => {
    onInstance(instance);
    return () => onInstance(null);
  }, [instance, onInstance]);
  return null;
}

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

type RepoArchitectureGraphProps = {
  files?: RepositoryFile[];
  dependencies?: RepositoryDependency[];
  className?: string;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  /** Called when ReactFlow instance is ready (for export/fitView) */
  onReactFlowInstance?: (instance: ReactFlowInstance | null) => void;
};

async function layoutWithElk(nodes: Node[], edges: Edge[]): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const graph = {
    id: "root",
    layoutOptions: ELK_OPTIONS,
    children: nodes.map((n) => ({
      id: n.id,
      width: 150,
      height: 40,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    })),
  };

  const layouted = await elk.layout(graph);
  const layoutedNodes = (layouted.children ?? []).map((child) => {
    const node = nodes.find((n) => n.id === child.id);
    return {
      ...node!,
      position: { x: child.x ?? 0, y: child.y ?? 0 },
    };
  });
  return { nodes: layoutedNodes, edges };
}

export function RepoArchitectureGraph({
  files = [],
  dependencies = [],
  className,
  containerRef,
  onReactFlowInstance,
}: RepoArchitectureGraphProps) {
  const { nodes: initialNodes, edges: initialEdges, hasRealData } = useMemo(() => {
    if (files.length === 0 && dependencies.length === 0) {
      return { nodes: PLACEHOLDER_NODES, edges: PLACEHOLDER_EDGES, hasRealData: false };
    }
    const { nodes, edges } = architectureToReactFlow(
      files as { id: string; path: string; language: string | null }[],
      dependencies
    );
    const withType = nodes.map((n) => ({
      ...n,
      type: "file" as const,
    }));
    return { nodes: withType, edges, hasRealData: true };
  }, [files, dependencies]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    const hasRealData = files.length > 0 || dependencies.length > 0;
    if (hasRealData && initialNodes.length > 0) {
      let cancelled = false;
      layoutWithElk(initialNodes, initialEdges).then(({ nodes: layoutedNodes, edges: layoutedEdges }) => {
        if (!cancelled) {
          setNodes(layoutedNodes);
          setEdges(layoutedEdges);
        }
      });
      return () => {
        cancelled = true;
      };
    }
  }, [files.length, dependencies.length, initialNodes, initialEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "repoArchitectureGraph h-full w-full rounded-lg border border-border bg-card",
        className
      )}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, includeHiddenNodes: true }}
        onlyRenderVisibleElements={false}
        className="rounded-lg"
      >
        {onReactFlowInstance && <ReactFlowInstanceCapture onInstance={onReactFlowInstance} />}
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        {hasRealData && edges.length === 0 && (
          <Panel position="top-center" className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
            No import or API dependencies detected. Re-analyze the repository to build the full dependency graph.
          </Panel>
        )}
        <Controls />
        <MiniMap
          className="repolensArchitectureMinimap"
          nodeColor="hsl(var(--primary))"
          maskColor="hsl(var(--background) / 0.6)"
        />
      </ReactFlow>
    </div>
  );
}
