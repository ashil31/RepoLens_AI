import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSiteUrl } from "@/lib/site-url";

const base = getSiteUrl();

export const metadata: Metadata = {
  title: "Log in",
  description:
    "Sign in to RepoLens to access your workspaces, AI-powered repository analysis, and codebase insights.",
  alternates: {
    canonical: `${base}/login`,
  },
  openGraph: {
    title: "Log in | RepoLens",
    description:
      "Sign in to RepoLens to access your workspaces and AI-powered codebase analysis.",
    url: `${base}/login`,
  },
  twitter: {
    title: "Log in | RepoLens",
    description:
      "Sign in to RepoLens to access your workspaces and AI-powered codebase analysis.",
  },
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
