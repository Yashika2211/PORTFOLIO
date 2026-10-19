"use client";

import { useCallback, useState } from "react";
import { BootSequence } from "@/components/hud/BootSequence";
import { CommandBar } from "@/components/hud/CommandBar";
import { Cursor } from "@/components/hud/Cursor";
import { HudFrame } from "@/components/hud/HudFrame";
import { HudProvider } from "@/components/providers/HudProvider";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Hero } from "@/components/sections/Hero";

export function PortfolioShell() {
  const [ready, setReady] = useState(false);
  const onBooted = useCallback(() => setReady(true), []);

  return (
    <HudProvider>
      <SmoothScroll>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <BootSequence onDone={onBooted} />
        <HudFrame />
        <Cursor />
        <CommandBar />
        <main id="main" className="scanlines">
          <Hero ready={ready} />
        </main>
      </SmoothScroll>
    </HudProvider>
  );
}
