/**
 * Production PNG export for ReactFlow architecture graphs.
 * Uses html-to-image for high-resolution, full-graph capture.
 */

import { toPng } from "html-to-image";
import { getTransformForBounds } from "reactflow";
import { computeGraphBounds } from "./compute-graph-bounds";
import { download } from "./download";
import type { ReactFlowExportInstance } from "./types";
export type { ReactFlowExportInstance };

const PIXEL_RATIO = 3;
const SCALE_FACTOR = 2;

/**
 * Exports the ReactFlow graph as a high-resolution PNG.
 * - Captures only the viewport (excludes controls, minimap)
 * - Computes graph bounds for full coverage
 * - Uses pixelRatio 3 for crisp output
 * - Supports transparent background
 */
export async function exportReactFlowPNG(
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

    const dataUrl = await toPng(viewport, {
      pixelRatio: PIXEL_RATIO,
      width,
      height,
      backgroundColor: options?.backgroundColor ?? "transparent",
      filter: (node) => {
        const el = node as HTMLElement;
        const className = el.className?.toString?.() ?? "";
        return (
          !className.includes("react-flow__controls") &&
          !className.includes("react-flow__minimap") &&
          !className.includes("react-flow__attribution") &&
          !className.includes("react-flow__background")
        );
      },
    });

    download(dataUrl, fileName.endsWith(".png") ? fileName : `${fileName}.png`);
  } finally {
    viewport.style.transform = originalTransform;
  }
}
