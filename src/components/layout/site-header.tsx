import Link from "next/link";

import { APP_NAME } from "@/lib/constants";
import { getCurrentUser } from "@/lib/server/auth";
import { signOutAction } from "@/lib/actions/auth";
import { buttonStyles } from "@/components/ui/button";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-[rgba(247,245,239,0.82)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-3 text-[var(--color-ink)]">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(140deg,var(--color-accent),var(--color-accent-strong))] text-lg font-bold text-white">
            P
          </div>
          <div>
            <div className="text-base font-semibold">{APP_NAME}</div>
            <div className="text-xs text-[var(--color-ink-muted)]">Private local issue matching</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-[var(--color-ink-muted)] md:flex">
          <Link href="/report">Report an issue</Link>
          <Link href="/patterns">Local patterns</Link>
          <Link href="/profile">Profile</Link>
          {user?.role === "moderator" ? <Link href="/admin/moderation">Moderation</Link> : null}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-[var(--color-ink-muted)] sm:block">{user.displayName}</span>
              <form action={signOutAction}>
                <button className={buttonStyles("secondary")} type="submit">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/auth/sign-in" className={buttonStyles("ghost")}>
                Sign in
              </Link>
              <Link href="/report" className={buttonStyles("primary")}>
                Report an issue
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

