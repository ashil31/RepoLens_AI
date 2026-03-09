import type { ReactNode } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

export default function Home(): ReactNode {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col">
        <section className="container flex flex-col items-center justify-center gap-6 px-4 py-12 text-center sm:gap-8 sm:py-16 md:py-24">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Understand your codebase with AI
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
            RepoLens analyzes your repositories and surfaces insights, dependencies, and documentation—so you can ship faster.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Button asChild variant="default" size="cta" className="w-full sm:w-auto">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline" size="cta" className="w-full sm:w-auto">
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
