"use client";

import { useState, useEffect, useRef , useCallback } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
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
              <div
                className={`
                  relative mb-8 flex items-center justify-center overflow-hidden rounded-xl
                  transition-all duration-300
                  min-h-[240px] md:min-h-[300px] lg:min-h-[340px]
                `}
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
              [lensX, lensY] as const,
              ([cx, cy]: [number, number]) => {
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




const SYSTEM_PROMPT = `You are RepoLens AI — an expert assistant for understanding codebases.
You help developers explore repositories, trace dependencies, understand architecture, and answer code questions.
Keep responses SHORT — max 2 sentences. Be direct and technical. No fluff.`;

const MAX_MESSAGES = 3;
const MAX_WORDS = 8;

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
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 4, height: 4, borderRadius: "50%",
          background: "rgba(255,255,255,0.4)",
          display: "inline-block",
          animation: `figDot 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const wordCount   = getWordCount(input);
  const isOver      = wordCount > MAX_WORDS;
  const userCount   = messages.filter((m) => m.role === "user").length;
  const isMaxed     = userCount >= MAX_MESSAGES;
  const canSend     = !!input.trim() && !isOver && !isMaxed && !loading;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          system: SYSTEM_PROMPT,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          stream: true,
        }),
      });

      const reader = res.body!.getReader();
      const dec    = new TextDecoder();
      let full     = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const d = line.slice(6);
          if (d === "[DONE]") continue;
          try {
            const p = JSON.parse(d);
            if (p.type === "content_block_delta" && p.delta?.text) {
              full += p.delta.text;
              setStreamText(full);
            }
          } catch {}
        }
      }

      setMessages((prev) => [...prev, { role: "assistant", content: full }]);
      setStreamText("");
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection issue — try again." },
      ]);
      setStreamText("");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, messages, isOver, isMaxed, loading]);

  const clearAll = () => {
    setMessages([]);
    setStreamText("");
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const isEmpty = messages.length === 0 && !streamText && !loading;

  return (
    <div style={{
      width: "100%",
      fontFamily: "'Berkeley Mono','Fira Code','Cascadia Code',monospace",
    }}>
      {/* ── Main box — FIXED height, no grow ── */}
      <div style={{
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "#0a0a0a",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: 220,
      }}>

        {/* Messages area — fixed height, scrolls internally */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          scrollbarWidth: "none",
        }}>
          {/* ── Premium empty state ── */}
          {isEmpty && (
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "4px 0",
            }}>
              {/* Icon + label */}
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 7, margin: "0 auto 6px",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, color: "rgba(255,255,255,0.55)",
                }}>⬡</div>
                <div style={{
                  fontSize: 10, color: "rgba(255,255,255,0.52)",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  marginBottom: 3,
                }}>Ask about your codebase</div>
                <div style={{
                  fontSize: 9, color: "rgba(255,255,255,0.25)",
                  letterSpacing: "0.06em",
                }}>trace · explore · understand</div>
              </div>

              {/* Suggested chips */}
              <div style={{
                display: "flex", flexWrap: "wrap",
                gap: 5, justifyContent: "center",
                maxWidth: 280,
              }}>
                {SUGGESTED.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => send(s)}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.5)",
                      fontSize: 9,
                      padding: "4px 8px",
                      borderRadius: 5,
                      cursor: "pointer",
                      letterSpacing: "0.02em",
                      fontFamily: "inherit",
                      transition: "all 0.18s",
                      lineHeight: 1.4,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.11)";
                      (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.88)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.24)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                      (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)";
                    }}
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
              <div key={i} style={{
                alignSelf: "flex-end",
                maxWidth: "78%",
                padding: "5px 9px",
                borderRadius: "8px 8px 2px 8px",
                background: "rgba(255,255,255,0.09)",
                border: "1px solid rgba(255,255,255,0.13)",
                color: "rgba(255,255,255,0.8)",
                fontSize: 10,
                lineHeight: 1.55,
                animation: "figFadeUp 0.22s ease",
              }}>
                {msg.content}
              </div>
            ) : (
              /* AI bubble — left */
              <div key={i} style={{
                alignSelf: "flex-start",
                display: "flex", gap: 6,
                animation: "figFadeUp 0.22s ease",
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 1,
                }}>⬡</div>
                <div style={{
                  maxWidth: "calc(78% - 24px)",
                  padding: "5px 9px",
                  borderRadius: "8px 8px 8px 2px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "rgba(255,255,255,0.68)",
                  fontSize: 10, lineHeight: 1.55,
                }}>
                  {msg.content}
                </div>
              </div>
            )
          )}

          {/* Streaming text */}
          {streamText && (
            <div style={{ alignSelf: "flex-start", display: "flex", gap: 6, animation: "figFadeUp 0.22s ease" }}>
              <div style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 1,
              }}>⬡</div>
              <div style={{
                maxWidth: "calc(78% - 24px)",
                padding: "5px 9px",
                borderRadius: "8px 8px 8px 2px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.68)",
                fontSize: 10, lineHeight: 1.55,
              }}>
                {streamText}
                <span style={{
                  display: "inline-block", width: 1.5, height: 10,
                  background: "rgba(255,255,255,0.6)",
                  marginLeft: 2, verticalAlign: "middle", borderRadius: 1,
                  animation: "figBlink 0.7s step-end infinite",
                }} />
              </div>
            </div>
          )}

          {/* Loading dots — before stream begins */}
          {loading && !streamText && (
            <div style={{ alignSelf: "flex-start", display: "flex", gap: 6 }}>
              <div style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 1,
              }}>⬡</div>
              <div style={{
                padding: "7px 10px",
                borderRadius: "8px 8px 8px 2px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <LoadingDots />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input row ── */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.015)",
          padding: "7px 10px",
          display: "flex", alignItems: "center", gap: 7,
        }}>
          {/* Input + word counter */}
          <div style={{ position: "relative", flex: 1 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
              placeholder={isMaxed ? "Clear to continue..." : "Comment..."}
              disabled={isMaxed || loading}
              maxLength={100}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${isOver ? "rgba(255,80,80,0.45)" : "rgba(255,255,255,0.09)"}`,
                borderRadius: 6,
                padding: "5px 32px 5px 9px",
                color: "rgba(255,255,255,0.82)",
                fontSize: 10,
                fontFamily: "inherit",
                letterSpacing: "0.02em",
                outline: "none",
                opacity: isMaxed ? 0.4 : 1,
                cursor: isMaxed ? "not-allowed" : "text",
                boxSizing: "border-box",
                transition: "border-color 0.18s",
              }}
            />
            {/* Word counter */}
            {input.length > 0 && (
              <span style={{
                position: "absolute", right: 7, top: "50%",
                transform: "translateY(-50%)",
                fontSize: 8, fontFamily: "inherit",
                color: isOver ? "rgba(255,80,80,0.7)" : "rgba(255,255,255,0.22)",
                pointerEvents: "none", letterSpacing: "0.04em",
              }}>
                {wordCount}/{MAX_WORDS}
              </span>
            )}
          </div>

          {/* Send button */}
          <button
            onClick={send}
            disabled={!canSend}
            style={{
              width: 26, height: 26, borderRadius: 6, flexShrink: 0,
              border: `1px solid ${canSend ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)"}`,
              background: canSend ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: canSend ? "pointer" : "not-allowed",
              color: canSend ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.2)",
              transition: "all 0.18s",
            }}
            onMouseEnter={(e) => {
              if (canSend) {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.16)";
                (e.currentTarget as HTMLElement).style.transform = "scale(1.06)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = canSend
                ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)";
              (e.currentTarget as HTMLElement).style.transform = "scale(1)";
            }}
          >
            {loading ? (
              <div style={{
                width: 10, height: 10,
                border: "1.5px solid rgba(255,255,255,0.15)",
                borderTopColor: "rgba(255,255,255,0.6)",
                borderRadius: "50%",
                animation: "figSpin 0.7s linear infinite",
              }} />
            ) : (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"
                  stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>

        {/* ── Footer ── */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "3px 10px 7px",
        }}>
          <span style={{
            fontSize: 8, color: "rgba(255,255,255,0.18)", letterSpacing: "0.05em",
          }}>
            {isMaxed ? "max reached" : `${MAX_MESSAGES - userCount} left`}
          </span>
          {messages.length > 0 && (
            <button
              onClick={clearAll}
              style={{
                fontSize: 8, background: "none", border: "none",
                color: "rgba(255,255,255,0.2)", cursor: "pointer",
                fontFamily: "inherit", letterSpacing: "0.05em", padding: 0,
                transition: "color 0.18s",
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "rgba(255,255,255,0.5)"; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "rgba(255,255,255,0.2)"; }}
            >
              clear all
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes figDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes figFadeUp {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes figBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes figSpin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}



function FigRays() {
  return (
    <motion.svg
      viewBox="0 0 120 100"
      className="h-44 w-52 text-zinc-600 transition-colors duration-300 group-hover:text-zinc-500 md:h-52 md:w-60 lg:h-64 lg:w-72"
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
