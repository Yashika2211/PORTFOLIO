"use client";

import { View } from "@react-three/drei";
import type { Project } from "@/data/portfolio";
import { ArchScene } from "./ArchScene";

export default function ArchView({ arch }: { arch: Project["arch"] }) {
  return (
    <View index={2} className="pointer-events-none absolute -inset-x-8 -inset-y-10">
      <ArchScene arch={arch} />
    </View>
  );
}
