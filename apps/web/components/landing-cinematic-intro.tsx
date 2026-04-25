"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";

const DZ = 20;

export function LandingCinematicIntro() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const sceneOpacity = useTransform(scrollYProgress, [0, 0.5, 0.8], [1, 0.5, 0.15]);
  const titleY = useTransform(scrollYProgress, [0, 0.5], [0, -48]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.55]);
  const rotorX = useTransform(scrollYProgress, [0, 0.5], [-10, 2]);
  const rotorY = useTransform(scrollYProgress, [0, 0.5], [-16, 20]);
  const rotorScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  return (
    <div ref={sectionRef} className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden" aria-label="Intro sequence">
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

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-1 flex-col items-center px-4">
        <motion.div className="w-full pt-16 text-center sm:pt-20" style={{ y: titleY, opacity: titleOpacity }}>
          <p className="mb-2 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground sm:text-xs">
            Systems-style evaluation
          </p>
          <h1 className="text-center font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-foreground sm:text-4xl md:text-5xl">
            OS-LLM<span className="text-crimson">-</span>
            <span className="text-silver">BENCHMARK</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-silver/90 sm:text-base">
            Benchmark open models under real load with reproducible runs: latency tails, throughput, memory pressure,
            and fairness when multiple tenants compete for the same box.
          </p>
        </motion.div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            className="flex items-center justify-center"
            style={{ opacity: sceneOpacity, x: rotorX, y: rotorY, scale: rotorScale }}
          >
            <div className="relative flex h-40 w-40 shrink-0 items-center justify-center sm:h-44 sm:w-44">
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[240%] w-[240%] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-full bg-crimson/45 blur-[72px] sm:blur-[92px]"
                aria-hidden
              />
              <div className="relative h-36 w-36 sm:h-40 sm:w-40" style={{ perspective: 900 }}>
                <motion.div
                  className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d] sm:h-40 sm:w-40"
                  style={{ transformOrigin: "50% 50% 0" }}
                  animate={{ rotateY: [0, 360] }}
                  transition={{ duration: 40, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <div
                    className="absolute inset-0 rounded-md border-2 border-crimson/80 bg-zinc-950 shadow-[0_0_0_1px_hsl(0_40%_25%/0.5)]"
                    style={{ transform: `translateZ(${DZ}px)` }}
                  />
                  <div
                    className="absolute inset-0 rounded-md border-2 border-zinc-500 bg-zinc-900"
                    style={{ transform: "translateZ(0px)" }}
                  />
                  <div
                    className="absolute inset-0 rounded-md border-2 border-crimson/70 bg-zinc-950"
                    style={{ transform: `translateZ(-${DZ}px)` }}
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.footer className="mt-auto w-full px-4 pb-10 pt-2 text-center" style={{ opacity: hintOpacity }}>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Scroll for more</p>
        <div className="mt-1 flex justify-center" aria-hidden>
          <ChevronDown className="h-4 w-4 animate-bounce text-crimson" />
        </div>
      </motion.footer>
    </div>
  );
}
