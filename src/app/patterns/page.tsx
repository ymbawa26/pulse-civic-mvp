import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getRepository } from "@/lib/data/repository";

export default async function PatternsPage() {
  const repository = await getRepository();
  const patterns = await repository.listPublicPatterns();

  return (
    <div className="page-shell py-8 md:py-12">
      <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
        <Card className="grid gap-4">
          <Badge tone="accent">Safe public pattern view</Badge>
          <h1 className="text-4xl">Reported local patterns</h1>
          <p className="text-sm leading-7 text-[var(--color-ink-muted)]">
            These clusters summarize approximate areas with repeated private reports. They are not proof, and exact private reports remain hidden.
          </p>
          <div className="data-grid rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="grid grid-cols-3 gap-4">
              {patterns.slice(0, 6).map((pattern) => (
                <div key={pattern.id} className="grid place-items-center rounded-3xl border border-white/70 bg-white/80 p-4 text-center">
                  <div className="mb-2 size-3 rounded-full bg-[var(--color-accent)]" />
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">{pattern.category}</div>
                  <div className="mt-1 text-sm">{pattern.reportCount} reports</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid gap-4">
          {patterns.length ? (
            patterns.map((pattern) => (
              <Card key={pattern.id} className="grid gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-accent-strong)]">{pattern.category}</p>
                    <h2 className="mt-2 text-2xl">{pattern.approximateLocationLabel}</h2>
                  </div>
                  <Badge tone={pattern.trend === "rising" ? "warning" : "neutral"}>{pattern.trend}</Badge>
                </div>
                <p className="text-sm leading-7 text-[var(--color-ink-muted)]">{pattern.summary}</p>
                <div className="grid gap-3 text-sm text-[var(--color-ink-muted)] md:grid-cols-3">
                  <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <strong className="block text-2xl text-[var(--color-ink)]">{pattern.reportCount}</strong>
                    total reports
                  </div>
                  <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <strong className="block text-2xl text-[var(--color-ink)]">{pattern.last7DaysCount}</strong>
                    last 7 days
                  </div>
                  <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <strong className="block text-2xl text-[var(--color-ink)]">{pattern.last30DaysCount}</strong>
                    last 30 days
                  </div>
                </div>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-ink-soft)]">{pattern.confidenceNote}</p>
              </Card>
            ))
          ) : (
            <Card>
              <h2 className="text-2xl">Not enough safe data yet</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--color-ink-muted)]">
                Pulse waits until a region has enough reports to show a cluster without exposing anyone’s private situation.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

