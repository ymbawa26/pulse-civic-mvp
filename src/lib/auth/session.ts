import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHmac } from "node:crypto";

const SESSION_COOKIE = "pulse_session";

function sessionSecret() {
  return process.env.APP_SESSION_SECRET ?? "development-secret";
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, hash: string) {
  const [salt, storedKey] = hash.split(":");

  if (!salt || !storedKey) {
    return false;
  }

  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(storedKey, "hex");

  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

export function createSessionToken(userId: string) {
  const nonce = randomUUID();
  const payload = `${userId}.${nonce}`;
  const signature = createHmac("sha256", sessionSecret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function parseSessionToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  const [userId, nonce, signature] = token.split(".");

  if (!userId || !nonce || !signature) {
    return null;
  }

  const payload = `${userId}.${nonce}`;
  const expectedSignature = createHmac("sha256", sessionSecret()).update(payload).digest("hex");

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  return { userId };
}

