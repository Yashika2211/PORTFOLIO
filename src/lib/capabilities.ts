"use client";

import { useEffect, useState } from "react";

export type Capabilities = {
  /** Detection has run (false during SSR and first paint). */
  ready: boolean;
  webgl: boolean;
  reducedMotion: boolean;
  mobile: boolean;
  lowPower: boolean;
  finePointer: boolean;
};

const SSR_DEFAULT: Capabilities = {
  ready: false,
  webgl: false,
  reducedMotion: false,
  mobile: false,
  lowPower: false,
  finePointer: false,
};

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return false;
    (gl as WebGLRenderingContext).getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function detect(): Capabilities {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const mobile = window.matchMedia("(max-width: 768px)").matches;
  const cores = nav.hardwareConcurrency ?? 8;
  const memory = nav.deviceMemory ?? 8;
  const saveData = nav.connection?.saveData === true;
  return {
    ready: true,
    webgl: hasWebGL(),
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    mobile,
    lowPower: saveData || cores <= 2 || memory <= 2,
    finePointer: window.matchMedia("(pointer: fine)").matches,
  };
}

let cached: Capabilities | null = null;

export function useCapabilities(): Capabilities {
  const [caps, setCaps] = useState<Capabilities>(cached ?? SSR_DEFAULT);

  useEffect(() => {
    cached = detect();
    setCaps(cached);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => {
      cached = { ...(cached ?? detect()), reducedMotion: mq.matches };
      setCaps(cached);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return caps;
}

/** Whether the full 3D experience should run on this device. */
export function canRender3D(c: Capabilities): boolean {
  return c.ready && c.webgl && !c.lowPower;
}
