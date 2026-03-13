"use client";

import { motion } from "framer-motion";
import type { Repository } from "@/types/user";
import {
  RepoHeader,
  RepoChat,
  RepoPreviewPanel,
  RepoResizableLayout,
} from "@/components/repository";
import type { ChatMessage } from "@/components/repository";
import { HeroSidebar } from "./HeroSidebar";
import { HeroDashboardPreview } from "./HeroDashboardPreview";

const MOCK_REPO: Repository = {
  id: "hero-demo",
  name: "RepoLens_AI",
  owner: "developer",
  fullName: "developer/RepoLens_AI",
  description: "AI-powered repository analysis and documentation.",
  language: "TypeScript",
  stars: 128,
  files: [
    { id: "1", path: "src/app/page.tsx", language: "typescript" },
    { id: "2", path: "src/components/repository/RepoChat.tsx", language: "typescript" },
    { id: "3", path: "backend/src/services/repository.service.ts", language: "typescript" },
  ],
  repoUrl: "https://github.com/",
};

const MOCK_DOC = `# Repository Overview

This repository is **developer/RepoLens_AI**, primarily written in **TypeScript**.

## Summary

- **Files:** 42
- **Stars:** 128

## Key Directories

- **src/** – frontend (Next.js)
- **backend/** – API and services
- **docs/** – documentation

## Architecture

RepoLens analyzes your codebase and surfaces insights, dependencies, and documentation—so you can ship faster.`;

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "u-1",
    role: "user",
    content: "Summarize the main entry points and how auth is handled.",
  },
  {
    id: "a-1",
    role: "assistant",
    content:
      "The app uses Next.js with an API route at \`/api/auth/...\`. Main entry is \`src/app/page.tsx\`. Auth is handled via a token in the store and refresh logic in \`lib/api/client\`. Key files: \`src/app/(dashboard)/layout.tsx\`, \`hooks/use-require-auth.ts\`.",
    files: ["src/app/page.tsx", "lib/api/client.ts"],
  },
];

export function HeroEmbeddedDashboard() {
  return (
    <>
      {/* Mobile & tablet: compact preview card */}
      <div className="lg:hidden">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <HeroDashboardPreview />
        </motion.div>
      </div>

      {/* Desktop: full embedded dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="hidden h-[680px] min-h-[560px] w-full overflow-hidden rounded-xl border border-border bg-card shadow-2xl sm:h-[760px] lg:flex lg:h-[82vh] lg:min-h-[700px] lg:max-h-[960px]"
      >
      <HeroSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden p-2 sm:p-3">
        <header className="shrink-0">
          <RepoHeader
            repo={MOCK_REPO}
            backHref=""
            onShare={() => {}}
            onExport={() => {}}
          />
        </header>
        <div className="min-h-0 flex-1 overflow-hidden pt-2">
          <RepoResizableLayout
            defaultLeftPercent={38}
            left={
              <RepoChat
                messages={MOCK_MESSAGES}
                onSendMessage={() => {}}
                isThinking={false}
                conversations={[]}
              />
            }
            right={
              <div className="h-full min-h-0 min-w-0 overflow-hidden">
                <RepoPreviewPanel
                  docContent={MOCK_DOC}
                  files={MOCK_REPO.files ?? []}
                  selectedFilePath={null}
                  onSelectFile={() => {}}
                  mode="docs"
                />
              </div>
            }
          />
        </div>
      </div>
    </motion.div>
    </>
  );
}
