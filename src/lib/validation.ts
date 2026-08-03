// Pure input-validation helpers shared by API routes. Unit-tested.

export const MAX_TITLE_LENGTH = 200;
export const MAX_CONTENT_BYTES = 1_000_000; // ~1MB of HTML per document

export interface ValidationResult<T> {
  ok: boolean;
  value?: T;
  error?: string;
}

/** Trims, defaults empty titles to "Untitled", and enforces a max length. */
export function validateTitle(input: unknown): ValidationResult<string> {
  if (typeof input !== "string") {
    return { ok: false, error: "Title must be a string." };
  }
  const trimmed = input.trim();
  const value = trimmed.length === 0 ? "Untitled" : trimmed;
  if (value.length > MAX_TITLE_LENGTH) {
    return { ok: false, error: `Title must be at most ${MAX_TITLE_LENGTH} characters.` };
  }
  return { ok: true, value };
}

export function validateContent(input: unknown): ValidationResult<string> {
  if (typeof input !== "string") {
    return { ok: false, error: "Content must be a string." };
  }
  if (Buffer.byteLength(input, "utf8") > MAX_CONTENT_BYTES) {
    return { ok: false, error: "Document content is too large." };
  }
  return { ok: true, value: input };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(input: unknown): ValidationResult<string> {
  if (typeof input !== "string") {
    return { ok: false, error: "Email must be a string." };
  }
  const value = input.trim().toLowerCase();
  if (!EMAIL_RE.test(value)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  return { ok: true, value };
}

export function validateRole(input: unknown): ValidationResult<"edit" | "view"> {
  if (input === "view") return { ok: true, value: "view" };
  // Default to edit for anything else (including undefined).
  return { ok: true, value: "edit" };
}
