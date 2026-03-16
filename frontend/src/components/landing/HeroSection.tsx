"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Spotlight } from "@/components/ui/spotlight";
import { HeroEmbeddedDashboard } from "./HeroEmbeddedDashboard";
import { NoiseBackground } from "./NoiseBackground";

// ─── Shard configs ────────────────────────────────────────────────────────────

interface LetterShardConfig {
  clip: string;
  dx: number;
  dy: number;
  dz: number;
  rotX: number;
  rotY: number;
}

const I_SHARDS: LetterShardConfig[] = [
  {
    clip: "0,0 60,0 48,20 12,18 0,30",
    dx: -3,
    dy: -5,
    dz: 14,
    rotX: 8,
    rotY: -6,
  },
  {
    clip: "12,18 48,20 60,0 60,38 40,42 0,38 0,30",
    dx: 2,
    dy: 1,
    dz: 20,
    rotX: -4,
    rotY: 3,
  },
  {
    clip: "0,38 40,42 60,38 60,62 44,58 0,54",
    dx: -2,
    dy: 3,
    dz: 18,
    rotX: -5,
    rotY: -4,
  },
  {
    clip: "0,54 44,58 60,62 60,80 0,80",
    dx: -4,
    dy: 6,
    dz: 12,
    rotX: -8,
    rotY: -5,
  },
];
const I_GLINT = "M4 8 L56 72";

const D_SHARDS: LetterShardConfig[] = [
  {
    clip: "0,0 60,0 56,16 30,14 0,24",
    dx: 3,
    dy: -6,
    dz: 16,
    rotX: 10,
    rotY: 7,
  },
  {
    clip: "30,14 56,16 60,0 60,36 46,40 22,36",
    dx: 5,
    dy: -2,
    dz: 22,
    rotX: -3,
    rotY: 8,
  },
  {
    clip: "0,24 30,14 22,36 46,40 18,52 0,46",
    dx: -3,
    dy: 2,
    dz: 18,
    rotX: 4,
    rotY: -5,
  },
  {
    clip: "0,46 18,52 46,40 60,36 60,80 0,80",
    dx: -2,
    dy: 7,
    dz: 12,
    rotX: -9,
    rotY: -4,
  },
];
const D_GLINT = "M6 6 L54 74";

const E_SHARDS: LetterShardConfig[] = [
  {
    clip: "0,0 60,0 54,22 16,18 0,28",
    dx: 4,
    dy: -5,
    dz: 14,
    rotX: 9,
    rotY: 7,
  },
  {
    clip: "16,18 54,22 60,0 60,44 36,48 0,40 0,28",
    dx: -2,
    dy: 1,
    dz: 20,
    rotX: -4,
    rotY: -4,
  },
  {
    clip: "0,40 36,48 60,44 60,62 28,58 0,54",
    dx: 2,
    dy: 4,
    dz: 16,
    rotX: -6,
    rotY: 5,
  },
  {
    clip: "0,54 28,58 60,62 60,80 0,80",
    dx: 5,
    dy: 7,
    dz: 10,
    rotX: -8,
    rotY: 6,
  },
];
const E_GLINT = "M5 8 L55 72";

// ─── LetterFracture ───────────────────────────────────────────────────────────

interface LetterFractureProps {
  letter: string;
  shards: LetterShardConfig[];
  glint: string;
  baseDelay: number;
}

function LetterFracture({
  letter,
  shards,
  glint,
  baseDelay,
}: LetterFractureProps) {
  const uid = `lf-${letter}-${Math.round(baseDelay * 100)}`;

  return (
    <span
      className="relative inline-block"
      style={{ perspective: 900, perspectiveOrigin: "50% 50%" }}
    >
      <svg
        viewBox="0 0 60 80"
        className="overflow-visible align-middle"
        style={{
          height: "0.95em",
          width: "auto",
          verticalAlign: "middle",
          marginBottom: "0.04em",
        }}
        aria-hidden
      >
        <defs>
          {shards.map((s, i) => (
            <clipPath
              key={i}
              id={`${uid}-c${i}`}
              clipPathUnits="userSpaceOnUse"
            >
              <polygon points={s.clip} />
            </clipPath>
          ))}
        </defs>

        <motion.text
          x="30"
          y="72"
          textAnchor="middle"
          fontSize="72"
          fontWeight="700"
          fill="white"
          style={{ fontFamily: "inherit" }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: baseDelay + 0.02, duration: 0.05 }}
        >
          {letter}
        </motion.text>

        <motion.path
          d={glint}
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1], opacity: [0, 0.7, 0] }}
          transition={{
            delay: baseDelay - 0.06,
            duration: 0.14,
            opacity: { times: [0, 0.15, 1] },
            ease: "easeOut",
          }}
        />

        {shards.map((s, i) => (
          <motion.g
            key={i}
            clipPath={`url(#${uid}-c${i})`}
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: "30px 40px",
            }}
            initial={{ opacity: 0, x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0 }}
            animate={{
              opacity: [0, 1, 1, 1, 0.12],
              x: [0, s.dx, s.dx + 1, s.dx - 0.7, s.dx],
              y: [0, s.dy, s.dy - 0.6, s.dy + 1.8, s.dy + 1.4],
              z: [0, s.dz * 0.7, s.dz, s.dz * 0.9, s.dz * 0.8],
              rotateX: [0, s.rotX * 0.5, s.rotX, s.rotX * 0.88, s.rotX * 0.78],
              rotateY: [0, s.rotY * 0.5, s.rotY, s.rotY * 0.88, s.rotY * 0.78],
            }}
            transition={{
              delay: baseDelay + i * 0.018,
              duration: 0.6,
              times: [0, 0.16, 0.38, 0.62, 1],
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <text
              x="30"
              y="72"
              textAnchor="middle"
              fontSize="72"
              fontWeight="700"
              fill="rgba(255,255,255,0.85)"
              style={{
                fontFamily: "inherit",
                filter: "drop-shadow(0 0 6px rgba(255,255,255,0.15))",
              }}
            >
              {letter}
            </text>
          </motion.g>
        ))}

        <motion.path
          d={glint}
          fill="none"
          stroke="rgba(255,255,255,0.88)"
          strokeWidth="1.8"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1], opacity: [0, 1, 0] }}
          transition={{
            delay: baseDelay + 0.01,
            duration: 0.2,
            opacity: { times: [0, 0.22, 1] },
            ease: "easeOut",
          }}
        />

        <motion.text
          x="30"
          y="72"
          textAnchor="middle"
          fontSize="72"
          fontWeight="700"
          fill="transparent"
          stroke="transparent"
          style={{ fontFamily: "inherit" }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.32, 0],
            filter: [
              "none",
              "drop-shadow(1.5px 0px 0px rgba(255,50,50,0.65)) drop-shadow(-1.5px 0px 0px rgba(0,210,255,0.65))",
              "none",
            ],
          }}
          transition={{
            delay: baseDelay + 0.02,
            duration: 0.16,
            times: [0, 0.28, 1],
            ease: "easeOut",
          }}
        >
          {letter}
        </motion.text>
      </svg>
    </span>
  );
}

