"use client";

import type { ReactNode } from "react";
import Marquee from "react-fast-marquee";

const COMPANIES = [
  { name: "Vercel", Logo: null },
  { name: "Cursor", Logo: null },
  { name: "Oscar", Logo: null },
  { name: "OpenAI", Logo: null },
  { name: "Coinbase", Logo: null },
  { name: "Cash App", Logo: null },
  { name: "Boom", Logo: null },
  { name: "Ramp", Logo: null },
] as const;

function Item({ name, Logo, isLast }: { name: string; Logo: (() => ReactNode) | null; isLast?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-3 whitespace-nowrap text-lg font-medium tracking-tight text-zinc-400 transition-colors hover:text-zinc-200 md:text-2xl ${isLast ? "mr-16" : ""}`}
    >
      {Logo ? <Logo /> : null}
      <span>{name}</span>
    </span>
  );
}

/**
 * Infinite marquee via react-fast-marquee: one-by-one continuous scroll, no cut/jump.
 * One row of 8 items; library duplicates it for a seamless loop.
 */
export function CompanyMarquee() {
  return (
    <section className="hero-dark overflow-hidden bg-[#0a0a0a] py-6" aria-label="Companies">
      <div className="mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] w-full overflow-hidden">
        <Marquee speed={40} direction="left" loop={0} autoFill gradient={false}>
          <div className="flex shrink-0 items-center gap-12">
            {COMPANIES.map(({ name, Logo }, index) => (
              <Item
                key={name}
                name={name}
                Logo={Logo}
                isLast={index === COMPANIES.length - 1}
              />
            ))}
          </div>
        </Marquee>
      </div>
    </section>
  );
}
