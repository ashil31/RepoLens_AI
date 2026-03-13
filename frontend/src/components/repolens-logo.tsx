"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

const VIEWBOX = "0 0 220 220";

type RepoLensLogoSize = "xs" | "sm" | "md" | "lg" | "xl" | "lx";

const sizeMap: Record<RepoLensLogoSize, number> = {
  xs: 20,
  sm: 24,
  md: 32,
  lg: 52,
  xl: 58,
  lx: 64
};

export interface RepoLensLogoProps {
  size?: RepoLensLogoSize;
  className?: string;
  /** When true, logo uses width/height 100% to fill the parent (use with h-full w-full on container) */
  fillContainer?: boolean;
  /** Stable ID for SVG gradients (avoids hydration mismatch). Pass when logo is in initial HTML (e.g. navbar). */
  id?: string;
}

/**
 * RepoLens logo (folder + lens). Uses CSS variables from theme (--card, --muted, --accent, etc.)
 * so it adapts to light/dark/pure-light/classic-dark. Use one place, import from here.
 */
export function RepoLensLogo({ size = "md", className, fillContainer, id: idProp }: RepoLensLogoProps) {
  const generatedId = useId().replace(/:/g, "-");
  const id = idProp ?? generatedId;
  const px = sizeMap[size];

  const svgProps = fillContainer
    ? {
        width: "100%" as const,
        height: "100%" as const,
        preserveAspectRatio: "xMidYMid meet" as const,
        style: {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
        } as React.CSSProperties,
      }
    : { width: px, height: px };

  return (
    <svg
      {...svgProps}
      viewBox={VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "shrink-0",
        fillContainer && "min-w-0 min-h-0",
        !fillContainer && "max-h-full max-w-full",
        className
      )}
      aria-hidden
    >
      <defs>
        <linearGradient id={`folder-${id}`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--muted)" />
        </linearGradient>
        <linearGradient id={`handle-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--muted-foreground)" />
          <stop offset="100%" stopColor="var(--muted-foreground)" stopOpacity={0.95} />
        </linearGradient>
        <radialGradient id={`lens-${id}`} cx="36%" cy="32%" r="70%">
          <stop offset="0%" stopColor="var(--card-logo)" />
          <stop offset="55%" stopColor="var(--accent-logo)" />
          <stop offset="100%" stopColor="var(--muted-logo)" />
        </radialGradient>
        <mask id={`cut-${id}`}>
          <rect width="220" height="220" fill="white" />
          <circle cx="144" cy="130" r="24" fill="black" />
          <rect
            x="135"
            y="150"
            width="44"
            height="13"
            rx="6.5"
            transform="rotate(45 165 165)"
            fill="black"
          />
        </mask>
      </defs>
      
      <path
        d="M36 98 Q36 70 62 70 H104 Q116 70 124 86 H164 Q186 86 186 108 V152 Q186 176 162 176 H62 Q36 176 36 152 Z"
        fill={`url(#folder-${id})`}
        mask={`url(#cut-${id})`}
      />
      <path
        d="M62 70 H104 Q115 70 123 85 H78 Q66 85 62 70 Z"
        fill="var(--accent)"
        mask={`url(#cut-${id})`}
      />
      <circle
        cx="144"
        cy="130"
        r="26"
        fill="none"
        stroke="var(--border)"
        strokeWidth="2"
      />
      <circle
        cx="144"
        cy="130"
        r="24.5"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1"
      />
      <circle cx="144" cy="130" r="24" fill={`url(#lens-${id})`} />
      <rect
        x="135"
        y="150"
        width="44"
        height="13"
        rx="6.5"
        transform="rotate(45 165 165)"
        fill={`url(#handle-${id})`}
      />
      <rect
        x="135"
        y="150"
        width="44"
        height="3.5"
        rx="2"
        transform="rotate(45 165 165)"
        fill="var(--primary-foreground)"
        opacity="0.05"
      />
    </svg>
  );
}