// ─── IDEFracture ──────────────────────────────────────────────────────────────

function IDEFracture() {
  return (
    <span className="inline-flex items-center -space-x-[0.18em]">
      <LetterFracture
        letter="I"
        shards={I_SHARDS}
        glint={I_GLINT}
        baseDelay={0.18}
      />
      <LetterFracture
        letter="D"
        shards={D_SHARDS}
        glint={D_GLINT}
        baseDelay={0.28}
      />
      <LetterFracture
        letter="E"
        shards={E_SHARDS}
        glint={E_GLINT}
        baseDelay={0.38}
      />
    </span>
  );
}

// ─── HeroSection ──────────────────────────────────────────────────────────────

export function HeroSection() {
  return (
    <section className="hero-dark relative flex min-h-0 w-full flex-col overflow-x-hidden bg-background text-foreground sm:min-h-[90vh]">
      {/* ── Noise background — absolute, sits behind everything at z-0 ── */}
      {/* <NoiseBackground /> */}
      <Spotlight />
      <div className="container relative mx-auto flex w-full flex-1 flex-col items-center justify-center overflow-hidden px-4 py-12 sm:py-16 md:py-20 min-h-[70vh] sm:min-h-[75vh] md:min-h-[80vh]">
        <div className="relative z-10 flex flex-col items-center justify-center gap-6 sm:gap-8 md:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex max-w-4xl flex-col items-center gap-4 text-center sm:gap-6"
          >
            <h1 className="flex max-w-4xl flex-col text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl md:leading-tight lg:text-6xl">
              <span className="text-center">
                Understand your codebase
                {/* <span className="hero-gradient-text inline-block">
                  codebase
                </span> */}
              </span>
              <span className="mt-1 inline-flex flex-wrap items-center justify-center gap-x-3 text-center md:mt-2">
                {"with "}
                <IDEFracture />
                <motion.span
                  className="hero-gradient-text inline-block cursor-default"
                  data-text="RepoLens"
                  initial={{ opacity: 0, scale: 0.94, filter: "blur(6px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  transition={{ delay: 0.75, duration: 0.58, ease: "easeOut" }}
                  whileHover={{
                    textShadow:
                      "0 0 12px rgba(255,255,255,0.6), 0 0 32px rgba(255,255,255,0.35)",
                    transition: { duration: 0.25 },
                  }}
                >
                  RepoLens
                </motion.span>
              </span>
            </h1>

            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base md:text-lg">
              Analyzes your repositories and surfaces insights, dependencies,
              and documentation, so you can ship faster.
            </p>

            <div className="relative flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-4 md:gap-5">
              <Button
                asChild
                variant="default"
                size="cta"
                className="w-full min-w-[140px] bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto sm:min-w-[160px] sm:px-8"
              >
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="cta"
                className="w-full min-w-[140px] border-white/20 text-foreground hover:bg-white/10 hover:text-foreground sm:w-auto sm:min-w-[160px] sm:px-8"
              >
                <Link href="/register">Get started</Link>
              </Button>

              <svg
                aria-hidden
                className="pointer-events-none absolute hidden md:block"
                style={{ left: "calc(70% + 46px)", top: "-6px" }}
                width="60"
                height="130"
                viewBox="0 0 60 130"
                fill="none"
              >
                <path
                  d="M1 24 C78 20, 54 36, 40 44 C26 52, 26 62, 38 68 C48 72, 44 86, 30 98 C24 104, 22 110, 24 116"
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M24 118 L14 106 M24 118 L36 108"
                  stroke="rgba(255,255,255, 0.95)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Dashboard — sits inside the section so the fade overlay covers the seam ── */}
      <div className="relative z-10 w-full shrink-0 px-3 pb-8 sm:px-4 sm:pb-12 md:pb-16 lg:px-8 lg:pb-20">
        <div className="mx-auto w-full max-w-[1440px]">
          <HeroEmbeddedDashboard />
        </div>
      </div>
    </section>
  );
}
