import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/forms/profile-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getRepository } from "@/lib/data/repository";
import { getCurrentUser } from "@/lib/server/auth";
import { formatFullDate } from "@/lib/utils";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/sign-in?next=/profile");
  }

  const repository = await getRepository();
  const [reports, rooms] = await Promise.all([
    repository.listUserReports(user.id),
    repository.listUserRooms(user.id),
  ]);

  return (
    <div className="page-shell py-8 md:py-12">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="grid gap-4">
          <Badge tone="accent">Profile and preferences</Badge>
          <h1 className="text-4xl">{user.displayName}</h1>
          <p className="text-sm leading-7 text-[var(--color-ink-muted)]">
            Manage your privacy defaults, pseudonym, and local label. Your raw reports stay private unless you choose otherwise.
          </p>
          <ProfileForm user={user} />
        </Card>

        <div className="grid gap-6">
          <Card className="grid gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-3xl">Your reports</h2>
              <Link href="/report" className="text-sm font-semibold text-[var(--color-accent-strong)]">
                Report another issue
              </Link>
            </div>
            {reports.length ? (
              <div className="grid gap-3">
                {reports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/report/${report.id}/results`}
                    className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <strong>{report.title}</strong>
                      <Badge tone="neutral">{report.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
                      {report.category} · {formatFullDate(report.createdAt)}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-ink-muted)]">
                You have not submitted a report yet.
              </div>
            )}
          </Card>

          <Card className="grid gap-4">
            <h2 className="text-3xl">Your private rooms</h2>
            {rooms.length ? (
              <div className="grid gap-3">
                {rooms.map((room) => (
                  <Link
                    key={room.id}
                    href={`/rooms/${room.id}`}
                    className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                  >
                    <strong>{room.title}</strong>
                    <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{room.summary}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-ink-muted)]">
                No room memberships yet. Pulse will offer a room when your report safely matches a real pattern.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

