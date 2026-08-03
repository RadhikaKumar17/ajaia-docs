import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canView, canEdit, canManage, roleFor } from "@/lib/access";
import { sanitizeHtml } from "@/lib/sanitize";
import { validateTitle, validateContent } from "@/lib/validation";

async function loadDoc(id: string) {
  return prisma.document.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: { select: { userId: true, role: true } },
    },
  });
}

// GET /api/documents/:id — returns a document if the user can view it.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const doc = await loadDoc(id);
  if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  if (!canView(doc, user.id)) {
    return NextResponse.json({ error: "You don't have access to this document." }, { status: 403 });
  }

  return NextResponse.json({
    document: {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      updatedAt: doc.updatedAt,
      owner: doc.owner,
      role: roleFor(doc, user.id),
      canEdit: canEdit(doc, user.id),
      canManage: canManage(doc, user.id),
    },
  });
}

// PATCH /api/documents/:id — rename and/or update content. Requires edit access.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const doc = await loadDoc(id);
  if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  if (!canEdit(doc, user.id)) {
    return NextResponse.json({ error: "You can't edit this document." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { title, content } = (body ?? {}) as { title?: string; content?: string };

  const data: { title?: string; content?: string } = {};
  if (title !== undefined) {
    const parsed = validateTitle(title);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    data.title = parsed.value;
  }
  if (content !== undefined) {
    const parsed = validateContent(content);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    data.content = sanitizeHtml(parsed.value!);
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const updated = await prisma.document.update({
    where: { id },
    data,
    select: { id: true, title: true, updatedAt: true },
  });
  return NextResponse.json({ document: updated });
}

// DELETE /api/documents/:id — owner only.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const doc = await loadDoc(id);
  if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  if (!canManage(doc, user.id)) {
    return NextResponse.json({ error: "Only the owner can delete this document." }, { status: 403 });
  }

  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
