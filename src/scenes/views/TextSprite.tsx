"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

/**
 * Crisp text label as a sprite (canvas texture). Used instead of drei <Html>,
 * whose DOM positioning doesn't follow scissored <View>s.
 */
export function TextSprite({
  text,
  color = "#e8f4f8",
  size = 0.32,
  position,
  bg = true,
}: {
  text: string;
  color?: string;
  size?: number;
  position?: [number, number, number];
  bg?: boolean;
}) {
  const { texture, aspect } = useMemo(() => {
    const font = 44;
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d")!;
    ctx.font = `600 ${font}px JetBrains Mono, ui-monospace, monospace`;
    const w = Math.ceil(ctx.measureText(text).width) + 36;
    c.width = w;
    c.height = font + 28;
    ctx.font = `600 ${font}px JetBrains Mono, ui-monospace, monospace`;
    if (bg) {
      ctx.fillStyle = "rgba(5,7,13,0.82)";
      ctx.strokeStyle = "rgba(0,229,255,0.6)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(2, 2, c.width - 4, c.height - 4, 10);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.fillText(text, 18, c.height / 2 + 2);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return { texture: t, aspect: c.width / c.height };
  }, [text, color, bg]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <sprite position={position} scale={[size * aspect, size, 1]} renderOrder={10}>
      <spriteMaterial map={texture} transparent depthTest={false} toneMapped={false} />
    </sprite>
  );
}
