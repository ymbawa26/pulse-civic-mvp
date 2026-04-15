import { Card } from "@/components/ui/card";
import { AuthForm } from "@/components/forms/auth-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="page-shell py-8 md:py-16">
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[0.9fr_1.1fr]">
        <Card className="grid gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-accent-strong)]">
            Sign in
          </p>
          <h1 className="text-4xl">Return to your private civic workspace</h1>
          <p className="text-sm leading-7 text-[var(--color-ink-muted)]">
            Demo accounts for local testing:
          </p>
          <div className="grid gap-3 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-ink-muted)]">
            <p>`sam@pulse.local` / `PulseDemo123!`</p>
            <p>`moderator@pulse.local` / `PulseAdmin123!`</p>
          </div>
        </Card>
        <Card>
          <AuthForm mode="sign-in" next={next ?? "/profile"} />
        </Card>
      </div>
    </div>
  );
}

