"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { cn } from "@/lib/utils";

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
    <section
      id="features"
      className="hero-dark bg-[#0a0a0a] px-4 py-16 md:py-24 lg:px-8"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="mb-12 max-w-3xl md:mb-16"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <h2
            id="features-heading"
            className="mb-3 text-2xl font-semibold tracking-tight text-white md:text-3xl lg:text-4xl"
          >
            Understand any repository without burning your AI tokens.
          </h2>
          <p className="text-base leading-relaxed text-zinc-400 md:text-lg">
            RepoLens helps developers explore unfamiliar codebases, trace
            dependencies, and surface architecture instantly. Get the context
            you need before opening your IDE, so you spend less time digging and
            more time building.
          </p>
        </motion.div>
        <motion.div
          className="grid gap-12 md:grid-cols-3 md:gap-8 lg:gap-12"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          role="list"
        >
          {FIGURES.map((fig) => (
            <motion.article
              key={fig.id}
              variants={item}
              className="group flex flex-col"
              role="listitem"
            >
              <span className="mb-4 inline-block text-xs font-medium uppercase tracking-wider text-zinc-500">
                {fig.label}
              </span>
              <div
                className={cn(
                  "relative mb-8 flex min-h-[240px] items-center justify-center overflow-hidden rounded-xl",
                  "transition-all duration-300",
                  "md:min-h-[300px] lg:min-h-[340px]"
                )}
              >
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
        </motion.div>
      </div>
    </section>
  );
}

// ─── FigLayers: Codebase view with magnifier scan ─────────────────────────────

function FigLayers() {
  const [hovered, setHovered] = useState(false);
  const lensX = useMotionValue(100);
  const lensY = useMotionValue(50);
  const animRef = useRef<(() => void) | null>(null);

  const CONTENT_X = 52;
  const CONTENT_Y = 22;
  const LINE_H = 3.8;
  const LINE_GAP = 4.8;
  const LENS_R = 13;

  // Window bounds — keep lens strictly inside
  const WIN_X1 = CONTENT_X + LENS_R + 2;
  const WIN_X2 = 176 - LENS_R - 2;
  const WIN_Y1 = CONTENT_Y + LENS_R + 4;
  const WIN_Y2 = 128 - LENS_R - 4;

  const codeLines = [
    { indent: 0,  w: 68 },
    { indent: 0,  w: 50 },
    { indent: 10, w: 60 },
    { indent: 10, w: 42 },
    { indent: 20, w: 36 },
    { indent: 20, w: 54 },
    { indent: 10, w: 58 },
    { indent: 0,  w: 64 },
    { indent: 0,  w: 40 },
    { indent: 10, w: 56 },
    { indent: 10, w: 32 },
    { indent: 20, w: 46 },
    { indent: 0,  w: 66 },
  ];

  const sidebarItems = [
    { w: 24 }, { w: 16 }, { w: 20 }, { w: 13 },
    { w: 18 }, { w: 15 }, { w: 22 }, { w: 11 },
    { w: 19 }, { w: 14 }, { w: 21 },
  ];

  // Zigzag scan — clamped to window bounds
  const scanPath = codeLines.flatMap((line, i) => {
    const cy = Math.min(Math.max(CONTENT_Y + 8 + i * (LINE_H + LINE_GAP) + LINE_H / 2, WIN_Y1), WIN_Y2);
    const xL = Math.max(CONTENT_X + 10, WIN_X1);
    const xR = Math.min(CONTENT_X + 10 + line.w, WIN_X2);
    return i % 2 === 0
      ? [{ x: xL, y: cy }, { x: xR, y: cy }]
      : [{ x: xR, y: cy }, { x: xL, y: cy }];
  });

  useEffect(() => {
    if (!hovered) {
      if (animRef.current) animRef.current();
      animate(lensX, 100, { duration: 0.5, ease: "easeOut" });
      animate(lensY, 50,  { duration: 0.5, ease: "easeOut" });
      return;
    }

    const xs    = scanPath.map(p => p.x);
    const ys    = scanPath.map(p => p.y);
    const dur   = scanPath.length * 0.30;
    const times = scanPath.map((_, i) => i / (scanPath.length - 1));

    const a1 = animate(lensX, xs, {
      duration: dur, ease: "easeInOut", times,
      repeat: Infinity, repeatType: "loop", repeatDelay: 0.5,
    });
    const a2 = animate(lensY, ys, {
      duration: dur, ease: "easeInOut", times,
      repeat: Infinity, repeatType: "loop", repeatDelay: 0.5,
    });

    animRef.current = () => { a1.stop(); a2.stop(); };
    return () => { a1.stop(); a2.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lensX, lensY, scanPath are stable; only hovered should trigger
  }, [hovered]);

  // Handle: bottom-right of lens, clamped inside window
  const HANDLE_LEN = 9;
  const HX1 = useTransform(lensX, x => x + LENS_R * 0.66);
  const HY1 = useTransform(lensY, y => y + LENS_R * 0.66);
  const HX2 = useTransform(lensX, x => Math.min(x + LENS_R * 0.66 + HANDLE_LEN, WIN_X2 + LENS_R));
  const HY2 = useTransform(lensY, y => Math.min(y + LENS_R * 0.66 + HANDLE_LEN, WIN_Y2 + LENS_R));

  return (
    <div
      className="flex h-full w-full items-center justify-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg
        viewBox="0 0 180 132"
        className="h-48 w-64 md:h-56 md:w-72 lg:h-64 lg:w-80"
      >
        <defs>
          {/* Clip everything to window shape */}
          <clipPath id="fl-win">
            <rect x="0.5" y="0.5" width="179" height="131" rx="7" />
          </clipPath>

          {/* Clip content area only */}
          <clipPath id="fl-content">
            <rect x={CONTENT_X} y={CONTENT_Y} width="126" height="110" />
          </clipPath>

          {/* Moving circular clip for magnifier reveal */}
          <clipPath id="fl-lens-clip">
            <motion.circle cx={lensX} cy={lensY} r={LENS_R - 1} />
          </clipPath>

          {/* Soft glow for lens ring */}
          <filter id="fl-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── Window background ── */}
        <g clipPath="url(#fl-win)">
          <rect x="0" y="0" width="180" height="132" fill="#0d0d0d" />

          {/* Title bar */}
          <rect x="0" y="0" width="180" height="21" fill="#131313" />
          <line x1="0" y1="21" x2="180" y2="21" stroke="rgba(255,255,255,0.07)" strokeWidth="0.6" />

          {/* Sidebar */}
          <rect x="0" y="21" width="46" height="111" fill="#0f0f0f" />
          <line x1="46" y1="21" x2="46" y2="132" stroke="rgba(255,255,255,0.07)" strokeWidth="0.6" />
        </g>

        {/* Window border */}
        <rect x="0.5" y="0.5" width="179" height="131" rx="7"
          fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />

        {/* Traffic lights */}
        {[
          { cx: 12, color: "#ff5f57", d: "0ms"   },
          { cx: 23, color: "#febc2e", d: "70ms"  },
          { cx: 34, color: "#28c840", d: "140ms" },
        ].map((dot, i) => (
          <circle key={i} cx={dot.cx} cy="11" r="3.3"
            fill={hovered ? dot.color : "rgba(255,255,255,0.12)"}
            style={{ transition: `fill 0.35s ease ${dot.d}` }}
          />
        ))}

        {/* Title pill */}
        <rect x="75" y="8" width="30" height="6" rx="3" fill="rgba(255,255,255,0.06)" />

        {/* ── Sidebar items ── */}
        {sidebarItems.map((item, i) => (
          <rect key={i}
            x="7" y={26 + i * 9}
            width={item.w} height="2.5" rx="1.25"
            fill="rgba(255,255,255,0.22)"
            style={{
              opacity: hovered ? 0.7 : 0.4,
              transition: `opacity 0.4s ease ${i * 28}ms`,
            }}
          />
        ))}

        {/* ── BASE code lines (dim) ── */}
        <g clipPath="url(#fl-content)">
          {codeLines.map((line, i) => (
            <rect key={i}
              x={CONTENT_X + 8 + line.indent}
              y={CONTENT_Y + 7 + i * (LINE_H + LINE_GAP)}
              width={line.w} height={LINE_H} rx="1.4"
              fill="rgba(255,255,255,0.22)"
              style={{
                opacity: hovered ? 0.25 : 0.35,
                transition: `opacity 0.4s ease ${i * 15}ms`,
              }}
            />
          ))}
        </g>

        {/* ── MAGNIFIED lines (inside lens only — bright reveal) ── */}
        <g clipPath="url(#fl-lens-clip)"
          style={{ opacity: hovered ? 1 : 0, transition: "opacity 0.2s ease" }}>
          <rect x={CONTENT_X} y={CONTENT_Y} width="126" height="110"
            fill="rgba(255,255,255,0.04)" />
          {codeLines.map((line, i) => (
            <rect key={i}
              x={CONTENT_X + 8 + line.indent}
              y={CONTENT_Y + 7 + i * (LINE_H + LINE_GAP)}
              width={line.w} height={LINE_H} rx="1.4"
              fill="rgba(255,255,255,0.85)"
            />
          ))}
        </g>

        {/* ── MAGNIFIER — rendered inside window clip ── */}
        <g clipPath="url(#fl-win)"
          style={{ opacity: hovered ? 1 : 0, transition: "opacity 0.2s ease" }}>

          {/* Outer body ring (thick, like the SVG reference) */}
          <motion.circle
            cx={lensX} cy={lensY} r={LENS_R}
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="3.5"
          />

          {/* Inner crisp ring */}
          <motion.circle
            cx={lensX} cy={lensY} r={LENS_R}
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="0.8"
            filter="url(#fl-glow)"
          />

          {/* Glass fill — very subtle */}
          <motion.circle
            cx={lensX} cy={lensY} r={LENS_R - 2}
            fill="rgba(255,255,255,0.03)"
          />

          {/* Specular arc — top-left shine (exact style from reference SVG) */}
          <motion.path
            d={useTransform(
              [lensX, lensY],
              ([cx, cy]: number[]) => {
                const r = LENS_R - 4;
                const a1 = (-145 * Math.PI) / 180;
                const a2 = (-45  * Math.PI) / 180;
                const x1 = cx + r * Math.cos(a1);
                const y1 = cy + r * Math.sin(a1);
                const x2 = cx + r * Math.cos(a2);
                const y2 = cy + r * Math.sin(a2);
                return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
              }
            )}
            fill="none"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />

          {/* Crosshair — horizontal */}
          <motion.line
            x1={useTransform(lensX, x => x - LENS_R + 4)}
            y1={lensY}
            x2={useTransform(lensX, x => x + LENS_R - 4)}
            y2={lensY}
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="0.4"
          />
          {/* Crosshair — vertical */}
          <motion.line
            x1={lensX}
            y1={useTransform(lensY, y => y - LENS_R + 4)}
            x2={lensX}
            y2={useTransform(lensY, y => y + LENS_R - 4)}
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="0.4"
          />

          {/* Handle shaft — thick rounded, matches reference */}
          <motion.line
            x1={HX1} y1={HY1}
            x2={HX2} y2={HY2}
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Handle shine */}
          <motion.line
            x1={HX1} y1={HY1}
            x2={HX2} y2={HY2}
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1"
            strokeLinecap="round"
          />

        </g>

      </svg>
    </div>
  );
}



const MAX_MESSAGES = 3;
const MAX_WORDS = 8;
 
// Suggested chip replies — matched by exact chip text
const CHIP_REPLIES: Record<string, string> = {
  "What does AuthService do?":
    "AuthService owns the full auth lifecycle — login, token issuance, refresh, and revocation. It sits behind middleware applied to every protected route.",
  "Trace dependencies of UserController":
    "UserController depends on UserService, AuthGuard, and the Prisma ORM layer. Pull any of those and the DI container throws before the app boots.",
  "Explain the folder structure":
    "The repo uses a feature-slice layout — each domain folder owns its controller, service, DTO, and schema. Top-level folders map 1:1 to API route groups.",
  "Where is JWT handled?":
    "JWT signing lives in auth/jwt.strategy.ts, pulling the secret from ConfigService. Every guarded route runs the token through a Passport strategy before the handler executes.",
};
 
// For anything the user types freely — honest, codebase-AI-style
const FREE_RESPONSES = [
  "Connect a real repo and I can answer that precisely, right now I'm running on demo data.",
  "That's outside my demo index. Link your repository and I'll trace it to the exact file and line.",
  "No match in the current snapshot. With a live repo connected, I'd resolve that against the full AST.",
  "Demo mode only covers the sample project. Point me at a real codebase and I'll give you a proper answer.",
];
let _freeIdx = 0;
 
function getReply(query: string): string {
  if (CHIP_REPLIES[query]) return CHIP_REPLIES[query];
  return FREE_RESPONSES[_freeIdx++ % FREE_RESPONSES.length];
}
 
const SUGGESTED = [
  "What does AuthService do?",
  "Trace dependencies of UserController",
  "Explain the folder structure",
  "Where is JWT handled?",
];
 
function getWordCount(text: string) {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}
 
function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          data-delay={i}
          className="fig-dot h-1 w-1 shrink-0 rounded-full bg-white/40 inline-block"
        />
      ))}
    </span>
  );
}
 
