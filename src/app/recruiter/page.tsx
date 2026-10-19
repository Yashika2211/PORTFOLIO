import type { Metadata } from "next";
import Link from "next/link";
import { achievements, awsServices, experience, lab, profile, projects, skillGroups, stats } from "@/data/portfolio";

export const metadata: Metadata = {
  title: "Recruiter mode",
  description: `${profile.name} — ${profile.headline}. Plain-text résumé view: experience, projects, skills and contact.`,
  alternates: { canonical: "/recruiter" },
};

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 mt-12 border-b border-cyan/20 pb-2 font-display text-sm font-bold uppercase tracking-[0.2em] text-cyan">{children}</h2>;
}

const linkCls = "text-cyan underline-offset-4 hover:underline";

export default function RecruiterPage() {
  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-12 text-[15px] leading-relaxed text-ink sm:px-8 sm:py-16">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="font-mono text-sm text-muted hover:text-ink">
          ← Back to the full experience
        </Link>
        <a href={profile.resume} download className="btn-energy amber">
          Download resume
        </a>
      </div>

      <header>
        <h1 className="font-display text-3xl font-black uppercase tracking-wide sm:text-4xl">{profile.name}</h1>
        <p className="mt-2 text-lg text-ink/90">{profile.headline}</p>
        <p className="mt-1 font-mono text-sm text-amber">{profile.tagline}</p>
        <p className="mt-4 text-muted">
          {profile.location} ·{" "}
          {profile.links.map((l, i) => (
            <span key={l.label}>
              {i > 0 && " · "}
              <a href={l.href} className={linkCls} {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {l.label === "Email" ? profile.email : l.label}
              </a>
            </span>
          ))}
        </p>
      </header>

      <H2>At a glance</H2>
      <ul className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
        {stats.map((s) => (
          <li key={s.id}>
            <strong className="text-amber">
              {s.decimals ? s.value.toFixed(s.decimals) : s.value}
              {s.suffix}
            </strong>{" "}
            {s.label}
          </li>
        ))}
      </ul>

      <H2>Education</H2>
      <p>
        <strong>{profile.education.degree}</strong>, {profile.education.school} — {profile.education.period} · CGPA{" "}
        {profile.education.cgpa}
      </p>

      <H2>Experience</H2>
      <div className="space-y-6">
        {experience.map((e) => (
          <section key={e.org + e.period}>
            <h3 className="font-bold">
              {e.role} — {e.org}
            </h3>
            <p className="font-mono text-xs text-muted">{e.period}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-cyan">
              {e.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <H2>Featured projects</H2>
      <div className="space-y-8">
        {projects.map((p) => (
          <section key={p.slug}>
            <h3 className="font-bold">
              {p.title} — {p.subtitle}
              {p.event && <span className="font-normal text-muted"> ({p.event})</span>}
            </h3>
            <p className="mt-1 text-ink/85">{p.problem}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-cyan">
              {p.built.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <p className="mt-2 text-sm">
              <span className="text-muted">Numbers: </span>
              {p.metrics.map((m) => `${m.value} ${m.label}`).join(" · ")}
            </p>
            <p className="text-sm">
              <span className="text-muted">Stack: </span>
              {p.stack.join(", ")}
            </p>
            <p className="mt-1 text-sm">
              {p.repo && (
                <a href={p.repo} className={linkCls} target="_blank" rel="noopener noreferrer">
                  Source
                </a>
              )}
              {p.repo && p.live && " · "}
              {p.live && (
                <a href={p.live} className={linkCls} target="_blank" rel="noopener noreferrer">
                  Live
                </a>
              )}
            </p>
          </section>
        ))}
      </div>

      <H2>More from the lab</H2>
      <ul className="space-y-2">
        {lab.map((l) => (
          <li key={l.title}>
            <strong>{l.title}</strong> — {l.blurb} <span className="text-muted">({l.stack.join(", ")})</span>{" "}
            {(l.repo ?? l.live) && (
              <a href={l.repo ?? l.live} className={linkCls} target="_blank" rel="noopener noreferrer">
                {l.repo ? "repo" : "live"}
              </a>
            )}
          </li>
        ))}
      </ul>

      <H2>Skills</H2>
      <dl className="space-y-2">
        {skillGroups.map((g) => (
          <div key={g.id}>
            <dt className="inline font-bold">{g.label}: </dt>
            <dd className="inline">
              {g.skills.join(", ")}
              {g.id === "backend" && ` (AWS: ${awsServices.join(", ")})`}
            </dd>
          </div>
        ))}
      </dl>

      <H2>Achievements</H2>
      <ul className="list-disc space-y-1 pl-5 marker:text-amber">
        {achievements.map((a) => (
          <li key={a.id}>{a.detail}</li>
        ))}
      </ul>

      <footer className="mt-16 border-t border-cyan/20 pt-6 text-sm text-muted">
        Get in touch:{" "}
        <a href={`mailto:${profile.email}`} className={linkCls}>
          {profile.email}
        </a>
      </footer>
    </main>
  );
}
