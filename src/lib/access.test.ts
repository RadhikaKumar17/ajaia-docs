import { describe, it, expect } from "vitest";
import { roleFor, canView, canEdit, canManage, type DocumentLike } from "./access";

const doc: DocumentLike = {
  ownerId: "owner-1",
  shares: [
    { userId: "editor-1", role: "edit" },
    { userId: "viewer-1", role: "view" },
  ],
};

describe("access control", () => {
  it("gives the owner full control", () => {
    expect(roleFor(doc, "owner-1")).toBe("owner");
    expect(canView(doc, "owner-1")).toBe(true);
    expect(canEdit(doc, "owner-1")).toBe(true);
    expect(canManage(doc, "owner-1")).toBe(true);
  });

  it("lets an edit-collaborator view and edit but not manage", () => {
    expect(roleFor(doc, "editor-1")).toBe("edit");
    expect(canView(doc, "editor-1")).toBe(true);
    expect(canEdit(doc, "editor-1")).toBe(true);
    expect(canManage(doc, "editor-1")).toBe(false);
  });

  it("lets a view-collaborator view only", () => {
    expect(roleFor(doc, "viewer-1")).toBe("view");
    expect(canView(doc, "viewer-1")).toBe(true);
    expect(canEdit(doc, "viewer-1")).toBe(false);
    expect(canManage(doc, "viewer-1")).toBe(false);
  });

  it("denies a stranger any access", () => {
    expect(roleFor(doc, "stranger")).toBeNull();
    expect(canView(doc, "stranger")).toBe(false);
    expect(canEdit(doc, "stranger")).toBe(false);
    expect(canManage(doc, "stranger")).toBe(false);
  });

  it("owner role wins even if also present in shares", () => {
    const weird: DocumentLike = {
      ownerId: "u1",
      shares: [{ userId: "u1", role: "view" }],
    };
    expect(roleFor(weird, "u1")).toBe("owner");
    expect(canEdit(weird, "u1")).toBe(true);
  });
});
