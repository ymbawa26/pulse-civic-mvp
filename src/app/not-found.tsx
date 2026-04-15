import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="page-shell py-16">
      <Card className="mx-auto grid max-w-2xl gap-4 text-center">
        <h1 className="text-4xl">That page is not available.</h1>
        <p className="text-sm leading-7 text-[var(--color-ink-muted)]">
          It may have been removed, or you may not have permission to view it.
        </p>
        <div className="flex justify-center">
          <Link href="/" className={buttonStyles("primary")}>
            Return home
          </Link>
        </div>
      </Card>
    </div>
  );
}

