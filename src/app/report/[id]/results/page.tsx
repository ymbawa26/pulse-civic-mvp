import Link from "next/link";
import { notFound } from "next/navigation";

import { FlagReportForm } from "@/components/forms/flag-report-form";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { joinRoomAction } from "@/lib/actions/report";
import { getRepository } from "@/lib/data/repository";
import { formatFullDate } from "@/lib/utils";
import { getCurrentUser } from "@/lib/server/auth";

export default async function ReportResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ flag?: string }>;
}) {
  const { id } = await params;
  const { flag } = await searchParams;
  const repository = await getRepository();
  const summary = await repository.getMatchSummary(id);
  const user = await getCurrentUser();

  if (!summary) {
    notFound();
  }

  return (
    <div className="page-shell py-8 md:py-12">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="grid gap-5">
          <Badge tone={summary.matches.length ? "success" : "neutral"}>
            {summary.matches.length ? "You are not alone" : "No nearby match yet"}
          </Badge>
          <div>
            <h1 className="text-4xl">{summary.matches.length ? "Pattern check complete" : "Your report was submitted safely"}</h1>
            <p className="mt-3 text-sm leading-7 text-[var(--color-ink-muted)]">{summary.summary}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="text-3xl font-semibold">{summary.similarReportsCount}</div>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">similar private reports</p>
            </div>
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="text-3xl font-semibold">{summary.last7DaysCount}</div>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">in the last 7 days</p>
            </div>
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="text-3xl font-semibold">{summary.last30DaysCount}</div>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">in the last 30 days</p>
            </div>
          </div>
          <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <p className="text-sm text-[var(--color-ink-muted)]">Your report stays private. Pulse shows only approximate public pattern data and does not verify all claims automatically.</p>
          </div>
          {summary.duplicateOf ? (
            <div className="rounded-[28px] border border-[#f0dfc0] bg-[#fff8ee] p-5 text-sm text-[#7d5a12]">
              This report looks very similar to another nearby report submitted on {formatFullDate(summary.duplicateOf.createdAt)}. Pulse kept your report, but marked it as a possible duplicate so moderators can review it carefully.
            </div>
          ) : null}
        </Card>

        <div className="grid gap-6">
          <Card className="grid gap-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--color-accent-strong)]">{summary.report.category}</p>
                <h2 className="mt-2 text-3xl">{summary.report.title}</h2>
              </div>
              <Badge tone="accent">{summary.report.status}</Badge>
            </div>
            <p className="text-sm leading-7 text-[var(--color-ink-muted)]">{summary.report.description}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {summary.matches.slice(0, 4).map((match) => (
                <div key={match.reportId} className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <strong>{match.confidence}</strong>
                    <span className="text-sm text-[var(--color-ink-muted)]">{match.score}</span>
                  </div>
                  <p className="mt-2 font-medium">{match.title}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--color-ink-muted)]">
                    <div className="rounded-2xl border border-[var(--color-border)] px-3 py-2">
                      <div className="font-semibold text-[var(--color-ink)]">Distance</div>
                      <div>{Math.round(match.scoreBreakdown.distance)}%</div>
                    </div>
                    <div className="rounded-2xl border border-[var(--color-border)] px-3 py-2">
                      <div className="font-semibold text-[var(--color-ink)]">Keywords</div>
                      <div>{Math.round(match.scoreBreakdown.keywords)}%</div>
                    </div>
                    <div className="rounded-2xl border border-[var(--color-border)] px-3 py-2">
                      <div className="font-semibold text-[var(--color-ink)]">Timing</div>
                      <div>{Math.round(match.scoreBreakdown.time)}%</div>
                    </div>
                    <div className="rounded-2xl border border-[var(--color-border)] px-3 py-2">
                      <div className="font-semibold text-[var(--color-ink)]">Semantic signal</div>
                      <div>{Math.round(match.scoreBreakdown.semantic)}%</div>
                    </div>
                  </div>
                  <ul className="mt-3 grid gap-2 text-sm text-[var(--color-ink-muted)]">
                    {match.reasoning.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
              ))}
              {!summary.matches.length ? (
                <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-ink-muted)] md:col-span-2">
                  No nearby report crossed the current match threshold. Pulse will keep checking as new reports arrive in this region.
                </div>
              ) : null}
            </div>
            {summary.matches.length ? (
              <p className="text-xs leading-6 text-[var(--color-ink-soft)]">
                Pulse uses distance, timing, keyword overlap, and a small neural similarity model as matching signals. The semantic score helps compare related wording, but it does not verify the underlying claim.
              </p>
            ) : null}
          </Card>

          <Card className="grid gap-4">
            <h2 className="text-3xl">Private action room</h2>
            <p className="text-sm leading-7 text-[var(--color-ink-muted)]">
              Action rooms are reserved for matched or approved participants. They include a factual discussion thread, evidence checklist, and voting for lawful next steps.
            </p>
            {summary.room ? (
              user ? (
                <form action={joinRoomAction} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input type="hidden" name="roomId" value={summary.room.id} />
                  <input type="hidden" name="reportId" value={summary.report.id} />
                  <input type="hidden" name="returnTo" value={`/report/${summary.report.id}/results`} />
                  <button className={buttonStyles("primary")} type="submit">
                    Join private action room
                  </button>
                  <Link href={`/rooms/${summary.room.id}`} className={buttonStyles("secondary")}>
                    View room preview
                  </Link>
                </form>
              ) : (
                <Link
                  href={`/auth/sign-in?next=${encodeURIComponent(`/report/${summary.report.id}/results`)}`}
                  className={buttonStyles("primary")}
                >
                  Sign in to join the room
                </Link>
              )
            ) : (
              <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-ink-muted)]">
                No action room exists yet for this cluster. Pulse will create one when a safe match group forms.
              </div>
            )}
          </Card>

          <Card>
            <FlagReportForm
              reportId={summary.report.id}
              returnTo={`/report/${summary.report.id}/results`}
              status={flag === "sent" || flag === "error" ? flag : undefined}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
