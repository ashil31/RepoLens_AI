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

/** Landing page — canonical URL and rich SEO for the homepage. */
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
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    url: getSiteUrl(),
    type: "website",
    images: [
      {
        url: "/og/repolens-og-1200x630.png",
        width: 1200,
        height: 630,
        alt: "RepoLens — AI-powered codebase analysis and repository intelligence",
      },
    ],
  },
  twitter: {
    title: homeTitle,
    description: homeDescription,
    images: ["/og/repolens-og-1200x630.png"],
  },
  alternates: {
    canonical: getSiteUrl(),
  },
};

export default function Home(): ReactNode {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
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
