import { cookies } from "next/headers";
import { prisma } from "./db";

const SESSION_COOKIE = "ajaia_uid";

/**
 * Mock authentication: a signed-in user is represented by their user id stored
 * in an httpOnly cookie. This is deliberately lightweight (no passwords) so the
 * assignment can focus on documents, sharing and persistence. In production
 * this would be replaced by a real auth provider / session store.
 */
export async function getCurrentUser() {
  const store = await cookies();
  const uid = store.get(SESSION_COOKIE)?.value;
  if (!uid) return null;
  const user = await prisma.user.findUnique({ where: { id: uid } });
  return user;
}

export async function setSession(userId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
