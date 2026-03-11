import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { CompanyMarquee } from "@/components/landing/CompanyMarquee";
import { FeatureFiguresSection } from "@/components/landing/FeatureFiguresSection";

export default function Home(): ReactNode {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar variant="landing" />
      <main className="flex flex-1 flex-col">
        <HeroSection />
        <CompanyMarquee />
        <FeatureFiguresSection />
      </main>
      <Footer />
    </div>
  );
}
