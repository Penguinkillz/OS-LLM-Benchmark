import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "OS-LLM-Benchmark | Systems-style LLM evaluation",
  description:
    "Measure small LLM inference with OS metrics: tail latency, memory pressure, fairness under load.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans">
        <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
          <div className="glow-orb -left-1/3 top-[-8%] bg-crimson/15" />
          <div className="glow-orb right-[-20%] bottom-[-10%] bg-silver/10" />
          <div className="absolute inset-0 mesh-grid opacity-[0.35]" />
        </div>
        <div className="relative flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1 pb-8">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
