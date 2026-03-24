"use client"

import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type FC,
} from "react"
import { cn } from "@/lib/utils"

export interface AnimatedShinyTextProps extends ComponentPropsWithoutRef<"span"> {
  shimmerWidth?: number
}

export const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
  children,
  className,
  shimmerWidth = 120,
  ...props
}) => {
  return (
    <span
      style={
        {
          "--shiny-width": `${shimmerWidth}px`,
        } as CSSProperties
      }
      className={cn(
        "mx-auto max-w-md text-foreground/70 dark:text-foreground/70",
        "animate-shiny-text bg-size-[var(--shiny-width)_100%] bg-clip-text bg-position-[0_0] bg-no-repeat",
        "bg-linear-to-r from-transparent via-foreground/85 via-50% to-transparent",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

