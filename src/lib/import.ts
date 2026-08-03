import { sanitizeHtml } from "./sanitize";

export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".docx"] as const;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

export interface ImportResult {
  title: string;
  html: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Derives a document title from an uploaded file name. */
export function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  return base.length > 0 ? base : "Imported document";
}

/** Minimal, dependency-free Markdown → HTML for the common cases we support. */
export function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };

  const inline = (text: string): string => {
    let t = escapeHtml(text);
    t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>");
    t = t.replace(/__(.+?)__/g, "<u>$1</u>");
    t = t.replace(/`(.+?)`/g, "<code>$1</code>");
    return t;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const ordered = /^\d+\.\s+(.*)$/.exec(line);

    if (heading) {
      closeList();
      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
    } else if (bullet) {
      if (listType !== "ul") {
        closeList();
        out.push("<ul>");
        listType = "ul";
      }
      out.push(`<li>${inline(bullet[1])}</li>`);
    } else if (ordered) {
      if (listType !== "ol") {
        closeList();
        out.push("<ol>");
        listType = "ol";
      }
      out.push(`<li>${inline(ordered[1])}</li>`);
    } else if (line.trim() === "") {
      closeList();
    } else {
      closeList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList();
  return out.join("");
}

/** Wraps plain text as paragraphs, preserving line breaks. */
export function textToHtml(text: string): string {
  const paras = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return paras
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/**
 * Converts an uploaded file buffer into sanitized editor HTML based on its
 * extension. `.docx` is parsed with mammoth (imported lazily so it never lands
 * in the client bundle).
 */
export async function fileToDocument(
  filename: string,
  buffer: Buffer
): Promise<ImportResult> {
  const lower = filename.toLowerCase();
  let html: string;

  if (lower.endsWith(".docx")) {
    const mammoth = (await import("mammoth")).default;
    const result = await mammoth.convertToHtml({ buffer });
    html = result.value;
  } else if (lower.endsWith(".md")) {
    html = markdownToHtml(buffer.toString("utf8"));
  } else if (lower.endsWith(".txt")) {
    html = textToHtml(buffer.toString("utf8"));
  } else {
    throw new Error("Unsupported file type. Please upload a .txt, .md, or .docx file.");
  }

  return { title: titleFromFilename(filename), html: sanitizeHtml(html) };
}
