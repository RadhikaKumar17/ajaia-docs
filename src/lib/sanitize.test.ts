import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "./sanitize";

describe("sanitizeHtml", () => {
  it("keeps allowed formatting tags", () => {
    const html = "<h1>Title</h1><p><strong>bold</strong> <em>italic</em> <u>under</u></p><ul><li>a</li></ul>";
    expect(sanitizeHtml(html)).toBe(html);
  });

  it("removes script tags and their contents", () => {
    const out = sanitizeHtml('<p>ok</p><script>alert("xss")</script>');
    expect(out).not.toContain("script");
    expect(out).toContain("<p>ok</p>");
  });

  it("strips inline event handlers", () => {
    const out = sanitizeHtml('<p onclick="steal()">hi</p>');
    expect(out).not.toContain("onclick");
    expect(out).toContain("hi");
  });

  it("neutralizes javascript: links", () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">click</a>');
    expect(out).not.toContain("javascript:");
  });

  it("drops disallowed tags but keeps their text", () => {
    const out = sanitizeHtml("<marquee>scrolling</marquee>");
    expect(out).not.toContain("marquee");
    expect(out).toContain("scrolling");
  });
});
