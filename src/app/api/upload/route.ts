import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { fileToDocument, MAX_UPLOAD_BYTES, SUPPORTED_EXTENSIONS } from "@/lib/import";

// POST /api/upload — accepts a multipart file (.txt/.md/.docx) and creates a new
// editable document from its contents, owned by the current user.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected a multipart form upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const lower = file.name.toLowerCase();
  if (!SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
    return NextResponse.json(
      { error: `Unsupported file type. Supported: ${SUPPORTED_EXTENSIONS.join(", ")}` },
      { status: 415 }
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `File too large. Max ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.` },
      { status: 413 }
    );
  }

  let imported;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    imported = await fileToDocument(file.name, buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to read file.";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  const doc = await prisma.document.create({
    data: { title: imported.title, content: imported.html, ownerId: user.id },
    select: { id: true, title: true },
  });

  return NextResponse.json({ document: doc }, { status: 201 });
}