export function FigBlocks() {
  type Msg = { role: "user" | "assistant"; content: string };
 
  const [messages, setMessages]     = useState<Msg[]>([]);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [streamText, setStreamText] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef         = useRef<HTMLInputElement>(null);
 
  const wordCount   = getWordCount(input);
  const isOver      = wordCount > MAX_WORDS;
  const userCount   = messages.filter((m) => m.role === "user").length;
  const isMaxed     = userCount >= MAX_MESSAGES;
  const canSend     = !!input.trim() && !isOver && !isMaxed && !loading;
 
  useEffect(() => {
    // Scroll only the chat container — never the document. Prevents page jitter.
    if ((messages.length > 0 || streamText || loading) && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, streamText, loading]);
 
  const send = useCallback(async (overrideText?: string | React.MouseEvent) => {
    const text = typeof overrideText === "string" ? overrideText : input;
    const trimmed = text.trim();
    if (!trimmed || isOver || isMaxed || loading) return;
 
    const userMsg: Msg = { role: "user", content: trimmed };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    setStreamText("");
 
    // Pick a reply based on what the user typed
    const response = getReply(trimmed);
 
    // Loading dots phase — 900ms
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
 
    // Typewriter phase
    let full = "";
    for (let i = 0; i < response.length; i++) {
      full += response[i];
      setStreamText(full);
      // Vary speed slightly for natural feel
      const delay = response[i] === "." || response[i] === "," ? 55 : 18;
      await new Promise((r) => setTimeout(r, delay));
    }
 
    setMessages((prev) => [...prev, { role: "assistant", content: full }]);
    setStreamText("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [input, messages, isMaxed, isOver, loading]);
 
  const clearAll = () => {
    setMessages([]);
    setStreamText("");
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };
 
  const isEmpty = messages.length === 0 && !streamText && !loading;
 
  return (
    <div className="w-full font-mono">
      {/* ── Main box — FIXED height, no grow ── */}
      <div className="flex h-[230px] flex-col overflow-hidden rounded-[10px] border border-white/8 bg-[#0a0a0a]">
        {/* Messages area — fixed height, scrolls internally */}
        <div
          ref={scrollContainerRef}
          className="fig-blocks-scroll flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-2.5"
        >
          {/* ── Premium empty state ── */}
          {isEmpty && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2.5 py-1">
              {/* Icon + label */}
              <div className="text-center">
                <div className="mx-auto mb-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border border-white/14 bg-white/7 text-[13px] text-white/55">
                  ⬡
                </div>
                <div className="mb-0.5 text-[10px] uppercase tracking-widest text-white/52">
                  Ask about your codebase
                </div>
                <div className="text-[9px] tracking-[0.06em] text-white/25">
                  trace · explore · understand
                </div>
              </div>

              {/* Suggested chips */}
              <div className="flex max-w-[280px] flex-wrap justify-center gap-1.5">
                {SUGGESTED.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => send(s)}
                    className="cursor-pointer rounded-md border border-white/12 bg-white/5 px-2 py-1 font-inherit text-[9px] leading-relaxed tracking-[0.02em] text-white/50 transition-all duration-[0.18s] hover:border-white/24 hover:bg-white/11 hover:text-white/88"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) =>
            msg.role === "user" ? (
              /* User bubble — right */
              <div
                key={i}
                className="max-w-[78%] self-end rounded-br-sm rounded-bl-lg rounded-tl-lg rounded-tr-lg border border-white/13 bg-white/9 px-2.5 py-1.5 text-[10px] leading-[1.55] text-white/80 animate-[figFadeUp_0.22s_ease]"
              >
                {msg.content}
              </div>
            ) : (
              /* AI bubble — left */
              <div
                key={i}
                className="flex gap-1.5 self-start animate-[figFadeUp_0.22s_ease]"
              >
                <div className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border border-white/12 bg-white/6 text-[9px] text-white/40">
                  ⬡
                </div>
                <div className="max-w-[calc(78%-24px)] rounded-br-lg rounded-bl-sm rounded-tl-lg rounded-tr-lg border border-white/7 bg-white/4 px-2.5 py-1.5 text-[10px] leading-[1.55] text-white/68">
                  {msg.content}
                </div>
              </div>
            )
          )}

          {/* Streaming text */}
          {streamText && (
            <div className="flex gap-1.5 self-start animate-[figFadeUp_0.22s_ease]">
              <div className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border border-white/12 bg-white/6 text-[9px] text-white/40">
                ⬡
              </div>
              <div className="max-w-[calc(78%-24px)] rounded-br-lg rounded-bl-sm rounded-tl-lg rounded-tr-lg border border-white/7 bg-white/4 px-2.5 py-1.5 text-[10px] leading-[1.55] text-white/68">
                {streamText}
                <span className="ml-0.5 inline-block h-2.5 w-[1.5px] align-middle rounded-sm bg-white/60 animate-[figBlink_0.7s_step-end_infinite]" />
              </div>
            </div>
          )}

          {/* Loading dots — before stream begins */}
          {loading && !streamText && (
            <div className="flex gap-1.5 self-start">
              <div className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border border-white/12 bg-white/6 text-[9px] text-white/40">
                ⬡
              </div>
              <div className="rounded-br-lg rounded-bl-sm rounded-tl-lg rounded-tr-lg border border-white/7 bg-white/4 px-2.5 py-1.5">
                <LoadingDots />
              </div>
            </div>
          )}

        </div>

        {/* ── Input row ── */}
        <div className="flex items-center gap-1.5 border-t border-white/7 bg-white/1.5 px-2.5 py-1.5">
          {/* Input + word counter */}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={isMaxed ? "Clear to continue..." : "Comment..."}
              disabled={isMaxed || loading}
              maxLength={100}
              className={cn(
                "w-full rounded-md border bg-white/4 px-2.5 py-1.5 pr-8 font-inherit text-[10px] tracking-[0.02em] text-white/82 outline-none transition-[border-color] duration-[0.18s]",
                isOver && "border-red-500/45",
                !isOver && "border-white/9",
                isMaxed && "cursor-not-allowed opacity-40",
                !isMaxed && "cursor-text"
              )}
            />
            {input.length > 0 && (
              <span
                className={cn(
                  "pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 font-inherit text-[8px] tracking-[0.04em]",
                  isOver ? "text-red-500/70" : "text-white/22"
                )}
              >
                {wordCount}/{MAX_WORDS}
              </span>
            )}
          </div>

          {/* Send button */}
          <button
            type="button"
            onClick={() => send()}
            disabled={!canSend}
            className={cn(
              "flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md border transition-all duration-[0.18s]",
              canSend
                ? "cursor-pointer border-white/18 bg-white/10 text-white/75 hover:scale-[1.06] hover:bg-white/16"
                : "cursor-not-allowed border-white/7 bg-white/3 text-white/20"
            )}
          >
            {loading ? (
              <div className="h-2.5 w-2.5 animate-[figSpin_0.7s_linear_infinite] rounded-full border-[1.5px] border-white/15 border-t-white/60" />
            ) : (
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0"
              >
                <path
                  d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-2.5 pb-1.5 pt-0.5">
          <span className="text-[8px] tracking-[0.05em] text-white/18">
            {isMaxed ? "max reached" : `${MAX_MESSAGES - userCount} left`}
          </span>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="border-none bg-transparent p-0 font-inherit text-[8px] tracking-[0.05em] text-white/20 cursor-pointer transition-colors duration-[0.18s] hover:text-white/50"
            >
              clear all
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── FigRays — OrbitingCircles with CompanyMarquee logos ──────────────────────
//
//  Uses OrbitingCircles with logos from CompanyMarquee (hero-dark color scheme).
//  Icons orbit like the Magic UI demo. Change sizes below to adjust icon dimensions.
//
import { OrbitingCircles } from "@/components/ui/orbiting-circles";
import {
  GitHubLogo,
  VercelLogo,
  OpenAILogo,
  DigitalOceanLogo,
  PostgreSQLLogo,
  AwsEc2Logo,
} from "@/components/landing/CompanyMarquee";

/** Icon sizes in px — change these to resize logos on each orbit */
const OUTER_ICON_SIZE = 36;
const INNER_ICON_SIZE = 24;

export function FigRays() {
  return (
    <div className="relative h-full w-full min-h-[240px] overflow-hidden">
      <div className="absolute inset-0">
        <OrbitingCircles
        iconSize={OUTER_ICON_SIZE}
        radius={100}
        className="text-white/70"
      >
        <GitHubLogo size={OUTER_ICON_SIZE} />
        <VercelLogo size={OUTER_ICON_SIZE} />
        <OpenAILogo size={OUTER_ICON_SIZE} />
        <DigitalOceanLogo size={OUTER_ICON_SIZE} />
        <PostgreSQLLogo size={OUTER_ICON_SIZE} />
        <AwsEc2Logo size={OUTER_ICON_SIZE} />
      </OrbitingCircles>
      </div>
      <div className="absolute inset-0">
        <OrbitingCircles
        iconSize={INNER_ICON_SIZE}
        radius={55}
        reverse
        speed={2}
        className="text-white/50"
      >
        <GitHubLogo size={INNER_ICON_SIZE} />
        <VercelLogo size={INNER_ICON_SIZE} />
        <OpenAILogo size={INNER_ICON_SIZE} />
        <DigitalOceanLogo size={INNER_ICON_SIZE} />
      </OrbitingCircles>
      </div>
    </div>
  );
}
 