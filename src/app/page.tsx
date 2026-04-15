import Link from "next/link";
import { ArrowRight, LockKeyhole, Shield, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";
import { getRepository } from "@/lib/data/repository";

export default async function Home() {
  const repository = await getRepository();
  const patterns = await repository.listPublicPatterns();

  return (
    <div className="page-shell py-8 md:py-12">
      <section className="hero-panel overflow-hidden rounded-[40px] border border-white/80 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] md:p-10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-6">
            <Badge tone="accent">Privacy-first civic coordination</Badge>
            <div className="grid gap-4">
              <h1 className="max-w-3xl text-4xl leading-tight md:text-6xl">
                When a problem keeps happening, people should know they are not alone.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--color-ink-muted)]">
                Pulse helps people privately report local issues, detect patterns, and connect safely with others facing the same problem.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/report" className={buttonStyles("primary")}>
                Report an issue
              </Link>
              <Link href="/patterns" className={buttonStyles("secondary")}>
                Explore local patterns
              </Link>
            </div>
            <div className="grid gap-3 text-sm text-[var(--color-ink-muted)] sm:grid-cols-3">
              <div className="rounded-3xl border border-[var(--color-border)] bg-white/80 p-4">
                Private reporting, not public callouts
              </div>
              <div className="rounded-3xl border border-[var(--color-border)] bg-white/80 p-4">
                Explainable matching based on category, distance, keywords, and time
              </div>
              <div className="rounded-3xl border border-[var(--color-border)] bg-white/80 p-4">
                Safe action rooms for lawful next steps
              </div>
            </div>
          </div>

          <Card className="hero-panel data-grid relative overflow-hidden">
            <div className="grid gap-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-accent-strong)]">
                    How Pulse works
                  </p>
                  <h2 className="mt-2 text-3xl">Private issue matching in one calm flow</h2>
                </div>
                <div className="rounded-full bg-[var(--color-accent-soft)] p-3">
                  <Users className="size-5 text-[var(--color-accent-strong)]" />
                </div>
              </div>
              <ol className="grid gap-4 text-sm text-[var(--color-ink-muted)]">
                <li className="rounded-3xl border border-[var(--color-border)] bg-white/80 p-4">
                  1. Report a local issue privately with evidence and privacy controls.
                </li>
                <li className="rounded-3xl border border-[var(--color-border)] bg-white/80 p-4">
                  2. Pulse checks for nearby reports in the same category with similar keywords and timing.
                </li>
                <li className="rounded-3xl border border-[var(--color-border)] bg-white/80 p-4">
                  3. If a pattern exists, you can join a private room for safe, lawful coordination.
                </li>
              </ol>
            </div>
          </Card>
        </div>
      </section>

      <section className="mt-14 grid gap-5 md:grid-cols-3">
        <Card>
          <LockKeyhole className="mb-4 size-6 text-[var(--color-accent-strong)]" />
          <h2 className="text-2xl">Privacy first</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--color-ink-muted)]">
            Raw reports stay private. Public views show approximate locations and reported patterns only.
          </p>
        </Card>
        <Card>
          <Shield className="mb-4 size-6 text-[var(--color-accent-strong)]" />
          <h2 className="text-2xl">Safety first</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--color-ink-muted)]">
            Pulse blocks threats, harassment prompts, and sensitive details in public-facing spaces.
          </p>
        </Card>
        <Card>
          <Users className="mb-4 size-6 text-[var(--color-accent-strong)]" />
          <h2 className="text-2xl">Pattern over outrage</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--color-ink-muted)]">
            The goal is not a feed. It is finding credible local patterns and helping people coordinate safely.
          </p>
        </Card>
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="grid gap-4">
          <Badge tone="neutral">Safe public pattern view</Badge>
          <h2 className="text-3xl">What people can see publicly</h2>
          <p className="text-sm leading-7 text-[var(--color-ink-muted)]">
            Pulse shares only approximate clusters with careful language like “reported pattern” and never exposes exact addresses or raw private reports.
          </p>
          <Link href="/patterns" className={`${buttonStyles("secondary")} w-fit`}>
            Explore local patterns <ArrowRight className="ml-2 size-4" />
          </Link>
        </Card>
        <div className="grid gap-4">
          {patterns.length ? (
            patterns.slice(0, 3).map((pattern) => (
              <Card key={pattern.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-accent-strong)]">{pattern.category}</p>
                    <h3 className="mt-2 text-2xl">{pattern.approximateLocationLabel}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--color-ink-muted)]">{pattern.summary}</p>
                  </div>
                  <Badge tone={pattern.trend === "rising" ? "warning" : "accent"}>{pattern.trend}</Badge>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <h3 className="text-2xl">Patterns will appear here as private reports accumulate safely.</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--color-ink-muted)]">
                Early communities may not have enough data yet to show privacy-preserving public clusters.
              </p>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

