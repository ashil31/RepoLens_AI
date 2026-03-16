"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const FLOW_LANGUAGES = ["flow", "diagram", "ascii", "mermaid"];
const FLOW_CHARS = /[→↓←↑↳|─━┃│├└<>]/;

function isFlowBlock(className?: string | string[], children?: React.ReactNode): boolean {
  if (className && Array.isArray(className)) {
    const lang = className.find((c) => typeof c === "string" && c.startsWith("language-"));
    if (lang && FLOW_LANGUAGES.some((l) => (lang as string).toLowerCase().includes(l))) return true;
  }
  const text = getTextContent(children);
  return typeof text === "string" && text.length > 20 && FLOW_CHARS.test(text);
}

function getTextContent(node: React.ReactNode): string | null {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(getTextContent).filter(Boolean).join("") || null;
  if (node && typeof node === "object" && "props" in node) {
    return getTextContent((node as React.ReactElement).props?.children);
  }
  return null;
}

const components: Components = {
  pre({ node, children, ...props }) {
    const className = node?.properties?.className as string[] | undefined;
    const isFlow = isFlowBlock(className, children);
    return (
      <pre data-flow={isFlow ? "true" : undefined} {...props}>
        {children}
      </pre>
    );
  },
};

type ArchitectureNotesMarkdownProps = {
  content: string;
};

export function ArchitectureNotesMarkdown({ content }: ArchitectureNotesMarkdownProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}
