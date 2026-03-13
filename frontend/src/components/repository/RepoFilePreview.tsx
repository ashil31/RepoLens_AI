"use client";

import { useState, useMemo } from "react";
import { FileCode, Copy, Check, ChevronRight, ChevronDown, Folder, FolderOpen, Loader2 } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { useRepositoryFileContent } from "@/hooks/queries";
import { cn } from "@/lib/utils";

type FileItem = { id: string; path: string; language?: string | null };

type RepoFilePreviewProps = {
  files: FileItem[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  workspaceId?: string | null;
  repoId?: string | null;
  fileContent?: string | null;
  className?: string;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 gap-1 text-xs"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

type TreeNode = { name: string; path: string | null; children: Map<string, TreeNode> };

function buildTree(paths: string[]): TreeNode {
  const root: TreeNode = { name: "", path: null, children: new Map() };
  const seen = new Set<string>();
  for (const p of paths) {
    if (seen.has(p)) continue;
    seen.add(p);
    const parts = p.split("/");
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1 && (part.includes(".") || parts.length === 1);
      if (!node.children.has(part)) {
        node.children.set(part, { name: part, path: isFile ? p : null, children: new Map() });
      }
      node = node.children.get(part)!;
      if (isFile) node.path = p;
    }
  }
  return root;
}

function FileTree({
  node,
  depth,
  selectedPath,
  onSelectFile,
  expanded,
  setExpanded,
}: {
  node: TreeNode;
  depth: number;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  expanded: Set<string>;
  setExpanded: (updater: (prev: Set<string>) => Set<string>) => void;
}) {
  const entries = Array.from(node.children.entries()).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return null;
  return (
    <>
      {entries.map(([key, child]) => {
        const isFolder = child.children.size > 0 || child.path === null;
        const pathKey = depth === 0 ? key : `${node.name}/${key}`.replace(/^\/+/, "");
        const isOpen = expanded.has(pathKey);
        if (isFolder) {
          return (
            <div key={pathKey}>
              <button
                type="button"
                onClick={() =>
                  setExpanded((prev) => {
                    const next = new Set(prev);
                    if (next.has(pathKey)) next.delete(pathKey);
                    else next.add(pathKey);
                    return next;
                  })
                }
                className="flex w-full items-center gap-1 rounded-md px-2 py-1 text-left text-xs font-mono text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                style={{ paddingLeft: 8 + depth * 12 }}
              >
                {isOpen ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                {isOpen ? <FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                <span className="truncate">{key}</span>
              </button>
              {isOpen && (
                <FileTree node={child} depth={depth + 1} selectedPath={selectedPath} onSelectFile={onSelectFile} expanded={expanded} setExpanded={setExpanded} />
              )}
            </div>
          );
        }
        const path = child.path!;
        return (
          <button
            key={path}
            type="button"
            onClick={() => onSelectFile(path)}
            className={cn(
              "flex w-full items-center gap-1 truncate rounded-md px-2 py-1 text-left text-xs font-mono transition-colors",
              selectedPath === path ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
            style={{ paddingLeft: 8 + (depth + 1) * 12 }}
          >
            <FileCode className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{key}</span>
          </button>
        );
      })}
    </>
  );
}

function getPrismLanguage(lang: string | null): string {
  const m: Record<string, string> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    json: "json",
    css: "css",
    scss: "scss",
    html: "html",
    md: "markdown",
    mdx: "mdx",
    py: "python",
    go: "go",
    rs: "rust",
    java: "java",
    rb: "ruby",
  };
  return m[(lang ?? "").toLowerCase()] ?? lang ?? "text";
}

export function RepoFilePreview({
  files,
  selectedPath,
  onSelectFile,
  workspaceId,
  repoId,
  fileContent: propFileContent,
  className,
}: RepoFilePreviewProps) {
  const selectedFile = useMemo(
    () => files.find((f) => f.path === selectedPath),
    [files, selectedPath]
  );
  const { data: fetchedContent, isLoading } = useRepositoryFileContent(
    workspaceId ?? null,
    repoId ?? null,
    selectedFile?.id ?? null
  );

  const displayContent =
    propFileContent ??
    (fetchedContent?.content ?? (selectedPath ? `// ${selectedPath}\n// Select a file to preview.` : null));
  const hasContent = !!displayContent;
  const language = fetchedContent?.language ?? selectedFile?.language ?? null;

  const fileList = useMemo(() => {
    const seen = new Set<string>();
    return files.filter((f) => {
      if (seen.has(f.path)) return false;
      seen.add(f.path);
      return true;
    });
  }, [files]);

  const tree = useMemo(() => buildTree(fileList.map((f) => f.path)), [fileList]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(["src", "frontend", "backend"]));

  return (
    <div className={cn("flex h-full min-h-0 flex-col lg:flex-row", className)}>
      <div className="flex w-full shrink-0 flex-col border-b border-border lg:w-56 lg:border-b-0 lg:border-r">
        <div className="shrink-0 border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground lg:border-b-0">
          Files ({fileList.length})
        </div>
        <div className="max-h-40 min-h-0 flex-1 overflow-y-auto p-2 dashboard-content-scroll lg:max-h-none">
          <FileTree
            node={tree}
            depth={0}
            selectedPath={selectedPath}
            onSelectFile={onSelectFile}
            expanded={expanded}
            setExpanded={setExpanded}
          />
        </div>
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {selectedPath ? (
          <>
            <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
              <span className="truncate font-mono text-xs text-foreground">
                {isLoading ? (
                  <Loader2 className="mr-2 inline h-3.5 w-3.5 animate-spin text-muted-foreground" />
                ) : (
                  <FileCode className="mr-2 inline h-3.5 w-3.5 text-muted-foreground" />
                )}
                {selectedPath}
              </span>
              {hasContent && <CopyButton text={displayContent} />}
            </div>
            <div className="min-h-0 flex-1 overflow-auto dashboard-content-scroll">
              {isLoading ? (
                <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
                  Loading file…
                </div>
              ) : fetchedContent && displayContent ? (
                <SyntaxHighlighter
                  language={getPrismLanguage(language)}
                  style={oneDark}
                  customStyle={{
                    margin: 0,
                    padding: "1rem",
                    fontSize: "0.75rem",
                    background: "hsl(var(--muted))",
                    borderRadius: 0,
                  }}
                  codeTagProps={{ style: { fontFamily: "inherit" } }}
                  showLineNumbers
                >
                  {displayContent}
                </SyntaxHighlighter>
              ) : (
                <pre className="whitespace-pre p-4 font-mono text-xs text-foreground">
                  {displayContent}
                </pre>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Select a file to preview
          </div>
        )}
      </div>
    </div>
  );
}
