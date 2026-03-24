import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { CompanyMarquee } from "@/components/landing/CompanyMarquee";
import { FeatureFiguresSection } from "@/components/landing/FeatureFiguresSection";
import { getSiteUrl } from "@/lib/site-url";

const homeTitle =
  "RepoLens — AI-Powered Codebase Analysis, Docs & Repository Intelligence";

const homeDescription =
  "Turn any repo into clarity: automated analysis, dependency and API mapping, embeddings-powered search, and AI-generated documentation. Built for teams who need to understand large codebases fast.";

/**
 * Homepage — overrides copy + canonical only. OG/Twitter images and `card` come from root `layout.tsx`
 * (`metadataBase` + `openGraph.images` / `twitter` defaults). Do not repeat `images` here.
 */
export const metadata: Metadata = {
  title: {
    absolute: homeTitle,
  },
  description: homeDescription,
  keywords: [
    "AI repository analysis",
    "codebase documentation tool",
    "GitHub repo analyzer",
    "architecture diagram from code",
    "semantic search codebase",
    "RepoLens",
  ],
  alternates: {
    canonical: getSiteUrl(),
  },
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    url: getSiteUrl(),
  },
  twitter: {
    title: homeTitle,
    description: homeDescription,
  },
};

export default function Home(): ReactNode {
  return (
    <div className="hero-dark flex min-h-screen flex-col overflow-x-clip bg-background text-foreground">
      <Navbar variant="landing" />
      <main className="flex w-full flex-1 flex-col pt-12 sm:pt-14">
        <HeroSection />
        <CompanyMarquee />
        <FeatureFiguresSection />
      </main>
      <Footer />
    </div>
  );
}
