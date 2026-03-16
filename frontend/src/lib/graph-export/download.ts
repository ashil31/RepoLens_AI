/**
 * Download utilities for graph exports.
 */

/**
 * Triggers a download of a data URL (e.g. from toPng, toSvg) or blob URL.
 */
export function download(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

/**
 * Triggers a download of a Blob (e.g. JSON for Excalidraw).
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
