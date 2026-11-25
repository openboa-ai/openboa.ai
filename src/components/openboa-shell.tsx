"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { OpenBoaSwarmStage } from "@/components/openboa-swarm-stage";
import { OpenBoaHud } from "@/components/openboa-hud";

gsap.registerPlugin(ScrollTrigger);

export function OpenBoaShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.085,
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onScrollTo = (e: Event) => {
      const target = (e as CustomEvent<string>).detail;
      if (target) {
        lenis.scrollTo(target, { duration: 1.1 });
      }
    };
    window.addEventListener("openboa:scroll-to", onScrollTo);

    return () => {
      window.removeEventListener("openboa:scroll-to", onScrollTo);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    ScrollTrigger.refresh();
  }, [pathname]);

  return (
    <>
      <OpenBoaSwarmStage />
      <OpenBoaHud />
      <main className="stage-interactive-layer">{children}</main>
    </>
  );
}
