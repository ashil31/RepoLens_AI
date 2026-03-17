/**
 * Shared types for graph export module.
 */

/** Minimal interface for ReactFlow instance used in exports (compatible with ReactFlowInstance). */
export type ReactFlowExportInstance = {
  getNodes: () => Array<{
    id: string;
    position: { x: number; y: number };
    width?: number | null;
    height?: number | null;
    data?: { label?: string };
  }>;
  getEdges: () => Array<{ id: string; source: string; target: string }>;
};
