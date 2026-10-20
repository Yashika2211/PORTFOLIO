"use client";

import { useCallback, useState } from "react";
import { BootSequence } from "@/components/hud/BootSequence";
import { CommandBar } from "@/components/hud/CommandBar";
import { Cursor } from "@/components/hud/Cursor";
import { HudFrame } from "@/components/hud/HudFrame";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { About } from "@/components/sections/About";
import { Achievements } from "@/components/sections/Achievements";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { Hero } from "@/components/sections/Hero";
import { ProjectBriefing } from "@/components/sections/ProjectBriefing";
import { Projects } from "@/components/sections/Projects";
import { Skills } from "@/components/sections/Skills";
import { Stage } from "@/scenes/Stage";
import { Awareness } from "@/yashu/Awareness";
import { Director } from "@/yashu/Director";
import { Transitions } from "@/yashu/transitions/Transitions";
import { EasterEggs } from "@/yashu/ui/EasterEggs";
import { ExitIntent } from "@/yashu/ui/ExitIntent";
import { GesturePanel } from "@/yashu/ui/GesturePanel";
import { AssistantDock } from "@/yashu/ui/AssistantDock";
import { HoloCard } from "@/yashu/ui/HoloCard";
import { Subtitles } from "@/yashu/ui/Subtitles";
import { Toasts } from "@/yashu/ui/Toasts";
import { TourBar } from "@/yashu/ui/TourBar";
import { VoicePrompt } from "@/yashu/ui/VoicePrompt";
import { YashuBridge } from "@/yashu/YashuBridge";

export function PortfolioShell() {
  const [ready, setReady] = useState(false);
  // Replay the hero entrance only after a boot sequence actually played.
  const [entrance, setEntrance] = useState(false);
  const onBooted = useCallback((played: boolean) => {
    setEntrance(played);
    setReady(true);
  }, []);

  return (
    <>
      <YashuBridge />
      <SmoothScroll>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <BootSequence onDone={onBooted} />
        <Stage ready={ready} />
        <HudFrame />
        <Cursor />
        <CommandBar />
        <main id="main" className="scanlines relative">
          <Hero ready={ready} entrance={entrance} />
          <About />
          <Skills />
          <Projects />
          <Experience />
          <Achievements />
          <Contact />
        </main>
        <ProjectBriefing />
        <Director ready={ready} />
        <Awareness ready={ready} />
        <Transitions />
        <VoicePrompt ready={ready} />
        <Subtitles />
        <HoloCard />
        <AssistantDock />
        <Toasts />
        <TourBar />
        <EasterEggs />
        <ExitIntent ready={ready} />
        <GesturePanel />
      </SmoothScroll>
    </>
  );
}
