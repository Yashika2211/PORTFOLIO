"use client";

import { useState } from "react";
import { profile } from "@/data/portfolio";
import { playSound } from "@/lib/sound";
import { SectionHeading } from "@/components/hud/SectionHeading";

/** Formspree endpoint, e.g. https://formspree.io/f/abcd1234 — set in .env.local / Vercel. */
const ENDPOINT = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT;

type Status = "idle" | "sending" | "sent" | "error";

const field =
  "w-full rounded-md border border-cyan/25 bg-void/60 px-3 py-2.5 text-ink placeholder:text-muted/60 transition focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan/50";

export function Contact() {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    if (data.get("_gotcha")) return; // honeypot

    if (!ENDPOINT) {
      // No form backend configured: hand off to the visitor's mail client.
      const subject = encodeURIComponent(`Portfolio contact from ${data.get("name")}`);
      const body = encodeURIComponent(`${data.get("message")}\n\n— ${data.get("name")} (${data.get("email")})`);
      window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
      setStatus("sent");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch(ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      setStatus("sent");
      playSound("open");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contact" aria-labelledby="contact-title" className="relative mx-auto max-w-7xl px-4 pb-40 pt-28 sm:px-8">
      <SectionHeading id="contact-title" index="06" kicker="Open a comms channel" title="Contact">
        Hiring, collaborating, or just want to talk agents and ML systems? Transmit below.
      </SectionHeading>

      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <form onSubmit={onSubmit} className="glass space-y-4 p-5 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="c-name" className="hud-label mb-1.5 block">
                Callsign
              </label>
              <input id="c-name" name="name" required autoComplete="name" placeholder="Your name" className={field} />
            </div>
            <div>
              <label htmlFor="c-email" className="hud-label mb-1.5 block">
                Frequency
              </label>
              <input id="c-email" name="email" type="email" required autoComplete="email" placeholder="you@company.com" className={field} />
            </div>
          </div>
          <div>
            <label htmlFor="c-msg" className="hud-label mb-1.5 block">
              Transmission
            </label>
            <textarea id="c-msg" name="message" required rows={5} placeholder="What are we building?" className={field} />
          </div>
          <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className="btn-energy amber" disabled={status === "sending"}>
              {status === "sending" ? "Transmitting…" : "Transmit →"}
            </button>
            <p role="status" aria-live="polite" className="font-mono text-sm">
              {status === "sent" && <span className="text-mint">Channel open — message received.</span>}
              {status === "error" && (
                <span className="text-amber">
                  Signal lost. Email{" "}
                  <a className="underline" href={`mailto:${profile.email}`}>
                    {profile.email}
                  </a>
                </span>
              )}
            </p>
          </div>
        </form>

        <div className="space-y-6">
          <div className="glass p-5 sm:p-6">
            <p className="hud-label mb-2">Direct line</p>
            <a href={`mailto:${profile.email}`} className="break-all font-mono text-ink underline-offset-4 hover:text-cyan hover:underline">
              {profile.email}
            </a>
            <p className="mt-2 text-sm text-muted">{profile.location} · IST (UTC+5:30)</p>
          </div>
          <ul className="grid grid-cols-2 gap-3">
            {profile.links
              .filter((l) => l.label !== "Email")
              .map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => playSound("hover")}
                    className="btn-energy w-full justify-center"
                  >
                    {l.label} ↗
                  </a>
                </li>
              ))}
            <li>
              <a href={profile.resume} download className="btn-energy amber w-full justify-center">
                Resume ↓
              </a>
            </li>
          </ul>
        </div>
      </div>

      <p className="mt-24 text-center font-mono text-xs text-muted">
        © {new Date().getFullYear()} {profile.name} · Built with Next.js &amp; three.js · {"// end of transmission"}
      </p>
    </section>
  );
}
