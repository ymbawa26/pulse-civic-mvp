import { Card } from "@/components/ui/card";
import { ReportForm } from "@/components/forms/report-form";
import { getCurrentUser } from "@/lib/server/auth";

export default async function ReportPage() {
  const user = await getCurrentUser();

  return (
    <div className="page-shell py-8 md:py-12">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="grid gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-accent-strong)]">
            Private report
          </p>
          <h1 className="text-4xl">Report a local issue</h1>
          <p className="text-sm leading-7 text-[var(--color-ink-muted)]">
            Share a local pattern privately. Pulse will look for similar nearby reports and explain any match it finds.
          </p>
          <div className="grid gap-3 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-ink-muted)]">
            <p>Use this for housing neglect, campus issues, neighborhood safety concerns, recurring local service failures, and similar civic problems.</p>
            <p>Do not use Pulse to post threats, rumors, or accusations against private individuals.</p>
          </div>
        </Card>

        <Card>
          <ReportForm user={user} />
        </Card>
      </div>
    </div>
  );
}

