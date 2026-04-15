"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { ALLOWED_FILE_TYPES } from "@/lib/constants";
import { type FormState, initialFormState, isRedirectSignal } from "@/lib/actions/shared";
import { parseSessionToken, getSessionCookieName } from "@/lib/auth/session";
import { getRepository, SafetyError } from "@/lib/data/repository";
import { reportSchema, roomPostSchema, flagSchema } from "@/lib/validation";
import { toBoolean, toNumber } from "@/lib/utils";
import { cookies } from "next/headers";

async function getSessionUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  const session = parseSessionToken(token);
  return session?.userId ?? null;
}

export async function submitIssueAction(
  previousState: FormState = initialFormState,
  formData: FormData,
): Promise<FormState> {
  try {
    void previousState;
    const evidence = formData.get("evidence");

    if (evidence instanceof File && evidence.size > 0 && !ALLOWED_FILE_TYPES.includes(evidence.type)) {
      return {
        status: "error",
        message: "Please upload a JPG, PNG, WEBP image, or PDF.",
      };
    }

    const parsed = reportSchema.parse({
      category: formData.get("category"),
      title: formData.get("title"),
      description: formData.get("description"),
      locationText: formData.get("locationText"),
      latitude: toNumber(formData.get("latitude")),
      longitude: toNumber(formData.get("longitude")),
      occurrenceDate: formData.get("occurrenceDate"),
      privacyMode: formData.get("privacyMode"),
      allowMatching: toBoolean(formData.get("allowMatching")),
      allowJoiningActionRoom: toBoolean(formData.get("allowJoiningActionRoom")),
      institutionTag: typeof formData.get("institutionTag") === "string" && formData.get("institutionTag")
        ? String(formData.get("institutionTag"))
        : null,
      severityLevel: formData.get("severityLevel"),
    });

    const repository = await getRepository();
    const userId = await getSessionUserId();
    const result = await repository.submitIssue({
      reporterUserId: userId,
      ...parsed,
      evidenceFileName: evidence instanceof File && evidence.size > 0 ? evidence.name : null,
      evidenceMimeType: evidence instanceof File && evidence.size > 0 ? evidence.type : null,
      evidenceBuffer:
        evidence instanceof File && evidence.size > 0 ? Buffer.from(await evidence.arrayBuffer()) : null,
    });

    revalidatePath("/patterns");
    redirect(`/report/${result.reportId}/results`);
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    if (error instanceof ZodError) {
      return {
        status: "error",
        message: "Please review the highlighted fields.",
        fieldErrors: error.flatten().fieldErrors,
      };
    }

    if (error instanceof SafetyError) {
      return {
        status: "error",
        message: `${error.message} ${error.flags.map((flag) => flag.message).join(" ")}`,
      };
    }

    return {
      status: "error",
      message: error instanceof Error ? error.message : "Issue submission failed.",
    };
  }
}

export async function joinRoomAction(formData: FormData) {
  const userId = await getSessionUserId();
  const roomId = String(formData.get("roomId"));
  const reportId = typeof formData.get("reportId") === "string" ? String(formData.get("reportId")) : null;
  const returnTo = typeof formData.get("returnTo") === "string" ? String(formData.get("returnTo")) : `/rooms/${roomId}`;

  if (!userId) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(returnTo)}`);
  }

  const repository = await getRepository();
  const status = await repository.joinRoom({ roomId, reportId, userId });
  redirect(status === "approved" ? `/rooms/${roomId}` : `${returnTo}?request=pending`);
}

export async function addRoomPostAction(
  previousState: FormState = initialFormState,
  formData: FormData,
): Promise<FormState> {
  try {
    void previousState;
    const userId = await getSessionUserId();
    if (!userId) {
      return {
        status: "error",
        message: "Please sign in before posting in a room.",
      };
    }

    const parsed = roomPostSchema.parse({
      content: formData.get("content"),
    });

    const roomId = String(formData.get("roomId"));
    const repository = await getRepository();
    await repository.addRoomPost({ roomId, userId, content: parsed.content });
    revalidatePath(`/rooms/${roomId}`);
    return initialFormState;
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    if (error instanceof ZodError) {
      return {
        status: "error",
        message: "Please keep the message concise and factual.",
        fieldErrors: error.flatten().fieldErrors,
      };
    }

    return {
      status: "error",
      message: error instanceof Error ? error.message : "Message posting failed.",
    };
  }
}

export async function castVoteAction(formData: FormData) {
  const userId = await getSessionUserId();
  const roomId = String(formData.get("roomId"));
  const optionId = String(formData.get("optionId"));

  if (!userId) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(`/rooms/${roomId}`)}`);
  }

  const repository = await getRepository();
  await repository.castVote({ roomId, userId, optionId });
  revalidatePath(`/rooms/${roomId}`);
  redirect(`/rooms/${roomId}`);
}

export async function flagReportAction(
  previousState: FormState = initialFormState,
  formData: FormData,
): Promise<FormState> {
  try {
    void previousState;
    const repository = await getRepository();
    const userId = await getSessionUserId();
    const parsed = flagSchema.parse({
      reason: formData.get("reason"),
    });
    const reportId = String(formData.get("reportId"));

    await repository.flagReport({
      reportId,
      flaggedByUserId: userId,
      reason: parsed.reason,
    });

    return {
      status: "idle",
      message: "Thanks. The report was sent to moderation review.",
    };
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    if (error instanceof ZodError) {
      return {
        status: "error",
        message: "Please provide a short reason for the flag.",
        fieldErrors: error.flatten().fieldErrors,
      };
    }

    return {
      status: "error",
      message: error instanceof Error ? error.message : "Flagging failed.",
    };
  }
}

export async function flagReportRedirectAction(formData: FormData) {
  const returnTo =
    typeof formData.get("returnTo") === "string" ? String(formData.get("returnTo")) : "/patterns";

  try {
    const repository = await getRepository();
    const userId = await getSessionUserId();
    const parsed = flagSchema.parse({
      reason: formData.get("reason"),
    });
    const reportId = String(formData.get("reportId"));

    await repository.flagReport({
      reportId,
      flaggedByUserId: userId,
      reason: parsed.reason,
    });

    redirect(`${returnTo}?flag=sent`);
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    redirect(`${returnTo}?flag=error`);
  }
}
