"use client";

import { useEffect, useState } from "react";
import { useYashu } from "../store";
import { getVoicePrefs, listFemaleVoices, previewVoice, primeSpeech, setVoicePrefs } from "../voice";

type V = { name: string; lang: string };

/** Pick Y.A.S.H.U.'s voice from the female voices installed on this device. */
export function VoiceSettings() {
  const open = useYashu((s) => s.voiceSettings);
  const set = useYashu((s) => s.set);
  const [voices, setVoices] = useState<V[] | null>(null);
  const [chosen, setChosen] = useState<string | undefined>();
  const [rate, setRate] = useState(1);

  useEffect(() => {
    if (!open) return;
    const p = getVoicePrefs();
    setRate(p.rate ?? 1);
    void listFemaleVoices().then((list) => {
      const vs = list.slice(0, 10).map((v) => ({ name: v.name, lang: v.lang }));
      setVoices(vs);
      setChosen(p.name && vs.some((v) => v.name === p.name) ? p.name : vs[0]?.name);
    });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && set({ voiceSettings: false });
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, set]);

  if (!open) return null;

  const pick = (name: string) => {
    setChosen(name);
    setVoicePrefs({ name });
    previewVoice(name);
  };

  return (
    <div role="dialog" aria-modal="false" aria-labelledby="voice-settings-title" className="glass fixed left-1/2 top-20 z-[82] w-[min(420px,calc(100vw-32px))] -translate-x-1/2 p-5 md:left-auto md:right-8 md:translate-x-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="hud-label text-amber">Audio channel</p>
          <p id="voice-settings-title" className="mt-1 font-display text-lg uppercase tracking-wide text-ink">
            Y.A.S.H.U.&apos;s voice
          </p>
        </div>
        <button type="button" onClick={() => set({ voiceSettings: false })} className="font-mono text-xs text-muted hover:text-ink" aria-label="Close voice settings">
          ✕
        </button>
      </div>

      {voices === null && <p className="mt-3 text-sm text-muted">Scanning installed voices…</p>}
      {voices?.length === 0 && (
        <p className="mt-3 text-sm text-muted">
          No female voice is installed on this device, so it uses its default. Add one in your system&apos;s speech settings, or enable the premium voice
          (TTS keys) for a consistent female voice everywhere.
        </p>
      )}
      {voices && voices.length > 0 && (
        <fieldset className="mt-3">
          <legend className="sr-only">Choose a voice</legend>
          <ul className="max-h-64 space-y-1.5 overflow-y-auto pr-1" data-lenis-prevent>
            {voices.map((v, i) => (
              <li key={v.name}>
                <label className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 transition ${chosen === v.name ? "border-amber bg-amber/10" : "border-cyan/20 hover:border-cyan/50"}`}>
                  <input type="radio" name="yashu-voice" className="accent-amber" checked={chosen === v.name} onChange={() => pick(v.name)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{v.name.replace(/^Microsoft\s+/, "").replace(/\s*-\s*English.*$/, "")}</span>
                    <span className="block font-mono text-[10px] text-muted">
                      {v.lang}
                      {i === 0 && " · recommended"}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="font-mono text-[11px] text-cyan hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      previewVoice(v.name);
                    }}
                    aria-label={`Preview ${v.name}`}
                  >
                    ▶ play
                  </button>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      )}

      <label className="mt-4 block">
        <span className="hud-label">Speed · {rate.toFixed(2)}×</span>
        <input
          type="range"
          min={0.85}
          max={1.2}
          step={0.05}
          value={rate}
          onChange={(e) => {
            const r = Number(e.target.value);
            setRate(r);
            setVoicePrefs({ rate: r });
          }}
          onPointerUp={() => chosen && previewVoice(chosen)}
          className="mt-2 w-full accent-cyan"
        />
      </label>
      <button
        type="button"
        className="btn-energy amber mt-4 !px-3 !py-2"
        onClick={() => {
          primeSpeech();
          useYashu.getState().setVoice(true);
          set({ voiceSettings: false });
        }}
      >
        Use this voice
      </button>
    </div>
  );
}
