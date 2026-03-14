import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { CompanyMarquee } from "@/components/landing/CompanyMarquee";
import { FeatureFiguresSection } from "@/components/landing/FeatureFiguresSection";

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
