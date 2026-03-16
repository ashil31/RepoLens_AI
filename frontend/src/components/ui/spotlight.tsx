"use client";

import { motion } from "framer-motion";

type SpotlightProps = {
  gradientFirst?: string;
  gradientSecond?: string;
  gradientThird?: string;
  translateY?: number;
  width?: number;
  height?: number;
  smallWidth?: number;
  duration?: number;
  xOffset?: number;
};

/** White-shade spotlight beams. Use behind hero content for subtle ambient light. */
export function Spotlight({
  gradientFirst = "radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(0, 0%, 100%, .08) 0, hsla(0, 0%, 100%, .03) 50%, hsla(0, 0%, 100%, 0) 80%)",
  gradientSecond = "radial-gradient(50% 50% at 50% 50%, hsla(0, 0%, 100%, .06) 0, hsla(0, 0%, 100%, .02) 80%, transparent 100%)",
  gradientThird = "radial-gradient(50% 50% at 50% 50%, hsla(0, 0%, 100%, .04) 0, hsla(0, 0%, 100%, .02) 80%, transparent 100%)",
  translateY = -350,
  width = 560,
  height = 1380,
  smallWidth = 240,
  duration = 8,
  xOffset = 80,
}: SpotlightProps = {}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden"
    >
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_40%,hsla(0,0%,100%,0.06),transparent_70%)]"
        aria-hidden
      />
      {/* Sweeping beams – now visible on all breakpoints */}
      <div className="block">
      <motion.div
        animate={{ x: [0, xOffset, 0] }}
        transition={{ duration, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        className="absolute left-0 top-0 z-0 h-screen w-screen pointer-events-none"
      >
        <div
          style={{
            transform: `translateY(${translateY}px) rotate(-45deg)`,
            background: gradientFirst,
            width: `${width}px`,
            height: `${height}px`,
          }}
          className="absolute left-0 top-0"
        />
        <div
          style={{
            transform: "rotate(-45deg) translate(5%, -50%)",
            background: gradientSecond,
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className="absolute left-0 top-0 origin-top-left"
        />
        <div
          style={{
            transform: "rotate(-45deg) translate(-180%, -70%)",
            background: gradientThird,
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className="absolute left-0 top-0 origin-top-left"
        />
      </motion.div>

      <motion.div
        animate={{ x: [0, -xOffset, 0] }}
        transition={{ duration, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        className="absolute right-0 top-0 z-0 h-screen w-screen pointer-events-none"
      >
        <div
          style={{
            transform: `translateY(${translateY}px) rotate(45deg)`,
            background: gradientFirst,
            width: `${width}px`,
            height: `${height}px`,
          }}
          className="absolute right-0 top-0"
        />
        <div
          style={{
            transform: "rotate(45deg) translate(-5%, -50%)",
            background: gradientSecond,
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className="absolute right-0 top-0 origin-top-right"
        />
        <div
          style={{
            transform: "rotate(45deg) translate(180%, -70%)",
            background: gradientThird,
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className="absolute right-0 top-0 origin-top-right"
        />
      </motion.div>
      </div>
    </motion.div>
  );
}
