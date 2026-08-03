import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setSession } from "@/lib/auth";
import { validateEmail } from "@/lib/validation";

// Mock login: accepts either a userId or an email of a seeded demo user.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { userId, email } = (body ?? {}) as { userId?: string; email?: string };

  let user = null;
  if (userId) {
    user = await prisma.user.findUnique({ where: { id: userId } });
  } else if (email !== undefined) {
    const parsed = validateEmail(email);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    user = await prisma.user.findUnique({ where: { email: parsed.value! } });
  } else {
    return NextResponse.json({ error: "Provide a userId or email." }, { status: 400 });
  }

  if (!user) {
    return NextResponse.json({ error: "No such demo user." }, { status: 404 });
  }

  await setSession(user.id);
  return NextResponse.json({ user });
}
