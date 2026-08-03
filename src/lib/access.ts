// Pure access-control logic, kept free of any DB/Prisma imports so it can be
// unit-tested in isolation.

export type Role = "owner" | "edit" | "view";

export interface ShareLike {
  userId: string;
  role: string; // "edit" | "view"
}

export interface DocumentLike {
  ownerId: string;
  shares: ShareLike[];
}

/**
 * Returns the role a user has on a document, or null if they have no access.
 * The owner always wins over any share row.
 */
export function roleFor(doc: DocumentLike, userId: string): Role | null {
  if (doc.ownerId === userId) return "owner";
  const share = doc.shares.find((s) => s.userId === userId);
  if (!share) return null;
  return share.role === "view" ? "view" : "edit";
}

export function canView(doc: DocumentLike, userId: string): boolean {
  return roleFor(doc, userId) !== null;
}

export function canEdit(doc: DocumentLike, userId: string): boolean {
  const role = roleFor(doc, userId);
  return role === "owner" || role === "edit";
}

/** Only the owner may share, rename-as-owner-action, or delete a document. */
export function canManage(doc: DocumentLike, userId: string): boolean {
  return doc.ownerId === userId;
}
