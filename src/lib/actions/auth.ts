"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { createSessionToken, getSessionCookieName, parseSessionToken } from "@/lib/auth/session";
import { getRepository, RepositoryError } from "@/lib/data/repository";
import { profileSchema, signInSchema, signUpSchema } from "@/lib/validation";
import { type FormState, initialFormState, isRedirectSignal } from "@/lib/actions/shared";
import { toBoolean } from "@/lib/utils";
import { revalidatePath } from "next/cache";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export async function signInAction(previousState: FormState = initialFormState, formData: FormData): Promise<FormState> {
  try {
    void previousState;
    const parsed = signInSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    const nextPath = typeof formData.get("next") === "string" ? String(formData.get("next")) : "/profile";
    const repository = await getRepository();
    const user = await repository.authenticateUser(parsed);

    if (!user) {
      return {
        status: "error",
        message: "We couldn't sign you in with those credentials.",
      };
    }

    const cookieStore = await cookies();
    cookieStore.set(getSessionCookieName(), createSessionToken(user.id), cookieOptions());
    revalidatePath("/");
    redirect(nextPath);
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    if (error instanceof ZodError) {
      return {
        status: "error",
        message: "Please check the highlighted fields.",
        fieldErrors: error.flatten().fieldErrors,
      };
    }

    return {
      status: "error",
      message: error instanceof Error ? error.message : "Sign-in failed.",
    };
  }
}

export async function signUpAction(previousState: FormState = initialFormState, formData: FormData): Promise<FormState> {
  try {
    void previousState;
    const parsed = signUpSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
      displayName: formData.get("displayName"),
    });
    const nextPath = typeof formData.get("next") === "string" ? String(formData.get("next")) : "/profile";
    const repository = await getRepository();
    const user = await repository.createUser(parsed);

    const cookieStore = await cookies();
    cookieStore.set(getSessionCookieName(), createSessionToken(user.id), cookieOptions());
    revalidatePath("/");
    redirect(nextPath);
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    if (error instanceof ZodError) {
      return {
        status: "error",
        message: "Please check the highlighted fields.",
        fieldErrors: error.flatten().fieldErrors,
      };
    }

    return {
      status: "error",
      message: error instanceof RepositoryError || error instanceof Error ? error.message : "Sign-up failed.",
    };
  }
}

export async function signOutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(getSessionCookieName());
  revalidatePath("/");
  redirect("/");
}

export async function updateProfileAction(
  previousState: FormState = initialFormState,
  formData: FormData,
): Promise<FormState> {
  try {
    void previousState;
    const repository = await getRepository();
    const cookieStore = await cookies();
    const userCookie = cookieStore.get(getSessionCookieName())?.value;
    if (!userCookie) {
      return {
        status: "error",
        message: "Please sign in again before updating your profile.",
      };
    }

    const parsedSession = parseSessionToken(userCookie);
    if (!parsedSession) {
      return {
        status: "error",
        message: "Your session expired. Please sign in again.",
      };
    }

    const parsed = profileSchema.parse({
      displayName: formData.get("displayName"),
      pseudonym: formData.get("pseudonym"),
      homeLabel: formData.get("homeLabel"),
      emailAlerts: toBoolean(formData.get("emailAlerts")),
      privacyDefault: formData.get("privacyDefault"),
    });

    await repository.updateProfile(parsedSession.userId, parsed);
    revalidatePath("/profile");
    return {
      status: "idle",
      message: "Profile updated.",
    };
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

    return {
      status: "error",
      message: error instanceof Error ? error.message : "Profile update failed.",
    };
  }
}
