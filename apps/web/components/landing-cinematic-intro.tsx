"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";

export function LandingCinematicIntro() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const hintOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  return (
    <div
      ref={sectionRef}
      className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden"
      aria-label="Intro sequence"
    >
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.1]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "linear-gradient(hsl(0 0% 100% / 0.04) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 45%, #000 35%, transparent 100%)",
          }}
        />
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-16 sm:py-20">
        <div className="w-full max-w-4xl text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.4em] text-muted-foreground sm:mb-4 sm:text-sm">
            Systems-style evaluation
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-[-0.02em] text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            OS-LLM<span className="text-crimson">-</span>
            <span className="text-silver">BENCHMARK</span>
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-pretty text-base leading-relaxed text-silver/90 sm:mt-6 sm:text-lg md:mt-7 md:text-xl">
            Benchmark open models under real load with reproducible runs: latency tails, throughput, memory pressure,
            and fairness when multiple tenants compete for the same box.
          </p>
        </div>
      </div>

      <motion.footer className="mt-auto w-full px-4 pb-10 pt-2 text-center" style={{ opacity: hintOpacity }}>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:text-xs">Scroll for more</p>
        <div className="mt-1 flex justify-center" aria-hidden>
          <ChevronDown className="h-4 w-4 animate-bounce text-crimson" />
        </div>
      </motion.footer>
    </div>
  );
}