import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canManage, canView } from "@/lib/access";
import { validateEmail, validateRole } from "@/lib/validation";

async function loadDoc(id: string) {
  return prisma.document.findUnique({
    where: { id },
    include: { shares: { select: { userId: true, role: true } } },
  });
}

// GET /api/documents/:id/share — list collaborators (viewable by anyone with access).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const doc = await loadDoc(id);
  if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  if (!canView(doc, user.id)) {
    return NextResponse.json({ error: "You don't have access to this document." }, { status: 403 });
  }

  const shares = await prisma.share.findMany({
    where: { documentId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    collaborators: shares.map((s) => ({
      userId: s.user.id,
      name: s.user.name,
      email: s.user.email,
      role: s.role,
    })),
  });
}

// POST /api/documents/:id/share — grant a user access by email. Owner only.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const doc = await loadDoc(id);
  if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  if (!canManage(doc, user.id)) {
    return NextResponse.json({ error: "Only the owner can share this document." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { email, role } = (body ?? {}) as { email?: string; role?: string };

  const parsedEmail = validateEmail(email);
  if (!parsedEmail.ok) return NextResponse.json({ error: parsedEmail.error }, { status: 400 });
  const parsedRole = validateRole(role);

  const target = await prisma.user.findUnique({ where: { email: parsedEmail.value! } });
  if (!target) {
    return NextResponse.json(
      { error: "No user with that email. (Demo users: alice@, bob@, carol@ajaia.dev)" },
      { status: 404 }
    );
  }
  if (target.id === doc.ownerId) {
    return NextResponse.json({ error: "You already own this document." }, { status: 400 });
  }

  const share = await prisma.share.upsert({
    where: { documentId_userId: { documentId: id, userId: target.id } },
    update: { role: parsedRole.value },
    create: { documentId: id, userId: target.id, role: parsedRole.value! },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(
    {
      collaborator: {
        userId: share.user.id,
        name: share.user.name,
        email: share.user.email,
        role: share.role,
      },
    },
    { status: 201 }
  );
}

// DELETE /api/documents/:id/share?userId=... — revoke a user's access. Owner only.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const doc = await loadDoc(id);
  if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  if (!canManage(doc, user.id)) {
    return NextResponse.json({ error: "Only the owner can manage sharing." }, { status: 403 });
  }

  const targetUserId = req.nextUrl.searchParams.get("userId");
  if (!targetUserId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }

  await prisma.share.deleteMany({ where: { documentId: id, userId: targetUserId } });
  return NextResponse.json({ ok: true });
}
