"use client";

import { View } from "@react-three/drei";
import { useShallow } from "zustand/react/shallow";
import { useYashu } from "@/yashu/store";
import { ConstellationScene } from "./ConstellationScene";

/** Tracks its DOM box and renders the constellation into the shared canvas. */
export default function ConstellationView() {
  const draggable = typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
  const { active, pinned, setActiveSkill, set } = useYashu(
    useShallow((s) => ({ active: s.activeSkill, pinned: s.pinnedSkill, setActiveSkill: s.setActiveSkill, set: s.set })),
  );
  return (
    <View index={2} className="absolute inset-0">
      <ConstellationScene
        draggable={draggable}
        active={active}
        pinned={pinned}
        onHover={setActiveSkill}
        onPick={(skill) => set({ pinnedSkill: pinned === skill ? null : skill })}
      />
    </View>
  );
}
