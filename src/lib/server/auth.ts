"use server";

import { cookies } from "next/headers";

import { getSessionCookieName, parseSessionToken } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  const session = parseSessionToken(token);

  if (!session) {
    return null;
  }

  const repository = await getRepository();
  return repository.getUserById(session.userId);
}

export async function getCurrentModerator() {
  const user = await getCurrentUser();
  return user?.role === "moderator" ? user : null;
}

