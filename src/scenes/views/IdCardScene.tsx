"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { profile } from "@/data/portfolio";
import { signals } from "@/yashu/signals";

const W = 3.16;
const H = 2;

const foilVertex = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;
void main(){
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

// Thin-film style iridescence: hue shifts with view angle and a diagonal sweep.
const foilFragment = /* glsl */ `
uniform sampler2D uMap;
uniform float uTime;
uniform vec2 uTilt;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;
vec3 spectrum(float x){ return 0.5 + 0.5 * cos(6.2831 * (x + vec3(0.0, 0.33, 0.67))); }
void main(){
  vec4 base = texture2D(uMap, vUv);
  float facing = dot(vNormal, vView);
  float sweep = vUv.x * 0.8 + vUv.y * 0.6 + uTilt.x * 0.9 - uTilt.y * 0.7 + uTime * 0.05;
  vec3 irid = spectrum(sweep + facing * 0.6);
  float band = smoothstep(0.35, 0.0, abs(fract(sweep * 0.7) - 0.5));
  float edge = pow(1.0 - abs(facing), 2.0);
  vec3 col = base.rgb + irid * (0.10 + band * 0.22 + edge * 0.35);
  gl_FragColor = vec4(col, 0.96);
}`;

function cssFont(variable: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return v || fallback;
}

function drawFront(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 1264;
  c.height = 800;
  const g = c.getContext("2d")!;
  const display = cssFont("--font-orbitron", "sans-serif");
  const mono = cssFont("--font-jetbrains", "monospace");
  const sans = cssFont("--font-inter", "sans-serif");
  const grad = g.createLinearGradient(0, 0, c.width, c.height);
  grad.addColorStop(0, "#0b1d2e");
  grad.addColorStop(1, "#04080f");
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = "rgba(0,229,255,0.55)";
  g.lineWidth = 4;
  g.strokeRect(14, 14, c.width - 28, c.height - 28);
  g.fillStyle = "#00e5ff";
  g.font = `600 30px ${display}`;
  g.fillText("ID // YB-2027", 64, 92);
  g.fillStyle = "#7cf7c4";
  g.font = `500 26px ${mono}`;
  g.fillText("● VERIFIED", c.width - 250, 92);
  // Monogram
  g.beginPath();
  g.arc(190, 400, 110, 0, Math.PI * 2);
  g.strokeStyle = "#00e5ff";
  g.lineWidth = 5;
  g.stroke();
  g.setLineDash([8, 10]);
  g.beginPath();
  g.arc(190, 400, 132, 0, Math.PI * 2);
  g.strokeStyle = "rgba(255,181,71,0.6)";
  g.lineWidth = 3;
  g.stroke();
  g.setLineDash([]);
  g.fillStyle = "#00e5ff";
  g.font = `900 92px ${display}`;
  g.textAlign = "center";
  g.fillText("YB", 190, 432);
  g.textAlign = "left";
  g.fillStyle = "#e8f4f8";
  g.font = `800 64px ${display}`;
  g.fillText(profile.name.toUpperCase(), 360, 380);
  g.fillStyle = "#9fb3c2";
  g.font = `400 34px ${sans}`;
  g.fillText("Software Engineer — ML Systems,", 360, 440);
  g.fillText("AI Agents & Backend", 360, 486);
  g.fillStyle = "#9fb3c2";
  g.font = `400 26px ${mono}`;
  g.fillText(profile.location, 64, c.height - 64);
  g.fillStyle = "#ffb547";
  g.fillText("click to flip ↻", c.width - 290, c.height - 64);
  return c;
}

async function drawBack(): Promise<HTMLCanvasElement> {
  const c = document.createElement("canvas");
  c.width = 1264;
  c.height = 800;
  const g = c.getContext("2d")!;
  const display = cssFont("--font-orbitron", "sans-serif");
  const mono = cssFont("--font-jetbrains", "monospace");
  const sans = cssFont("--font-inter", "sans-serif");
  g.fillStyle = "#060b14";
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = "rgba(255,181,71,0.55)";
  g.lineWidth = 4;
  g.strokeRect(14, 14, c.width - 28, c.height - 28);
  g.fillStyle = "#00e5ff";
  g.font = `600 30px ${display}`;
  g.fillText("EDUCATION", 64, 92);
  g.fillStyle = "#e8f4f8";
  g.font = `700 42px ${display}`;
  g.fillText(profile.education.degree, 64, 200);
  g.fillStyle = "#9fb3c2";
  g.font = `400 34px ${sans}`;
  g.fillText(profile.education.school, 64, 256);
  g.font = `400 28px ${mono}`;
  g.fillText(profile.education.period, 64, 306);
  g.fillStyle = "#00e5ff";
  g.font = `600 34px ${mono}`;
  g.fillText(`CGPA ${profile.education.cgpa}`, 64, 400);
  g.fillStyle = "#ffb547";
  g.font = `500 26px ${mono}`;
  g.fillText("scan → resume", 64, c.height - 64);
  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, new URL(profile.resume, profile.siteUrl).toString(), {
    margin: 1,
    width: 420,
    color: { dark: "#00e5ff", light: "#060b14" },
  });
  g.drawImage(qr, c.width - 420 - 70, (c.height - 420) / 2);
  return c;
}

