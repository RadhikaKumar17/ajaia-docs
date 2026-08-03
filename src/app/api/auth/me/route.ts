import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Returns the current user (or null) plus the list of demo users available to
// sign in as — used by the login picker.
export async function GET() {
  const user = await getCurrentUser();
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
  return NextResponse.json({ user, users });
}
