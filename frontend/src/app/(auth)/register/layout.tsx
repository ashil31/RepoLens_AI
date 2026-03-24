import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSiteUrl } from "@/lib/site-url";

const base = getSiteUrl();

export const metadata: Metadata = {
  title: "Sign up",
  description:
    "Create a RepoLens account to analyze GitHub repositories with AI, explore dependencies, and chat with your codebase.",
  alternates: {
    canonical: `${base}/register`,
  },
  openGraph: {
    title: "Sign up | RepoLens",
    description:
      "Create a RepoLens account to analyze repositories with AI and ship faster with clarity.",
    url: `${base}/register`,
  },
  twitter: {
    title: "Sign up | RepoLens",
    description:
      "Create a RepoLens account to analyze repositories with AI and ship faster with clarity.",
  },
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
