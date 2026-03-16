/**
 * Converts repository files + dependencies into ReactFlow nodes and edges.
 * Uses a short hash of path for node IDs. Applies graph limits (max 200 nodes).
 */

import type { Node, Edge } from "reactflow";

export interface RepoFile {
  id: string;
  path: string;
  language: string | null;
}

export interface RepoDependency {
  sourcePath: string;
  targetPath: string;
}

const MAX_NODES = 200;

/** Simple non-crypto hash for short node IDs. Ensures uniqueness by appending path suffix on collision. */
function uniqueNodeId(path: string, used: Set<string>): string {
  let base = "";
  let h = 0;
  for (let i = 0; i < path.length; i++) {
    const c = path.charCodeAt(i);
    h = (h << 5) - h + c;
    h = h & h;
  }
  base = Math.abs(h).toString(36);
  let id = base;
  let n = 0;
  while (used.has(id)) {
    id = `${base}_${(n++).toString(36)}`;
  }
  used.add(id);
  return id;
}

/** Get file extension for icon/label */
function getExtension(path: string): string {
  const parts = path.split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

/**
 * Build ReactFlow nodes and edges from files and dependencies.
 * Limits to MAX_NODES by preferring files that appear in dependencies.
 */
export function architectureToReactFlow(
  files: RepoFile[],
  dependencies: RepoDependency[]
): { nodes: Node[]; edges: Edge[] } {
  const pathToId = new Map<string, string>();
  const pathToFile = new Map<string, RepoFile>();
  const usedIds = new Set<string>();

  for (const f of files) {
    pathToFile.set(f.path, f);
    const id = uniqueNodeId(f.path, usedIds);
    pathToId.set(f.path, id);
  }

  const depPaths = new Set<string>();
  for (const d of dependencies) {
    depPaths.add(d.sourcePath);
    depPaths.add(d.targetPath);
  }

  let pathsToInclude: string[];
  if (files.length <= MAX_NODES) {
    pathsToInclude = files.map((f) => f.path);
  } else {
    const inDeps = files.filter((f) => depPaths.has(f.path)).map((f) => f.path);
    const rest = files.filter((f) => !depPaths.has(f.path)).map((f) => f.path);
    const take = MAX_NODES - inDeps.length;
    pathsToInclude = [...inDeps, ...rest.slice(0, Math.max(0, take))];
  }

  const pathSet = new Set(pathsToInclude);
  const nodes: Node[] = pathsToInclude.map((path) => {
    const id = pathToId.get(path)!;
    const ext = getExtension(path);
    const label = path.split("/").pop() ?? path;
    return {
      id,
      type: "default",
      position: { x: 0, y: 0 },
      data: { label, path, language: pathToFile.get(path)?.language ?? ext },
    };
  });

  const edges: Edge[] = [];
  const seenEdges = new Set<string>();

  for (const d of dependencies) {
    if (!pathSet.has(d.sourcePath) || !pathSet.has(d.targetPath)) continue;
    const srcId = pathToId.get(d.sourcePath);
    const tgtId = pathToId.get(d.targetPath);
    if (!srcId || !tgtId || srcId === tgtId) continue;
    const key = `${srcId}-${tgtId}`;
    if (seenEdges.has(key)) continue;
    seenEdges.add(key);
    edges.push({ id: `e-${key}`, source: srcId, target: tgtId });
  }

  // Fallback: when no import/API deps, create edges from folder structure (index -> siblings)
  if (edges.length === 0 && pathsToInclude.length >= 2) {
    const dirToFiles = new Map<string, string[]>();
    for (const path of pathsToInclude) {
      const dir = path.includes("/") ? path.replace(/\/[^/]+$/, "") : "";
      if (!dirToFiles.has(dir)) dirToFiles.set(dir, []);
      dirToFiles.get(dir)!.push(path);
    }
    for (const [, filesInDir] of dirToFiles) {
      const indexFile = filesInDir.find((f) => /\/index\.(tsx?|jsx?|vue)$/.test(f));
      if (indexFile && filesInDir.length > 1) {
        for (const other of filesInDir) {
          if (other === indexFile) continue;
          const srcId = pathToId.get(indexFile);
          const tgtId = pathToId.get(other);
          if (srcId && tgtId) {
            const key = `${srcId}-${tgtId}`;
            if (!seenEdges.has(key)) {
              seenEdges.add(key);
              edges.push({ id: `e-${key}`, source: srcId, target: tgtId });
            }
          }
        }
      }
    }
  }

  return { nodes, edges };
}
