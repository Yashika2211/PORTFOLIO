"use client";

import { View } from "@react-three/drei";
import { IdCardScene } from "./IdCardScene";

export default function IdCardView({ flipped }: { flipped: boolean }) {
  return (
    <View index={2} className="pointer-events-none absolute -inset-6">
      <IdCardScene flipped={flipped} />
    </View>
  );
}
