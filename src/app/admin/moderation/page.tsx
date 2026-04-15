import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getRepository } from "@/lib/data/repository";
import { getCurrentModerator } from "@/lib/server/auth";
import { formatFullDate } from "@/lib/utils";

export default async function ModerationPage() {
  const moderator = await getCurrentModerator();
  if (!moderator) {
    redirect("/auth/sign-in?next=/admin/moderation");
  }

  const repository = await getRepository();
  const queue = await repository.listModerationQueue();

  return (
    <div className="page-shell py-8 md:py-12">
      <div className="grid gap-6">
        <Card className="grid gap-4">
          <Badge tone="accent">Moderation dashboard</Badge>
          <h1 className="text-4xl">Flagged and review-needed reports</h1>
          <p className="text-sm leading-7 text-[var(--color-ink-muted)]">
            Review submissions with safety flags before they contribute to public pattern visibility.
          </p>
        </Card>

        {queue.length ? (
          queue.map((item) => (
            <Card key={item.report.id} className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-accent-strong)]">{item.report.category}</p>
                  <h2 className="mt-2 text-2xl">{item.report.title}</h2>
                </div>
                <div className="flex gap-2">
                  <Badge tone="warning">{item.report.status}</Badge>
                  <Badge tone="neutral">{item.report.moderationFlags.length + item.reportedByUsers} signals</Badge>
                </div>
              </div>
              <p className="text-sm leading-7 text-[var(--color-ink-muted)]">{item.report.description}</p>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-ink-muted)]">
                  Submitted {formatFullDate(item.report.createdAt)}
                </div>
                <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-ink-muted)]">
                  Reporter {item.user?.displayName ?? "Anonymous"}
                </div>
                <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-ink-muted)]">
                  {item.report.approximateLocationLabel}
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {item.flags.map((flag) => (
                  <div key={flag.message} className="rounded-[24px] border border-[#f0dfc0] bg-[#fff8ee] p-4 text-sm text-[#7d5a12]">
                    {flag.message}
                  </div>
                ))}
                {!item.flags.length && item.reportedByUsers > 0 ? (
                  <div className="rounded-[24px] border border-[#f0dfc0] bg-[#fff8ee] p-4 text-sm text-[#7d5a12]">
                    Community flag count: {item.reportedByUsers}
                  </div>
                ) : null}
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <h2 className="text-2xl">Queue is clear</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--color-ink-muted)]">
              No reports currently need moderator review.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