function useCardTextures() {
  const [tex, setTex] = useState<{ front: THREE.Texture; back: THREE.Texture } | null>(null);
  useEffect(() => {
    let alive = true;
    void (async () => {
      await document.fonts.ready;
      const [f, b] = [drawFront(), await drawBack()];
      if (!alive) return;
      const mk = (cv: HTMLCanvasElement) => {
        const t = new THREE.CanvasTexture(cv);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        return t;
      };
      setTex({ front: mk(f), back: mk(b) });
    })();
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => () => {
    tex?.front.dispose();
    tex?.back.dispose();
  }, [tex]);
  return tex;
}

export function IdCardScene({ flipped }: { flipped: boolean }) {
  const group = useRef<THREE.Group>(null);
  const tex = useCardTextures();
  const flip = useRef(0);
  const uniformsFront = useMemo(() => ({ uMap: { value: null as THREE.Texture | null }, uTime: { value: 0 }, uTilt: { value: new THREE.Vector2() } }), []);
  const uniformsBack = useMemo(() => ({ uMap: { value: null as THREE.Texture | null }, uTime: { value: 0 }, uTilt: { value: new THREE.Vector2() } }), []);
  uniformsFront.uMap.value = tex?.front ?? null;
  uniformsBack.uMap.value = tex?.back ?? null;

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    flip.current += ((flipped ? Math.PI : 0) - flip.current) * Math.min(1, dt * 5);
    const px = signals.tilt.enabled ? signals.tilt.x : signals.pointer.x;
    const py = signals.tilt.enabled ? signals.tilt.y : signals.pointer.y;
    g.rotation.y = flip.current + px * 0.35;
    g.rotation.x = -py * 0.25;
    g.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.04;
    for (const u of [uniformsFront, uniformsBack]) {
      u.uTime.value = state.clock.elapsedTime;
      u.uTilt.value.set(px, py);
    }
  });

  if (!tex) return null;
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 4.6]} fov={40} />
      <group ref={group}>
        <mesh position={[0, 0, 0.014]}>
          <planeGeometry args={[W, H]} />
          <shaderMaterial vertexShader={foilVertex} fragmentShader={foilFragment} uniforms={uniformsFront} transparent />
        </mesh>
        <mesh position={[0, 0, -0.014]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[W, H]} />
          <shaderMaterial vertexShader={foilVertex} fragmentShader={foilFragment} uniforms={uniformsBack} transparent />
        </mesh>
        {/* Thin glowing edge so the card reads as a solid slab when tilted. */}
        <mesh>
          <boxGeometry args={[W + 0.02, H + 0.02, 0.025]} />
          <meshBasicMaterial color="#00e5ff" transparent opacity={0.25} toneMapped={false} />
        </mesh>
      </group>
    </>
  );
}
