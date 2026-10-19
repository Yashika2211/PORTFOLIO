"use client";

import { useEffect } from "react";
import { setSoundEnabled } from "@/lib/sound";
import { useYashu } from "./store";

/** Rehydrates persisted state after mount and keeps side-effecting systems in sync with the store. */
export function YashuBridge() {
  useEffect(() => {
    void useYashu.persist.rehydrate();
    setSoundEnabled(useYashu.getState().sound);
    return useYashu.subscribe((s, prev) => {
      if (s.sound !== prev.sound) setSoundEnabled(s.sound);
    });
  }, []);
  return null;
}
