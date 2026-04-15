import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RoomPostForm } from "@/components/forms/room-post-form";
import { castVoteAction, joinRoomAction } from "@/lib/actions/report";
import { getRepository } from "@/lib/data/repository";
import { getCurrentUser } from "@/lib/server/auth";
import { formatRelative } from "@/lib/utils";

export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ request?: string }>;
}) {
  const { id } = await params;
  const { request } = await searchParams;
  const repository = await getRepository();
  const user = await getCurrentUser();
  const details = await repository.getRoomDetails(id, user?.id ?? null);

  if (!details) {
    notFound();
  }

  const voteCounts = details.room.suggestedActions.map((option) => ({
    option,
    votes: details.votes.filter((vote) => vote.optionId === option.id).length,
  }));

  return (
    <div className="page-shell py-8 md:py-12">
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="grid gap-4">
          <Badge tone="accent">Private action room</Badge>
          <h1 className="text-4xl">{details.room.title}</h1>
          <p className="text-sm leading-7 text-[var(--color-ink-muted)]">{details.room.summary}</p>
          <div className="grid gap-3 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-ink-muted)]">
            {details.room.guidelines.map((guideline) => (
              <p key={guideline}>{guideline}</p>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="text-3xl font-semibold">{details.members.filter((member) => member.status === "approved").length}</div>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">approved participants</p>
            </div>
            <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="text-3xl font-semibold">{details.evidenceCoverage}</div>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">reports with evidence attached</p>
            </div>
          </div>
        </Card>

        {!user ? (
          <Card className="grid gap-4">
            <h2 className="text-3xl">Sign in required</h2>
            <p className="text-sm leading-7 text-[var(--color-ink-muted)]">
              Pulse rooms are private. Sign in first so we can verify whether you have a matched report or approved access.
            </p>
            <Link href={`/auth/sign-in?next=${encodeURIComponent(`/rooms/${details.room.id}`)}`} className={buttonStyles("primary")}>
              Sign in to continue
            </Link>
          </Card>
        ) : !details.accessible ? (
          <Card className="grid gap-4">
            <h2 className="text-3xl">
              {details.membershipStatus === "pending" ? "Access request pending" : "Access is limited to matched users"}
            </h2>
            <p className="text-sm leading-7 text-[var(--color-ink-muted)]">
              This room is only visible to approved participants. If you reported a similar issue, you can request access and moderators can review it.
            </p>
            {details.membershipStatus !== "pending" ? (
              <form action={joinRoomAction}>
                <input type="hidden" name="roomId" value={details.room.id} />
                <input type="hidden" name="returnTo" value={`/rooms/${details.room.id}`} />
                <button className={buttonStyles("primary")} type="submit">
                  Request room access
                </button>
              </form>
            ) : null}
            {request === "pending" ? (
              <div className="rounded-[24px] border border-[#f0dfc0] bg-[#fff8ee] p-4 text-sm text-[#7d5a12]">
                Your request was saved. A moderator can approve access if your report fits the room safely.
              </div>
            ) : null}
          </Card>
        ) : (
          <div className="grid gap-6">
            <Card className="grid gap-4">
              <h2 className="text-3xl">Suggested next steps</h2>
              <div className="grid gap-3">
                {voteCounts.map(({ option, votes }) => (
                  <div key={option.id} className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">{option.label}</p>
                        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{option.description}</p>
                      </div>
                      <form action={castVoteAction} className="flex items-center gap-3">
                        <input type="hidden" name="roomId" value={details.room.id} />
                        <input type="hidden" name="optionId" value={option.id} />
                        <button className={buttonStyles("secondary")} type="submit">
                          Vote
                        </button>
                        <Badge tone="accent">{votes} votes</Badge>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="grid gap-4">
              <h2 className="text-3xl">Shared evidence checklist</h2>
              <div className="grid gap-3 md:grid-cols-3">
                {details.room.checklist.map((item) => (
                  <div key={item.id} className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <p className="font-semibold">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-ink-muted)]">{item.description}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="grid gap-4">
              <h2 className="text-3xl">Discussion thread</h2>
              {details.posts.length ? (
                <div className="grid gap-3">
                  {details.posts.map((post) => (
                    <div key={post.id} className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <strong>{post.authorDisplayName}</strong>
                        <span className="text-sm text-[var(--color-ink-muted)]">{formatRelative(post.createdAt)}</span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[var(--color-ink-muted)]">{post.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-ink-muted)]">
                  No one has posted yet. Start with a factual timeline or an evidence update.
                </div>
              )}
              <RoomPostForm roomId={details.room.id} />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

