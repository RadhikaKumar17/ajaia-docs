// Conservative HTML sanitizer for rich-text content.
//
// Editor output (TipTap) is already constrained, but content can also arrive
// from file imports and the API, so we defensively strip anything that could
// execute script before storing/rendering it. This is intentionally simple and
// allowlist-oriented rather than a full DOM-based sanitizer (see README notes).

// Tags we allow through from the editor / imports.
const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "strike",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote", "pre", "code", "hr", "a", "span",
]);

export function sanitizeHtml(input: string): string {
  let html = input;

  // Remove entire dangerous elements (with their content).
  html = html.replace(/<\s*(script|style|iframe|object|embed|form|link|meta)[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  // Remove self-closing / unclosed variants of those tags.
  html = html.replace(/<\s*(script|style|iframe|object|embed|form|link|meta)\b[^>]*>/gi, "");

  // Strip inline event handlers: on*="..." / on*='...' / on*=value
  html = html.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "");
  html = html.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "");
  html = html.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "");

  // Neutralize javascript: and data: URLs in href/src attributes.
  html = html.replace(/(href|src)\s*=\s*"(\s*(javascript|data):[^"]*)"/gi, '$1="#"');
  html = html.replace(/(href|src)\s*=\s*'(\s*(javascript|data):[^']*)'/gi, "$1='#'");

  // Drop any tag not on the allowlist (keeps its inner text).
  html = html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag: string) => {
    return ALLOWED_TAGS.has(tag.toLowerCase()) ? match : "";
  });

  return html;
}
