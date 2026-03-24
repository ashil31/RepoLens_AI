"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, Linkedin, Twitter } from "lucide-react";
import { RepoLensLogo } from "@/components/repolens-logo";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

export function Footer() {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const year = new Date().getFullYear();
  const textRef = useRef<HTMLDivElement | null>(null);
  const physicsContainerRef = useRef<HTMLDivElement | null>(null);
  const [matterLib, setMatterLib] = useState<MatterApi | null>(null);
  const engineRef = useRef<MatterEngine | null>(null);
  const runnerRef = useRef<unknown>(null);
  const frameRef = useRef<number | null>(null);
  const physicsInitialized = useRef(false);

  type MatterEngine = {
    gravity: { x: number; y: number };
    world: unknown;
  };

  type PhysicsBody = {
    position: { x: number; y: number };
    angle: number;
  };

  type MatterApi = {
    Engine: {
      create: () => MatterEngine;
      clear: (engine: MatterEngine) => void;
    };
    Bodies: {
      rectangle: (
        x: number,
        y: number,
        width: number,
        height: number,
        options?: Record<string, unknown>
      ) => unknown;
    };
    Body: {
      setAngle: (body: unknown, angle: number) => void;
    };
    World: {
      add: (world: unknown, bodies: unknown | unknown[]) => void;
      clear: (world: unknown, keepStatic: boolean) => void;
    };
    Mouse: {
      create: (element: HTMLElement) => unknown;
    };
    MouseConstraint: {
      create: (
        engine: MatterEngine,
        options: {
          mouse: unknown;
          constraint: { stiffness: number; render: { visible: boolean } };
        }
      ) => unknown;
    };
    Runner: {
      create: () => unknown;
      run: (runner: unknown, engine: MatterEngine) => void;
      stop: (runner: unknown) => void;
    };
  };

  const physicsItems = [
    "RAG",
    "Embeddings",
    "pgVector",
    "Prisma",
    "Next.js",
    "Node.js",
    "TypeScript",
    "BullMQ",
    "AI Docs",
    "Code Graph",
  ];

  const linkGroups = [
    {
      title: "Pages",
      links: [
        { label: "Products", href: "#" },
        { label: "Features", href: "#features" },
        { label: "Integrations", href: "#" },
        { label: "Pricing", href: "#" },
        { label: "Blog", href: "#" },
      ],
    },
    {
      title: "Socials",
      links: [
        { label: "Twitter", href: "https://twitter.com" },
        { label: "LinkedIn", href: "https://linkedin.com" },
        { label: "GitHub", href: "https://github.com" },
        { label: "Discord", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
        { label: "Cookie Policy", href: "#" },
      ],
    },
    {
      title: "Register",
      links: [
        { label: "Get Started", href: "/register" },
        { label: "Login", href: "/login" },
        { label: "Documentation", href: "#" },
      ],
    },
  ] as const;

  // Load Matter.js (client-only, CDN like your reference)
  useEffect(() => {
    if (!isLanding) return;

    const w = window as Window & { Matter?: MatterApi };
    if (w.Matter) {
      const timer = window.setTimeout(() => setMatterLib(w.Matter ?? null), 0);
      return () => window.clearTimeout(timer);
    }

    const existing = document.querySelector(
      'script[data-repolens-matter="true"]'
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener(
        "load",
        () => {
          if (w.Matter) setMatterLib(w.Matter);
        },
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js";
    script.async = true;
    script.dataset.repolensMatter = "true";
    script.onload = () => {
      if (w.Matter) setMatterLib(w.Matter);
    };
    document.body.appendChild(script);
  }, [isLanding]);

  // Animated background letters on footer reveal
  useEffect(() => {
    if (!isLanding || !textRef.current) return;
    const letters = textRef.current.querySelectorAll(".footer-letter");

    const tween = gsap.fromTo(
      letters,
      { y: -120, opacity: 0, rotateX: 90 },
      {
        y: 0,
        opacity: 0.12,
        rotateX: 0,
        stagger: 0.1,
        ease: "back.out(1.6)",
        duration: 1.1,
        scrollTrigger: {
          trigger: textRef.current,
          start: "top 85%",
          once: true,
        },
      }
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [isLanding]);

  // Matter physics init on footer scroll reveal
  useEffect(() => {
    if (
      !isLanding ||
      !matterLib ||
      !physicsContainerRef.current ||
      physicsInitialized.current
    ) {
      return;
    }
    const matter = matterLib;

    const trigger = ScrollTrigger.create({
      trigger: "#footer",
      start: "top 80%",
      once: true,
      onEnter: () => {
        if (physicsInitialized.current) return;
        physicsInitialized.current = true;
        initPhysics();
      },
    });

    function initPhysics() {
      const container = physicsContainerRef.current;
      if (!container) return;

      requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const engine = matter.Engine.create();
        engine.gravity = { x: 0, y: 1 };
        engineRef.current = engine;

        const wallThickness = 200;
        const walls = [
          matter.Bodies.rectangle(
            rect.width / 2,
            rect.height + wallThickness / 2,
            rect.width + wallThickness * 2,
            wallThickness,
            { isStatic: true }
          ),
          matter.Bodies.rectangle(
            -wallThickness / 2,
            rect.height / 2,
            wallThickness,
            rect.height + wallThickness * 2,
            { isStatic: true }
          ),
          matter.Bodies.rectangle(
            rect.width + wallThickness / 2,
            rect.height / 2,
            wallThickness,
            rect.height + wallThickness * 2,
            { isStatic: true }
          ),
        ];
        matter.World.add(engine.world, walls);
        // Add top wall after initial drop so pills can visibly fall in first,
        // then remain constrained inside the footer area during drag.
        window.setTimeout(() => {
          if (!engineRef.current) return;
          const topWall = matter.Bodies.rectangle(
            rect.width / 2,
            -wallThickness / 2,
            rect.width + wallThickness * 2,
            wallThickness,
            { isStatic: true }
          );
          matter.World.add(engine.world, topWall);
        }, 2200);

        const objects = container.querySelectorAll(
          ".physics-object"
        ) as NodeListOf<HTMLElement>;
        const bodies: Array<{
          body: unknown;
          element: HTMLElement;
          width: number;
          height: number;
          renderX: number;
          renderY: number;
        }> = [];

        objects.forEach((obj, index) => {
          const objRect = obj.getBoundingClientRect();
          const startX = Math.min(
            rect.width - objRect.width / 2,
            Math.max(
              objRect.width / 2,
              objRect.left - rect.left + objRect.width / 2
            )
          );
          // Spawn from above the footer, then fall in naturally.
          const startY = -80 - index * 68;

          const body = matter.Bodies.rectangle(
            startX,
            startY,
            objRect.width,
            objRect.height,
            {
              restitution: 0.72,
              friction: 0.1,
              frictionAir: 0.02,
              density: 0.002,
            }
          );

          matter.Body.setAngle(body, (Math.random() - 0.5) * Math.PI * 0.5);
          obj.style.opacity = "1";
          bodies.push({
            body,
            element: obj,
            width: objRect.width,
            height: objRect.height,
            renderX: startX - objRect.width / 2,
            renderY: startY - objRect.height / 2,
          });
          matter.World.add(engine.world, body);
        });

        const mouse = matter.Mouse.create(container);
        const mouseConstraint = matter.MouseConstraint.create(engine, {
          mouse,
          constraint: {
            stiffness: 0.6,
            render: { visible: false },
          },
        });
        matter.World.add(engine.world, mouseConstraint);

        const runner = matter.Runner.create();
        runnerRef.current = runner;
        matter.Runner.run(runner, engine);

        const updatePositions = () => {
          const liveRect = container.getBoundingClientRect();
          const boundsWidth = liveRect.width || rect.width;
          const boundsHeight = liveRect.height || rect.height;
          const edgePadding = 6;

          bodies.forEach((item) => {
            const { body, element, width, height } = item;
            const state = body as PhysicsBody;
            const targetX = Math.max(
              edgePadding,
              Math.min(
                state.position.x - width / 2,
                boundsWidth - width - edgePadding
              )
            );
            const targetY = Math.max(
              -height * 1.2,
              Math.min(
                state.position.y - height / 2,
                boundsHeight - height - edgePadding
              )
            );

            // Small interpolation smooths visual jitter while preserving physics.
            item.renderX += (targetX - item.renderX) * 0.35;
            item.renderY += (targetY - item.renderY) * 0.35;

            element.style.left = `${item.renderX}px`;
            element.style.top = `${item.renderY}px`;
            element.style.transform = `rotate(${state.angle}rad)`;
          });

          frameRef.current = requestAnimationFrame(updatePositions);
        };

        updatePositions();
      });
    }

    return () => {
      trigger.kill();

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      if (runnerRef.current && engineRef.current) {
        matter.Runner.stop(runnerRef.current);
        matter.World.clear(engineRef.current.world, false);
        matter.Engine.clear(engineRef.current);
      }
      runnerRef.current = null;
      engineRef.current = null;
    };
  }, [isLanding, matterLib]);

  return (
    <footer
      id="footer"
      className={cn(
        "relative overflow-hidden border-t",
        isLanding
          ? "hero-dark border-border bg-background text-foreground min-h-[620px] sm:min-h-[580px] md:min-h-[600px]"
          : "border-border bg-background"
      )}
    >
      <div className="container relative z-10 mx-auto max-w-6xl px-5 pb-12 pt-8 sm:px-6 sm:pb-14 sm:pt-10 md:pb-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.3fr_1fr] md:gap-8">
          <div className="space-y-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/80 bg-card">
                <RepoLensLogo size="sm" id="footer-logo" variant={isLanding ? "light" : "auto"} />
              </span>
              <span className="text-sm font-semibold text-foreground">RepoLens</span>
            </div>

            <div className="flex items-center gap-3 text-muted-foreground">
              <a href="https://twitter.com" aria-label="Twitter" className="transition-colors hover:text-foreground">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="https://linkedin.com" aria-label="LinkedIn" className="transition-colors hover:text-foreground">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="https://github.com" aria-label="GitHub" className="transition-colors hover:text-foreground">
                <Github className="h-4 w-4" />
              </a>
            </div>

            <p className="text-sm text-muted-foreground">
              © {year} RepoLens. All rights reserved.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-8 md:grid-cols-4 md:gap-x-10">
            {linkGroups.map((group) => (
              <nav key={group.title} className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="transition-colors hover:text-foreground">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
      </div>

      {isLanding && (
        <>
          {/* Background animated word */}
          <div
            ref={textRef}
            className="pointer-events-none absolute inset-0 z-0 flex items-end justify-center pb-3 select-none sm:pb-4 md:pb-6"
          >
            <div className="flex gap-3 text-[72px] font-extrabold tracking-[0.14em] text-foreground/8 sm:text-[130px] md:text-[170px]">
              {"REPOLENS".split("").map((ch, i) => (
                <span key={`${ch}-${i}`} className="footer-letter inline-block">
                  {ch}
                </span>
              ))}
            </div>
          </div>

          {/* Physics pills */}
          <div
            ref={physicsContainerRef}
            className="pointer-events-none absolute inset-0 z-20"
          >
            {physicsItems.map((item, i) => (
              <div
                key={item}
                className="physics-object pointer-events-auto absolute rounded-full border border-border bg-card px-3 py-2 md:px-6 md:py-4 text-xs font-semibold text-foreground shadow-sm sm:text-sm opacity-0 cursor-grab active:cursor-grabbing touch-none select-none"
                style={{
                  left: `${8 + (i % 5) * 18}%`,
                  top: `${8 + Math.floor(i / 5) * 16}%`,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </>
      )}
    </footer>
  );
}
