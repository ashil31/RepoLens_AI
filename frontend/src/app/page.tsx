import type { ReactNode } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

export default function Home(): ReactNode {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="container flex flex-col items-center justify-center gap-8 px-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Understand your codebase with AI
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            RepoLens analyzes your repositories and surfaces insights, dependencies, and documentation—so you can ship faster.
          </p>
          <div className="flex gap-4">
            <Button asChild variant="default" size="cta">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline" size="cta">
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
