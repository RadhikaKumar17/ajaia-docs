import { describe, it, expect } from "vitest";
import {
  validateTitle,
  validateContent,
  validateEmail,
  validateRole,
  MAX_TITLE_LENGTH,
} from "./validation";

describe("validateTitle", () => {
  it("trims whitespace", () => {
    expect(validateTitle("  Hello  ")).toEqual({ ok: true, value: "Hello" });
  });
  it("defaults empty titles to 'Untitled'", () => {
    expect(validateTitle("   ")).toEqual({ ok: true, value: "Untitled" });
  });
  it("rejects overly long titles", () => {
    const res = validateTitle("a".repeat(MAX_TITLE_LENGTH + 1));
    expect(res.ok).toBe(false);
  });
  it("rejects non-strings", () => {
    expect(validateTitle(42).ok).toBe(false);
  });
});

describe("validateContent", () => {
  it("accepts normal HTML", () => {
    expect(validateContent("<p>hi</p>").ok).toBe(true);
  });
  it("rejects non-strings", () => {
    expect(validateContent(null).ok).toBe(false);
  });
});

describe("validateEmail", () => {
  it("lowercases and trims valid emails", () => {
    expect(validateEmail("  Bob@Ajaia.DEV ")).toEqual({ ok: true, value: "bob@ajaia.dev" });
  });
  it("rejects malformed emails", () => {
    expect(validateEmail("not-an-email").ok).toBe(false);
  });
});

describe("validateRole", () => {
  it("accepts view", () => {
    expect(validateRole("view")).toEqual({ ok: true, value: "view" });
  });
  it("defaults everything else to edit", () => {
    expect(validateRole(undefined)).toEqual({ ok: true, value: "edit" });
    expect(validateRole("admin")).toEqual({ ok: true, value: "edit" });
  });
});
