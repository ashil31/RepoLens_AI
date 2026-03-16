/**
 * Production Excalidraw export for ReactFlow architecture graphs.
 * Converts nodes and edges to editable Excalidraw elements with proper bindings.
 */

import { downloadBlob } from "./download";
import type { ReactFlowExportInstance } from "./types";

const NODE_WIDTH = 160;
const NODE_HEIGHT = 44;

function genId(): string {
  return Math.random().toString(36).slice(2, 15) + Math.random().toString(36).slice(2, 15);
}

interface ExcalidrawRect {
  id: string;
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: string;
  strokeWidth: number;
  strokeStyle: string;
  roughness: number;
  opacity: number;
  roundness: { type: number; value: number };
  seed: number;
  version: number;
  versionNonce: number;
  isDeleted: boolean;
  boundElements: { id: string; type: string }[] | null;
  updated: number;
  link: null;
  locked: boolean;
}

interface ExcalidrawText {
  id: string;
  type: "text";
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: string;
  strokeWidth: number;
  strokeStyle: string;
  roughness: number;
  opacity: number;
  roundness: null;
  seed: number;
  version: number;
  versionNonce: number;
  isDeleted: boolean;
  boundElements: null;
  updated: number;
  link: null;
  locked: boolean;
  text: string;
  fontSize: number;
  fontFamily: number;
  textAlign: string;
  verticalAlign: string;
  originalText: string;
  lineHeight: number;
  baseline: number;
  containerId: string | null;
}

interface ExcalidrawArrow {
  id: string;
  type: "arrow";
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: string;
  strokeWidth: number;
  strokeStyle: string;
  roughness: number;
  opacity: number;
  roundness: { type: number; value: number };
  seed: number;
  version: number;
  versionNonce: number;
  isDeleted: boolean;
  boundElements: null;
  updated: number;
  link: null;
  locked: boolean;
  points: [number, number][];
  lastCommittedPoint: null;
  startBinding: { elementId: string; focus: number; gap: number } | null;
  endBinding: { elementId: string; focus: number; gap: number } | null;
  startArrowhead: null;
  endArrowhead: string;
}

function createRect(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  boundElementIds: { id: string; type: string }[]
): ExcalidrawRect {
  return {
    id,
    type: "rectangle",
    x,
    y,
    width,
    height,
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
    boundElements: boundElementIds.length > 0 ? boundElementIds : null,
    updated: Date.now(),
    link: null,
    locked: false,
  };
}

function createText(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  containerId: string
): ExcalidrawText {
  return {
    id,
    type: "text",
    x,
    y,
    width,
    height,
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
    text,
    fontSize: 14,
    fontFamily: 1,
    textAlign: "left",
    verticalAlign: "middle",
    originalText: text,
    lineHeight: 1.25,
    baseline: 16,
    containerId,
  };
}

function createArrow(
  id: string,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  startRectId: string,
  endRectId: string
): ExcalidrawArrow {
  return {
    id,
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
    startBinding: { elementId: startRectId, focus: 0.5, gap: 1 },
    endBinding: { elementId: endRectId, focus: 0.5, gap: 1 },
    startArrowhead: null,
    endArrowhead: "arrow",
  };
}

/**
 * Exports the ReactFlow graph as an editable Excalidraw file.
 * - Rectangles for each node
 * - Text bound to rectangles (containerId + boundElements)
 * - Arrows bound to nodes (startBinding + endBinding)
 * - Preserves node positions and layout
 */
export function exportReactFlowExcalidraw(
  instance: ReactFlowExportInstance,
  fileName: string
): void {
  const nodes = instance.getNodes();
  const edges = instance.getEdges();

  if (nodes.length === 0) {
    throw new Error("No nodes to export");
  }

  const nodeMap = new Map<string, (typeof nodes)[number]>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const nodeToRectId = new Map<string, string>();
  const elements: (ExcalidrawRect | ExcalidrawText | ExcalidrawArrow)[] = [];

  for (const node of nodes) {
    const rx = node.position.x;
    const ry = node.position.y;
    const w = (node.width as number) ?? NODE_WIDTH;
    const h = (node.height as number) ?? NODE_HEIGHT;
    const label = (node.data?.label as string) ?? node.id;

    const rectId = genId();
    const textId = genId();
    nodeToRectId.set(node.id, rectId);

    elements.push(
      createRect(rectId, rx, ry, w, h, [{ id: textId, type: "text" }])
    );
    elements.push(
      createText(textId, rx + 8, ry + h / 2 - 10, w - 16, 20, label, rectId)
    );
  }

  for (const edge of edges) {
    const src = nodeMap.get(edge.source);
    const tgt = nodeMap.get(edge.target);
    if (!src || !tgt) continue;

    const startRectId = nodeToRectId.get(edge.source);
    const endRectId = nodeToRectId.get(edge.target);
    if (!startRectId || !endRectId) continue;

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
    elements.push(
      createArrow(arrowId, startX, startY, endX, endY, startRectId, endRectId)
    );
  }

  const doc = {
    type: "excalidraw",
    version: 2,
    source: "https://repolens.dev",
    elements,
    appState: {
      viewBackgroundColor: "#ffffff",
      gridSize: 20,
    },
    files: {},
  };

  const json = JSON.stringify(doc, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const finalFileName = fileName.endsWith(".excalidraw")
    ? fileName
    : `${fileName}.excalidraw`;
  downloadBlob(blob, finalFileName);
}
