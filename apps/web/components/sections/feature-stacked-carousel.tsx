"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Cpu, MemoryStick, Scale } from "lucide-react";
import { MotionSection } from "@/components/motion-section";

const items: {
  Icon: typeof Cpu;
  title: string;
  desc: string;
}[] = [
  {
    Icon: Cpu,
    title: "Serving latency and throughput",
    desc: "TTFT, TPOT, tokens per second—comparable across models, batch sizes, and hardware. Not a single latency bar from a cold cache.",
  },
  {
    Icon: MemoryStick,
    title: "Memory and pressure",
    desc: "How hard RSS, VRAM, and allocators are pushed before OOM. What operators need when a model is one spike away from falling over.",
  },
  {
    Icon: Scale,
    title: "Fairness and isolation",
    desc: "Noisy-neighbor and shared-box behavior. Jain-style indices and who gets starved when tenants compete for the same GPU or CPU budget.",
  },
  {
    Icon: BarChart3,
    title: "Analysis and logs",
    desc: "Charts plus structured, replayable log lines and stable run IDs in Postgres. Diff two runs, not two screenshots.",
  },
];

const CARD = "h-[260px] w-full max-w-xl sm:h-[280px]";

function CardContent({
  itemIndex,
  mode,
  onClick,
}: {
  itemIndex: number;
  mode: "front" | "back";
  onClick?: () => void;
}) {
  const { Icon, title, desc } = items[itemIndex];
  const isFront = mode === "front";

  const className = [
    `${CARD} flex flex-col overflow-hidden rounded-2xl border-2 p-5 text-left shadow-2xl sm:p-6`,
    isFront
      ? "cursor-pointer border-crimson/50 bg-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson/50"
      : "border-zinc-600 bg-zinc-950",
  ].join(" ");

  return (
    <button type="button" onClick={isFront ? onClick : undefined} className={className} disabled={!isFront}>
      <div className="mb-3 flex items-start gap-3">
        <span
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
            isFront
              ? "border border-crimson/30 bg-crimson/20 text-crimson"
              : "border border-zinc-600 bg-zinc-900 text-zinc-400",
          ].join(" ")}
        >
          {itemIndex + 1}
        </span>
        <div
          className={[
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md ring-1",
            isFront ? "bg-zinc-900 ring-crimson/30" : "bg-zinc-800 ring-zinc-600",
          ].join(" ")}
        >
          <Icon className={isFront ? "h-4 w-4 text-crimson" : "h-4 w-4 text-crimson/70"} />
        </div>
      </div>

      <h3 className={[
        "font-display text-lg font-semibold sm:text-xl",
        isFront ? "text-foreground" : "text-zinc-300",
      ].join(" ")}>
        {title}
      </h3>
      <p
        className={[
          "mt-3 flex-1 text-base leading-relaxed",
          isFront ? "text-zinc-300" : "text-zinc-500",
        ].join(" ")}
      >
        {desc}
      </p>
    </button>
  );
}

export function FeatureStackedCarousel() {
  const [order, setOrder] = useState([0, 1, 2, 3]);
  const cycle = () => setOrder((o) => [...o.slice(1), o[0]]);

  const front = order[0];
  const backIdx = [order[1], order[2], order[3]];

  return (
    <MotionSection id="features" className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-crimson/80">Scope</p>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">What we measure</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
          Four pillars, ordered 1 → 2 → 3 → 4. Tap the front card to send it to the back and bring the next one forward.
        </p>
      </div>

      <div className="relative mt-10 flex w-full justify-center sm:mt-12">
        <div className="relative w-full max-w-xl px-0">
          <p className="mb-4 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Tap front card</p>

          <div className="relative mx-auto min-h-[300px] w-full max-w-xl sm:min-h-[320px]">
            <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center" aria-hidden>
              <div className="h-52 w-[min(100%,28rem)] max-w-2xl rounded-full bg-crimson/20 blur-[48px] sm:h-64 sm:blur-[64px]" />
            </div>

            {backIdx.map((itemIndex, i) => {
              const stackPos = i + 1;
              const dx = 5 + stackPos * 6;
              const dy = 4 + stackPos * 5;
              return (
                <div
                  key={`deck-${order.join("-")}-b-${i}`}
                  className="absolute left-1/2 top-0 w-full max-w-xl"
                  style={{ zIndex: 10 - stackPos, transform: `translate(calc(-50% + ${dx}px), ${dy}px)` }}
                >
                  <CardContent itemIndex={itemIndex} mode="back" />
                </div>
              );
            })}

            <div className="absolute left-1/2 top-0 z-20 w-full max-w-xl -translate-x-1/2" style={{ perspective: 800 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={String(front)}
                  initial={{ opacity: 1, y: 8, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ y: 16, x: 8, opacity: 1, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  className="w-full"
                >
                  <CardContent itemIndex={front} mode="front" onClick={cycle} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </MotionSection>
  );
}
