"use client";

import { useCallback, useState } from "react";
import { BootSequence } from "@/components/hud/BootSequence";
import { CommandBar } from "@/components/hud/CommandBar";
import { Cursor } from "@/components/hud/Cursor";
import { HudFrame } from "@/components/hud/HudFrame";
import { HudProvider } from "@/components/providers/HudProvider";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { About } from "@/components/sections/About";
import { Achievements } from "@/components/sections/Achievements";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { Hero } from "@/components/sections/Hero";
import { ProjectBriefing } from "@/components/sections/ProjectBriefing";
import { Projects } from "@/components/sections/Projects";
import { Skills } from "@/components/sections/Skills";

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
          <About />
          <Skills />
          <Projects />
          <Experience />
          <Achievements />
          <Contact />
        </main>
        <ProjectBriefing />
      </SmoothScroll>
    </HudProvider>
  );
}
