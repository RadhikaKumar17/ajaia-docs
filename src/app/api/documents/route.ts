import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { validateTitle } from "@/lib/validation";

// GET /api/documents — returns the current user's owned and shared documents.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const owned = await prisma.document.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true, ownerId: true },
  });

  const sharedRows = await prisma.share.findMany({
    where: { userId: user.id },
    orderBy: { document: { updatedAt: "desc" } },
    select: {
      role: true,
      document: {
        select: {
          id: true,
          title: true,
          updatedAt: true,
          owner: { select: { name: true, email: true } },
        },
      },
    },
  });

  const shared = sharedRows.map((r) => ({
    id: r.document.id,
    title: r.document.title,
    updatedAt: r.document.updatedAt,
    role: r.role,
    ownerName: r.document.owner.name,
    ownerEmail: r.document.owner.email,
  }));

  return NextResponse.json({ owned, shared });
}

// POST /api/documents — creates a new empty document owned by the current user.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // Empty body is fine — we'll default the title.
  }

  const { title } = (body ?? {}) as { title?: string };
  const parsed = validateTitle(title ?? "Untitled document");
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const doc = await prisma.document.create({
    data: { title: parsed.value!, ownerId: user.id, content: "" },
    select: { id: true, title: true, updatedAt: true },
  });

  return NextResponse.json({ document: doc }, { status: 201 });
}
