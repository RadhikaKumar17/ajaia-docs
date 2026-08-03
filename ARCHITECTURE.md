# Architecture Note

**Ajaia Docs** — a collaborative document editor built in the 4–6 hour timebox.
This note explains what I prioritized, the key decisions, and the tradeoffs I
made under time pressure.

## What I prioritized (and why)

The prompt rewards **depth in a few areas over shallow coverage everywhere**, so
I invested in the three things that make or break a "docs" product:

1. **A genuinely usable editing experience.** Rich text is the heart of the
   product, so I used TipTap (ProseMirror) rather than a `contenteditable` toy.
   It gives real bold/italic/underline, headings, lists, quotes, and undo/redo
   with a clean toolbar, and it serializes to HTML I can store and re-render.
2. **Sharing with correct access control.** I modeled a first-class `Share`
   entity with roles (`edit`/`view`), enforced on the server, and made the
   owned-vs-shared distinction obvious in the UI. The access logic is pure and
   unit-tested because it's the part most likely to be wrong and most costly if
   it is.
3. **Persistence that just works.** SQLite + Prisma means documents and shares
   survive refresh with zero setup for a reviewer, and formatting is preserved
   because content is stored as HTML.

## Stack decisions

| Decision | Why | Tradeoff |
| --- | --- | --- |
| **Next.js App Router (one app for FE + BE)** | Frontend and Node backend in one deployable; API routes are the backend. Fast to build, easy to deploy. | Less separation than a standalone API service. |
| **TipTap editor** | Production-grade rich text out of the box; HTML in/out. | Adds ~95 kB to the editor route. Acceptable for a docs app. |
| **Prisma + SQLite** | Zero-config local persistence, typed queries, trivial to swap to Postgres for prod. | SQLite isn't durable on serverless hosts — prod uses Postgres (documented). |
| **Cookie-based mock auth, no passwords** | Sharing/ownership needs *identity*, not a full auth system. Seeded users keep the demo instant. | Not production auth — but isolated to `lib/auth.ts` + login page. |
| **HTML as the content format** | Directly renderable, directly editable by TipTap, human-readable in the DB. | Requires sanitization on the way in (implemented). |

## Data model

```
User (id, email, name)
  └── owns → Document[]
  └── has  → Share[]

Document (id, title, content: HTML, ownerId, createdAt, updatedAt)
  └── owner → User
  └── shares → Share[]

Share (documentId, userId, role: "edit" | "view")   // unique per (doc, user)
```

The owner is a column on `Document`; every *additional* collaborator is a `Share`
row. `roleFor(doc, userId)` resolves a user's effective permission, with the
owner always winning. This keeps "who can do what" in one tested function that
both the API and UI rely on.

## Request flow (autosave example)

```
User types → TipTap onUpdate → debounce 800ms
  → PATCH /api/documents/:id { content }
    → auth check → access check (canEdit) → validate size → sanitize HTML → Prisma update
  → UI shows "All changes saved"
```

Every mutating route follows the same guard order: **authenticate → authorize →
validate → sanitize → persist**.

## Testing strategy

I unit-tested the **pure logic** that carries the most risk and is cheapest to
test in isolation — no DB or HTTP needed:

- `access.ts` — owner/edit/view/stranger permission matrix
- `validation.ts` — title, content-size, email, role rules
- `sanitize.ts` — script/handler/`javascript:` stripping
- `import.ts` — Markdown/text → HTML conversion, filename → title

29 tests run in ~0.5s. This targets the bugs that would actually hurt (a broken
permission check leaking a document; an XSS payload persisting).

## What I intentionally deprioritized

- **Real-time multi-cursor collaboration.** Big lift (CRDT/OT + websockets).
  I shipped reliable single-user autosave instead, which covers the core "shared
  work" need for the timebox.
- **Real authentication.** Mock auth is enough to demonstrate ownership and
  sharing; production auth is a well-understood swap.
- **Full DOM-based HTML sanitizer.** The allowlist sanitizer covers the editor's
  own output and common injection vectors; a hardened deployment would use
  DOMPurify server-side.
- **Pagination / search / folders.** Out of scope for a focused slice.

## What I'd build next with another 2–4 hours

1. **Live presence + collaboration indicators** (who else is viewing) via a
   lightweight websocket channel — the highest-value stretch for a "collaborative"
   product.
2. **Document version history** (snapshot on save) — a natural extension of the
   existing content model.
3. **Export to PDF / Markdown** from the stored HTML.
4. **Harden auth** (NextAuth email magic links) and swap the sanitizer to
   DOMPurify.
