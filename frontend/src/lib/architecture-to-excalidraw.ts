/**
 * Converts ReactFlow nodes and edges to Excalidraw format for editable export.
 * Excalidraw: https://excalidraw.com
 */

const NODE_WIDTH = 160;
const NODE_HEIGHT = 44;

function genId(): string {
  return Math.random().toString(36).slice(2, 15) + Math.random().toString(36).slice(2, 15);
}

type GraphNode = { id: string; position: { x: number; y: number }; width?: number; height?: number; data?: { label?: string } };
type GraphEdge = { id: string; source: string; target: string };

export function architectureToExcalidraw(nodes: GraphNode[], edges: GraphEdge[]): string {
  const nodeMap = new Map<string, GraphNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const elements: Record<string, unknown>[] = [];

  for (const node of nodes) {
    const rx = node.position.x;
    const ry = node.position.y;
    const w = (node.width as number) ?? NODE_WIDTH;
    const h = (node.height as number) ?? NODE_HEIGHT;
    const label = (node.data?.label as string) ?? node.id;

    const rectId = genId();

    elements.push({
      id: rectId,
      type: "rectangle",
      x: rx,
      y: ry,
      width: w,
      height: h,
      angle: 0,
      strokeColor: "#1e1e1e",
      backgroundColor: "#f0f0f0",
      fillStyle: "solid",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      roundness: { type: 3, value: 8 },
      seed: Math.floor(Math.random() * 2 ** 31),
      version: 1,
      versionNonce: Math.floor(Math.random() * 2 ** 31),
      isDeleted: false,
      boundElements: null,
      updated: Date.now(),
      link: null,
      locked: false,
    });

    const textId = genId();
    elements.push({
      id: textId,
      type: "text",
      x: rx + 8,
      y: ry + h / 2 - 10,
      width: w - 16,
      height: 20,
      angle: 0,
      strokeColor: "#1e1e1e",
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      roundness: null,
      seed: Math.floor(Math.random() * 2 ** 31),
      version: 1,
      versionNonce: Math.floor(Math.random() * 2 ** 31),
      isDeleted: false,
      boundElements: null,
      updated: Date.now(),
      link: null,
      locked: false,
      text: label,
      fontSize: 14,
      fontFamily: 1,
      textAlign: "left",
      verticalAlign: "middle",
      originalText: label,
      lineHeight: 1.25,
      baseline: 16,
    });
  }

  for (const edge of edges) {
    const src = nodeMap.get(edge.source);
    const tgt = nodeMap.get(edge.target);
    if (!src || !tgt) continue;

    const sx = src.position.x;
    const sy = src.position.y;
    const sw = (src.width as number) ?? NODE_WIDTH;
    const sh = (src.height as number) ?? NODE_HEIGHT;
    const tx = tgt.position.x;
    const ty = tgt.position.y;
    const tw = (tgt.width as number) ?? NODE_WIDTH;
    const th = (tgt.height as number) ?? NODE_HEIGHT;

    const startX = sx + sw / 2;
    const startY = sy + sh;
    const endX = tx + tw / 2;
    const endY = ty;

    const arrowId = genId();

    elements.push({
      id: arrowId,
      type: "arrow",
      x: startX,
      y: startY,
      width: endX - startX,
      height: endY - startY,
      angle: 0,
      strokeColor: "#1e1e1e",
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      roundness: { type: 3, value: 0 },
      seed: Math.floor(Math.random() * 2 ** 31),
      version: 1,
      versionNonce: Math.floor(Math.random() * 2 ** 31),
      isDeleted: false,
      boundElements: null,
      updated: Date.now(),
      link: null,
      locked: false,
      points: [
        [0, 0],
        [endX - startX, endY - startY],
      ],
      lastCommittedPoint: null,
      startBinding: null,
      endBinding: null,
      startArrowhead: null,
      endArrowhead: "arrow",
    });
  }

  const doc = {
    type: "excalidraw",
    version: 2,
    source: "https://excalidraw.com",
    elements,
    appState: {
      gridSize: 20,
      viewBackgroundColor: "#ffffff",
    },
    files: {},
  };

  return JSON.stringify(doc, null, 2);
}
