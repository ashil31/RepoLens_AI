/**
 * Computes the export viewport bounds for a ReactFlow graph.
 */

import { getRectOfNodes } from "reactflow";
import type { Node } from "reactflow";
const PADDING = 80;

export interface GraphBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

type NodeLike = { id: string; position: { x: number; y: number }; width?: number; height?: number };

/**
 * Returns the bounding rectangle for the graph with padding for export.
 * Uses ReactFlow's getRectOfNodes for accurate node bounds.
 */
export function computeGraphBounds(nodes: NodeLike[]): GraphBounds {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: PADDING * 2, height: PADDING * 2 };
  }

  const bounds = getRectOfNodes(nodes as Node[]);

  return {
    x: bounds.x - PADDING,
    y: bounds.y - PADDING,
    width: bounds.width + PADDING * 2,
    height: bounds.height + PADDING * 2,
  };
}
