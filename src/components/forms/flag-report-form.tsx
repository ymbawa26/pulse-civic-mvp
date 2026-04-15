import { flagReportRedirectAction } from "@/lib/actions/report";
import { Button } from "@/components/ui/button";
import { Field, inputClassName } from "@/components/ui/field";

export function FlagReportForm({
  reportId,
  returnTo,
  status,
}: {
  reportId: string;
  returnTo: string;
  status?: "sent" | "error";
}) {
  return (
    <form action={flagReportRedirectAction} className="grid gap-3">
      <input type="hidden" name="reportId" value={reportId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <Field label="Need moderation review?">
        <input
          className={inputClassName()}
          name="reason"
          placeholder="Example: sensitive detail needs review before aggregation."
        />
      </Field>
      {status === "sent" ? (
        <div className="rounded-2xl border border-[#b8e0ca] bg-[#effaf4] px-4 py-3 text-sm text-[#166647]">
          Thanks. The report was sent to moderation review.
        </div>
      ) : null}
      {status === "error" ? (
        <div className="rounded-2xl border border-[#f0c4c4] bg-[#fff3f3] px-4 py-3 text-sm text-[#922c2c]">
          Pulse could not send that flag. Please try again with a short reason.
        </div>
      ) : null}
      <Button type="submit" variant="secondary">
        Flag for moderator review
      </Button>
    </form>
  );
}
