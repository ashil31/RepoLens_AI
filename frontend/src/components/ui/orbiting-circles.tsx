"use client";

import * as React from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { cn } from "@/lib/utils";

export interface OrbitingCirclesProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
  reverse?: boolean;
  duration?: number;
  radius?: number;
  path?: boolean;
  iconSize?: number;
  speed?: number;
  /** When true, icons stay at fixed positions on the circle (no orbit animation) */
  static?: boolean;
}

/** Round to 2 decimals to avoid hydration mismatch from float precision */
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function OrbitingCircles({
  className,
  children,
  reverse,
  duration = 20,
  radius = 160,
  path = true,
  iconSize = 30,
  speed = 1,
  static: isStatic = false,
  ...props
}: OrbitingCirclesProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const calculatedDuration = duration / speed;
  const count = React.Children.count(children);
  const childrenArray = React.Children.toArray(children);

  const orbitRotation = useMotionValue(0);
  const counterRotation = useTransform(orbitRotation, (r) => -r);

  React.useEffect(() => {
    if (!mounted || isStatic) return;
    const target = reverse ? -360 : 360;
    const controls = animate(orbitRotation, target, {
      duration: calculatedDuration,
      repeat: Infinity,
      ease: "linear",
    });
    return () => controls.stop();
  }, [mounted, orbitRotation, calculatedDuration, isStatic, reverse]);

  if (!mounted) {
    return (
      <>
        {path && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            version="1.1"
            className="pointer-events-none absolute inset-0 size-full"
          >
            <circle
              className="stroke-white/10 stroke-1"
              cx="50%"
              cy="50%"
              r={radius}
              fill="none"
            />
          </svg>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          {childrenArray.map((child, index) => {
            const angle = (360 / count) * index;
            const angleRad = (angle * Math.PI) / 180;
            const x = round2(Math.sin(angleRad) * radius);
            const y = round2(-Math.cos(angleRad) * radius);
            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: `${iconSize}px`,
                  height: `${iconSize}px`,
                  marginLeft: -iconSize / 2,
                  marginTop: -iconSize / 2,
                  transform: `translate(${x}px, ${y}px)`,
                }}
                className={cn("flex items-center justify-center", className)}
              >
                {child}
              </div>
            );
          })}
        </div>
      </>
    );
  }

  return (
    <>
      {path && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <circle
            className="stroke-white/10 stroke-1"
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
          />
        </svg>
      )}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ rotate: orbitRotation }}
      >
        {childrenArray.map((child, index) => {
          const angle = (360 / count) * index;
          const angleRad = (angle * Math.PI) / 180;
          const x = round2(Math.sin(angleRad) * radius);
          const y = round2(-Math.cos(angleRad) * radius);
          return (
            <motion.div
              key={index}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: `${iconSize}px`,
                height: `${iconSize}px`,
                marginLeft: -iconSize / 2,
                marginTop: -iconSize / 2,
                x,
                y,
                rotate: counterRotation,
              }}
              className={cn("flex items-center justify-center", className)}
            >
              {child}
            </motion.div>
          );
        })}
      </motion.div>
    </>
  );
}
