"use client";

import { motion } from "framer-motion";

const FIGURES = [
  {
    id: "fig-1",
    label: "FIG 0.2",
    title: "Built for codebases",
    description:
      "RepoLens is shaped for how engineering teams explore, document, and ship. Connect a repo and get structure, dependencies, and AI chat in one place.",
    Illustration: FigLayers,
  },
  {
    id: "fig-2",
    label: "FIG 0.3",
    title: "Powered by AI",
    description:
      "Ask questions in plain language, generate docs, and trace dependencies. The assistant understands your project layout and code.",
    Illustration: FigBlocks,
  },
  {
    id: "fig-3",
    label: "FIG 8.4",
    title: "Designed for velocity",
    description:
      "Less context switching, fewer “where is this?” moments. Surface insights and docs so your team can move fast without losing context.",
    Illustration: FigRays,
  },
] as const;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export function FeatureFiguresSection() {
  return (
    <section className="hero-dark bg-[#0a0a0a] px-4 py-16 md:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="mb-12 max-w-3xl md:mb-16"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-white md:text-3xl lg:text-4xl">
            Built for how engineering teams ship.
          </h2>
          <p className="text-base leading-relaxed text-zinc-400 md:text-lg">
            Purpose-built for modern teams with AI at its core. RepoLens brings structure, docs, and insights to your repositories so you can ship with clarity.
          </p>
        </motion.div>
        {/* <motion.div
          className="grid gap-12 md:grid-cols-3 md:gap-8 lg:gap-12"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          {FIGURES.map((fig) => (
            <motion.article
              key={fig.id}
              variants={item}
              className="group flex flex-col"
            >
              <span className="mb-4 inline-block text-xs font-medium uppercase tracking-wider text-zinc-500">
                {fig.label}
              </span>
              <div className="relative mb-6 flex min-h-[140px] items-center justify-center overflow-hidden rounded-lg border border-white/5 bg-white/2 transition-colors duration-300 group-hover:border-white/10 group-hover:bg-white/4 md:min-h-[160px]">
                <fig.Illustration />
              </div>
              <h3 className="mb-2 text-lg font-semibold tracking-tight text-white md:text-xl">
                {fig.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400 md:text-base">
                {fig.description}
              </p>
            </motion.article>
          ))}
        </motion.div> */}
      </div>
    </section>
  );
}

function FigLayers() {
  return (
    <motion.svg
      viewBox="0 0 120 100"
      className="h-20 w-24 text-zinc-600 transition-colors duration-300 group-hover:text-zinc-500 md:h-24 md:w-28"
      initial="idle"
      whileHover="hover"
      variants={{
        idle: {},
        hover: { scale: 1.02 },
      }}
    >
      <motion.rect
        x="20"
        y="50"
        width="80"
        height="12"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        variants={{ idle: { opacity: 0.5 }, hover: { opacity: 0.9 } }}
      />
      <motion.rect
        x="24"
        y="36"
        width="72"
        height="12"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        variants={{ idle: { opacity: 0.6 }, hover: { opacity: 1 } }}
      />
      <motion.rect
        x="28"
        y="22"
        width="64"
        height="12"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        variants={{ idle: { opacity: 0.7 }, hover: { opacity: 1 } }}
      />
      <motion.rect
        x="32"
        y="8"
        width="56"
        height="12"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        variants={{ idle: { opacity: 1 }, hover: { opacity: 1 } }}
      />
      <motion.circle
        cx="60"
        cy="14"
        r="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        variants={{ idle: { opacity: 0.8 }, hover: { opacity: 1 } }}
      />
      <motion.line
        x1="58"
        y1="12"
        x2="62"
        y2="16"
        stroke="currentColor"
        strokeWidth="1"
        variants={{ idle: { opacity: 0.6 }, hover: { opacity: 1 } }}
      />
      <motion.line
        x1="62"
        y1="12"
        x2="58"
        y2="16"
        stroke="currentColor"
        strokeWidth="1"
        variants={{ idle: { opacity: 0.6 }, hover: { opacity: 1 } }}
      />
    </motion.svg>
  );
}

function FigBlocks() {
  return (
    <motion.svg
      viewBox="0 0 120 100"
      className="h-20 w-24 text-zinc-600 transition-colors duration-300 group-hover:text-zinc-500 md:h-24 md:w-28"
      initial="idle"
      whileHover="hover"
      variants={{
        idle: {},
        hover: { scale: 1.02 },
      }}
    >
      <motion.path
        d="M30 60 L50 48 L50 72 L30 84 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        variants={{ idle: { opacity: 0.6 }, hover: { opacity: 1 } }}
      />
      <motion.path
        d="M50 48 L70 60 L70 84 L50 72 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        variants={{ idle: { opacity: 0.6 }, hover: { opacity: 1 } }}
      />
      <motion.path
        d="M50 24 L70 36 L70 60 L50 48 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        variants={{ idle: { opacity: 0.8 }, hover: { opacity: 1 } }}
      />
      <motion.path
        d="M30 36 L50 24 L50 48 L30 60 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        variants={{ idle: { opacity: 0.8 }, hover: { opacity: 1 } }}
      />
    </motion.svg>
  );
}

function FigRays() {
  return (
    <motion.svg
      viewBox="0 0 120 100"
      className="h-20 w-24 text-zinc-600 transition-colors duration-300 group-hover:text-zinc-500 md:h-24 md:w-28"
      initial="idle"
      whileHover="hover"
      variants={{
        idle: {},
        hover: { scale: 1.02 },
      }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.rect
          key={i}
          x={24 + i * 18}
          y={20 + i * 4}
          width="14"
          height="56"
          rx="1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          variants={{
            idle: { opacity: 0.4 + i * 0.12 },
            hover: { opacity: 0.7 + i * 0.08 },
          }}
        />
      ))}
    </motion.svg>
  );
}
