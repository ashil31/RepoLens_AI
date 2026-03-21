import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface GlowingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  /**
   * Apply sizing/layout to the outer wrapper (controls the glow border box).
   * Use this instead of putting `w-full` on `className` (inner mask) to avoid layout loops.
   */
  wrapperClassName?: string;
}

export const GlowingButton = React.forwardRef<
  HTMLButtonElement,
  GlowingButtonProps
>(({ className, wrapperClassName, asChild = false, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <div
      className={cn("relative inline-flex overflow-hidden rounded-lg p-[1.5px]", wrapperClassName)}
    >
      {/* Halo + spinning sweep.
          The 2 layers are both clipped to the 1.5px wrapper padding, so you see a glowing border. */}
      {/* Blurred halo layer */}
      
      {/* Bright sweep layer */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,rgba(255,255,255,0.9)_100%)]"
      />
      
      {/* <span
        aria-hidden
        className="pointer-events-none absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_92%,rgba(255,255,255,1.5)_100%)] blur-[6px] opacity-40"
      /> */}

      {/* Inner button mask. */}
      <Comp
        ref={ref}
        {...props}
        className={cn(
          "relative inline-flex h-full w-full cursor-pointer items-center justify-center rounded-[inherit] bg-background/95 backdrop-blur-xl px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          className
        )}
      >
        {children}
      </Comp>
    </div>
  );
});

GlowingButton.displayName = "GlowingButton";

