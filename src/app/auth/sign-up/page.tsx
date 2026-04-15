import { Card } from "@/components/ui/card";
import { AuthForm } from "@/components/forms/auth-form";

export default async function SignUpPage({
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
            Create account
          </p>
          <h1 className="text-4xl">Join Pulse privately</h1>
          <p className="text-sm leading-7 text-[var(--color-ink-muted)]">
            Create a simple account so Pulse can protect private rooms, remember your privacy settings, and keep your reports connected safely.
          </p>
        </Card>
        <Card>
          <AuthForm mode="sign-up" next={next ?? "/profile"} />
        </Card>
      </div>
    </div>
  );
}

