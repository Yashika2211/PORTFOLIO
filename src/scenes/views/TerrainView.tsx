"use client";

import { View } from "@react-three/drei";
import { TerrainScene } from "./TerrainScene";

export default function TerrainView({ levels }: { levels: number[] }) {
  return (
    <View index={2} className="pointer-events-none absolute inset-0">
      <TerrainScene levels={levels} />
    </View>
  );
}
