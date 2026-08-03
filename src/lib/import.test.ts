import { describe, it, expect } from "vitest";
import { markdownToHtml, textToHtml, titleFromFilename } from "./import";

describe("titleFromFilename", () => {
  it("strips extension and tidies separators", () => {
    expect(titleFromFilename("Q3_planning-notes.md")).toBe("Q3 planning notes");
  });
  it("falls back for empty names", () => {
    expect(titleFromFilename(".txt")).toBe("Imported document");
  });
});

describe("markdownToHtml", () => {
  it("converts headings", () => {
    expect(markdownToHtml("# Hello")).toBe("<h1>Hello</h1>");
    expect(markdownToHtml("### Sub")).toBe("<h3>Sub</h3>");
  });
  it("converts bullet lists", () => {
    expect(markdownToHtml("- one\n- two")).toBe("<ul><li>one</li><li>two</li></ul>");
  });
  it("converts numbered lists", () => {
    expect(markdownToHtml("1. one\n2. two")).toBe("<ol><li>one</li><li>two</li></ol>");
  });
  it("converts bold and italic inline", () => {
    expect(markdownToHtml("**bold** and *italic*")).toContain("<strong>bold</strong>");
    expect(markdownToHtml("**bold** and *italic*")).toContain("<em>italic</em>");
  });
  it("escapes raw HTML in the source", () => {
    expect(markdownToHtml("<script>x</script>")).not.toContain("<script>");
  });
});

describe("textToHtml", () => {
  it("wraps paragraphs and preserves single line breaks", () => {
    expect(textToHtml("line1\nline2")).toBe("<p>line1<br>line2</p>");
  });
  it("splits on blank lines into separate paragraphs", () => {
    expect(textToHtml("a\n\nb")).toBe("<p>a</p><p>b</p>");
  });
});
