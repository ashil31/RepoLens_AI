/**
 * Production SVG export for ReactFlow architecture graphs.
 * Produces infinite-resolution vector diagrams.
 */

import { toSvg } from "html-to-image";
import { getTransformForBounds } from "reactflow";
import { computeGraphBounds } from "./compute-graph-bounds";
import { download } from "./download";
import type { ReactFlowExportInstance } from "./types";

const SCALE_FACTOR = 2;

/**
 * Exports the ReactFlow graph as an SVG.
 * - Captures only the viewport (excludes controls, minimap)
 * - Computes graph bounds for full coverage
 * - Infinite resolution vector output
 */
export async function exportReactFlowSVG(
  instance: ReactFlowExportInstance,
  container: HTMLElement,
  fileName: string,
  options?: { backgroundColor?: string }
): Promise<void> {
  const nodes = instance.getNodes();
  if (nodes.length === 0) {
    throw new Error("No nodes to export");
  }

  const viewport = container.querySelector(".react-flow__viewport") as HTMLElement | null;
  if (!viewport) {
    throw new Error("ReactFlow viewport not found");
  }

  const bounds = computeGraphBounds(nodes);
  const width = bounds.width * SCALE_FACTOR;
  const height = bounds.height * SCALE_FACTOR;

  const transform = getTransformForBounds(bounds, width, height, 0.5, 2);

  const originalTransform = viewport.style.transform;

  try {
    viewport.style.transform = `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`;

    const svgDataUrl = await toSvg(viewport, {
      width,
      height,
      backgroundColor: options?.backgroundColor ?? "#ffffff",
      filter: (node) => {
        const el = node as HTMLElement;
        const className = el.className?.toString?.() ?? "";
        return (
          !className.includes("react-flow__controls") &&
          !className.includes("react-flow__minimap") &&
          !className.includes("react-flow__attribution")
        );
      },
    });

    download(svgDataUrl, fileName.endsWith(".svg") ? fileName : `${fileName}.svg`);
  } finally {
    viewport.style.transform = originalTransform;
  }
}
