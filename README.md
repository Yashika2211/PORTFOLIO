# Yashika Bhatia — Holographic AI Portfolio

A dark, glowing command center hosted by **Y.A.S.H.U.** (*Yashika's Autonomous Systems & Hacks Unit*): it boots up, talks, reacts, and shows the work as interactive holograms, while staying fast, accessible, and readable by a recruiter in 30 seconds. Short on time? Go to **`/recruiter`** ("Skip the show →" in the HUD).

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · three.js / React Three Fiber / drei / postprocessing · GSAP + ScrollTrigger · Framer Motion · Lenis · Zustand · Vitest · Playwright

---

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npm run start        # serve the production build
npm run lint
npm test             # Vitest unit tests (intent router)
npm run test:e2e     # Playwright e2e (builds and serves on :3200; first run: npx playwright install chromium)
```

Node 20+ is required.

## Edit the content

**All text lives in [`src/data/portfolio.ts`](src/data/portfolio.ts)**: profile, links, stats, experience, skills, projects (with their architecture diagrams), lab projects, achievements and boot lines. Components read only from this file, so you never need to touch a component to change copy.

- **Projects:** each entry has `problem`, `built`, `metrics`, `stack`, `repo`, `live`, `skills` (which drives the skill-constellation highlighting) and `arch` (nodes and edges on a 100×60 grid, used by both the 2D and 3D diagrams).
- **Y.A.S.H.U.'s personality** lives in [`src/yashu/lines.ts`](src/yashu/lines.ts), and its commands in [`src/yashu/intents.ts`](src/yashu/intents.ts).

## Swap the resume

Drop your PDF at **`public/Yashika_Bhatia_Resume.pdf`**, keeping that exact filename. Every resume button, the "download resume" voice command, and the QR code on the back of the ID card point there. To use a different filename, change `profile.resume` in `portfolio.ts`.

## Deploy to Vercel

1. Push to GitHub, then import the repo at <https://vercel.com/new> (the framework is detected automatically).
2. Set environment variables (all optional; see below), including `NEXT_PUBLIC_SITE_URL=https://your-domain`.
3. Deploy. The API routes run as serverless functions, and the sitemap, robots.txt and Open Graph image are generated.

---

## Features: what they are, how to toggle them, how they degrade

| Feature | Where | Toggle / how to turn it off | Fallback |
|---|---|---|---|
| **Boot sequence** (scan line, typed boot log, particle assembly) | `components/hud/BootSequence.tsx` | Skippable (button, Esc or Enter); shown once, remembered in `localStorage["yashu:booted:v1"]` | Skipped under reduced motion; a CSS failsafe hides it after 6s if JS fails |
| **Single shared WebGL stage**: arc core, starfield, gates, scroll camera path | `src/scenes/SceneRoot.tsx`, `Stage.tsx` | Automatic. Pin the minimal tier with `localStorage["yashu:quality"]="low"` | No WebGL, low-power device or reduced motion → 2D SVG/CSS core, same content |
| **Auto quality** (drei `PerformanceMonitor`: particles, post-processing, DPR) | `SceneRoot.tsx` | Automatic | Drops to the minimal tier when FPS falls |
| **Audio-reactive core**: shader, ring speed, EQ ring follow the voice; amber and contracted while listening | `scenes/core/*`, `yashu/audio.ts` | Follows voice and mic state | Idle breathing pulse |
| **Voice output** (`useYashuVoice`) | `yashu/voice.ts` | **Off until opt-in**: ENGAGE / SILENT MODE prompt, then the *Voice* HUD toggle, or say "mute" | Every line is always shown as a subtitle and announced via `aria-live` |
| **Premium voice** (ElevenLabs / OpenAI TTS) | `app/api/tts/route.ts` | Set `TTS_PROVIDER` + `TTS_API_KEY` | No key → browser `speechSynthesis`, silently |
| **Voice input + "Hey Yashu" wake phrase** | `yashu/listen.ts` | Mic button in the command bar (one command); *Wake* HUD toggle (always-on, wake phrase required) | Hidden where `SpeechRecognition` is unsupported |
| **Command bar** (Cmd/Ctrl+K, fuzzy intents) | `components/hud/CommandBar.tsx`, `yashu/intents.ts` | Always available; floating button on mobile | Deterministic, offline, no keys |
| **LLM brain** (free-form questions, answers only from `portfolio.ts`, streamed) | `app/api/ask/route.ts` | Set `LLM_API_KEY` (Anthropic) | No key → witty intent-router fallback |
| **Personality**: time-aware and returning-visitor greetings, idle nudges, section narration | `yashu/Director.tsx`, `lines.ts` | Narration is spoken only when voice is on | Subtitles only |
| **Guided tour** (~75s narrated autopilot) | `yashu/tour.ts`, `ui/TourBar.tsx` | Say or type "take the tour"; any scroll, key or click hands back control; *exit* button | Works without WebGL (scroll + subtitles) |
| **Transitions**: hologram materialize, warp jump, data-stream wipe, portal iris, glitch cut | `yashu/transitions/Transitions.tsx`, `ProjectBriefing.tsx` | Warp is skippable (any key or click) | Reduced motion → 200ms fades |
| **Project projections** (5 procedural 3D models rise out of the cards) | `scenes/projections/*` | Hover or focus a case file | Lazy per card; skipped on touch, no-WebGL and reduced motion |
| **3D architecture** in briefings, with parallax (mouse or device tilt) | `scenes/views/ArchScene.tsx`, `yashu/tilt.ts` | Tilt is opt-in ("Enable tilt parallax"; iOS permission prompt) | Animated SVG diagram |
| **Skill constellation** (drag to rotate, click to trace beams to projects) | `scenes/views/ConstellationScene.tsx` | Click a node or chip to pin, again to clear | SVG orbits + chips |
| **Holographic ID card** (iridescent foil shader, QR back → resume) | `scenes/views/IdCardScene.tsx` | Click to flip | CSS 3D flip card |
| **Hand gestures** (MediaPipe: palm = pause, swipe = section, pinch = open) | `yashu/gestures.ts`, `ui/GesturePanel.tsx` | **Off by default**. *Hands* HUD toggle, or say "gesture control". Camera consent required; *stop ✕* turns it off | Video never leaves the device; nothing loads until consent |
| **Custom cursor** (energy ring, particle ribbon, magnetic snap, lock-on brackets) | `components/hud/Cursor.tsx` | Fine pointers only | Native cursor on touch and under reduced motion |
| **Sound design** (procedural hum, blips, whoosh, shimmer; no audio files) | `lib/sound.ts` | **Off by default**. *SFX* HUD toggle; "go dark" also silences | — |
| **Achievements** (Explorer, Deep diver, Talker, Night owl, Tourist, Root access, Overdrive → secret) | `yashu/achievements.ts`, `ui/Toasts.tsx` | Persisted in `localStorage["yashu:state:v1"]`; clear site data to reset | Toasts announced politely |
| **Easter eggs**: Konami code → Protocol: Overdrive; `sudo hire yashika`; "Hey Yashu, who built you?" | `ui/EasterEggs.tsx` | Konami again turns Overdrive off | — |
| **Live telemetry**: 3D contribution terrain, latest push, Bengaluru time + weather, systems status | `sections/Telemetry.tsx`, `lib/telemetry.ts`, `app/api/github`, `app/api/contributions` | Automatic, cached (GitHub 30 min, contributions 6 h, weather 30 min) | Static fallbacks / 2D heatmap |
| **Exit intent** (once per session, desktop) | `ui/ExitIntent.tsx` | Dismiss with ✕ or Esc; never blocks | — |
| **Recruiter mode** | `app/recruiter/page.tsx` | "Skip the show →" or say "recruiter mode" | Server-rendered text, no JS effects |

### Commands to try

`show projects` · `open Haggle` · `what's her best project` · `experience` · `skills in AI` · `download resume` · `contact` · `take the tour` · `go dark` · `surprise me` · `who are you` · `mute` · `gesture control` · `sudo hire yashika`

## Environment variables

Copy `.env.example` to `.env.local`. **All are optional, and every secret stays server-side**: nothing is exposed with a `NEXT_PUBLIC_` prefix except the two public values below.

| Variable | Used by | Effect when unset |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | metadata, sitemap, OG, QR code | Defaults to `https://yashika-bhatia.vercel.app` |
| `NEXT_PUBLIC_FORMSPREE_ENDPOINT` | contact form | Form opens a pre-filled email instead |
| `TTS_PROVIDER` | `/api/tts` | `elevenlabs` or `openai`; unset → browser voice |
| `TTS_API_KEY` | `/api/tts` | Unset → browser voice |
| `TTS_VOICE` | `/api/tts` | Provider default voice |
| `LLM_API_KEY` | `/api/ask` (Anthropic API) | Unset → intent router answers everything |
| `GITHUB_TOKEN` | `/api/github` | Unauthenticated, cached for 30 min |

All `/api/*` routes validate input length, rate-limit per IP, and time out upstream calls.

## Accessibility & performance notes

- Every 3D canvas is `aria-hidden`; the DOM carries the real content. Every spoken line is mirrored to an `aria-live` region. Every voice command also has a keyboard or button path.
- Focus is trapped in the briefing and returned to the card on close. All controls show visible focus rings.
- `prefers-reduced-motion`: no boot, warp, glitch, camera path or WebGL; only short fades.
- One WebGL context for the whole page. three.js and the models are code-split and lazy-loaded; rendering pauses when the tab is hidden; DPR is capped by quality tier.

## Project layout

```
src/
  app/            routes: page, recruiter, api/{ask,tts,github,contributions}, OG image, sitemap, robots
  data/           portfolio.ts — all content
  yashu/          assistant: store, voice, listen, intents, lines, tour, gestures, audio, transitions, ui/
  scenes/         shared WebGL stage: core/, space/, views/, projections/
  components/     hud/, sections/, fallback/, providers/
  lib/            capabilities, sound, github, telemetry, rate limiting
tests/            Vitest unit tests
e2e/              Playwright end-to-end tests
```

All visuals, sounds and the assistant persona are original. No third-party characters, logos, voices or assets are used.
