"use client"

import { CSSProperties } from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

type ComicTextProps = {
  children: string
  className?: string
  style?: CSSProperties
  fontSize?: number
}

export function ComicText({
  children,
  className,
  style,
  fontSize = 3.75,
}: ComicTextProps) {
  if (typeof children !== "string") {
    throw new Error("children must be a string")
  }

  return (
    <motion.div
      className={cn("text-center select-none", className)}
      style={{
        fontSize: `${fontSize}rem`,
        fontFamily: "'Bangers', 'Comic Sans MS', 'Impact', sans-serif",
        fontWeight: "800",
        WebkitTextStroke: `${fontSize * 0.18}px var(--background)`,
        transform: "skewX(-7deg)",
        textTransform: "uppercase",
        filter: `
          drop-shadow(2px 2px 0px var(--background))
          drop-shadow(0 0 8px color-mix(in srgb, var(--accent) 35%, transparent))
        `,
        backgroundColor: "var(--foreground)",
        backgroundImage: `
          linear-gradient(
            180deg,
            color-mix(in srgb, var(--foreground) 88%, var(--accent) 12%) 0%,
            color-mix(in srgb, var(--foreground) 68%, var(--muted-foreground) 32%) 100%
          )
        `,
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        ...style,
      }}
      initial={{ opacity: 0, scale: 0.8, rotate: -2 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{
        duration: 0.6,
        ease: [0.175, 0.885, 0.32, 1.275],
        type: "spring",
      }}
    >
      {children}
    </motion.div>
  )
}
