# Ajaia Docs

A lightweight, collaborative document editor inspired by Google Docs — built for
the Ajaia AI-Native Full Stack Developer assignment.

Create rich-text documents, import files, and share them with teammates. Owned
and shared documents are clearly separated, and everything persists across
refreshes.

> **Live demo:** _add your deployed URL here after deploying (see [Deployment](#deployment))_
>
> **Demo users (no passwords):** `alice@ajaia.dev`, `bob@ajaia.dev`, `carol@ajaia.dev`

---

## Features

| Area | What's implemented |
| --- | --- |
| **Documents** | Create, rename, edit, delete, save & reopen. Autosaves ~0.8s after you stop typing, with a live "Saving… / All changes saved" indicator. |
| **Rich text** | Bold, italic, underline, H1–H3 + normal text, bullet & numbered lists, block quotes, undo/redo. Built on [TipTap](https://tiptap.dev). Content is stored as sanitized HTML. |
| **File upload** | Upload a **`.txt`**, **`.md`**, or **`.docx`** file → it becomes a new editable document. `.docx` is parsed with [mammoth](https://github.com/mwilliamson/mammoth.js); Markdown and text are converted to formatted HTML. |
| **Sharing** | Every document has an **owner**. The owner can grant another user **edit** or **view** access by email. The dashboard clearly separates **Owned by me** vs **Shared with me**, with a role badge. View-only users get a read-only editor. |
| **Persistence** | SQLite via [Prisma](https://www.prisma.io). Documents and shares survive refresh; formatting is preserved as HTML. |
| **Quality** | Input validation + error handling on every API route, HTML sanitization against stored XSS, and 29 automated unit tests. |

### Supported upload types

Only **`.txt`**, **`.md`**, and **`.docx`** are accepted (stated in the UI and
enforced server-side). Other types are rejected with a clear error. Max upload
size is 5 MB. A ready-to-use sample lives at [`samples/sample-import.md`](samples/sample-import.md).

---

## Tech stack

- **Next.js 15** (App Router, TypeScript) — frontend **and** backend (Node.js API routes)
- **TipTap** — rich-text editing (ProseMirror-based)
- **Prisma + SQLite** — persistence (swap to Postgres for production)
- **Tailwind CSS v4** — styling
- **Vitest** — automated tests
- **mammoth** — `.docx` → HTML import

---

## Local setup

**Prerequisites:** Node.js 18.18+ (tested on Node 20).

```bash
# 1. Install dependencies
npm install

# 2. Set up the database (creates SQLite file, applies schema, seeds demo users)
npx prisma migrate dev --name init   # first run only; creates prisma/dev.db
npm run db:seed                       # seeds Alice, Bob, Carol + demo docs

# 3. Run the dev server
npm run dev
```

Open **http://localhost:3000** and sign in as any demo user.

> The `.env` file ships with `DATABASE_URL="file:./dev.db"` so local setup needs
> zero configuration. If you prefer a one-liner, `npm run db:reset` recreates and
> reseeds the database at any time.

### Run the tests

```bash
npm test
```

29 unit tests cover access-control logic, input validation, HTML sanitization,
and file-import conversion.

---

## How to demo sharing

1. Sign in as **Alice** in your main browser window.
2. Open a document → click **Share** → enter `bob@ajaia.dev` → choose **Can edit** → **Share**.
3. Open a **second browser window** (or an incognito window) and sign in as **Bob**.
4. Bob sees the document under **Shared with me** and can edit it.
5. Sign in as **Carol** — she does **not** see the document, and a direct link returns *"You don't have access."*

The seed data already shares **"Q3 Planning"** (owned by Alice) with Bob, so the
shared-document view is populated out of the box.

---

## Deployment

The app runs on any Node host. It's configured for **Vercel**, which needs a
**persistent Postgres** database (Vercel's filesystem is ephemeral, so SQLite is
local-only).

1. Create a free Postgres database (e.g. [Neon](https://neon.tech) or Vercel Postgres) and copy its connection string.
2. In [`prisma/schema.prisma`](prisma/schema.prisma), change the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"   // was "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
3. Push the repo to GitHub and import it into Vercel.
4. In Vercel → Project → Settings → Environment Variables, set `DATABASE_URL` to your Postgres URL.
5. Deploy. The build (`npm run build`) runs `prisma db push` and seeds the demo
   users automatically, so the live URL is ready to test immediately.

Local development is unchanged — keep the provider on `sqlite` for local, or use
a Postgres URL there too.

---

## Project structure

```
src/
  app/
    api/
      auth/{login,logout,me}/   # mock session endpoints
      documents/                # list + create
      documents/[id]/           # get / rename / update / delete
      documents/[id]/share/     # list / grant / revoke access
      upload/                   # file → new document
    login/                      # demo-user picker
    documents/                  # dashboard (owned vs shared)
    documents/[id]/             # editor page
  components/                   # Dashboard, Editor (TipTap), ShareDialog, ...
  lib/
    access.ts        # pure access-control logic (unit-tested)
    validation.ts    # pure input validation (unit-tested)
    sanitize.ts      # HTML sanitizer (unit-tested)
    import.ts        # file → HTML conversion (unit-tested)
    auth.ts          # cookie session helpers
    db.ts            # Prisma client singleton
prisma/
  schema.prisma      # User, Document, Share models
  seed.ts            # demo users + documents
```

---

## Notes, scope cuts & error handling

- **Mock auth** (cookie holds a user id, no passwords) is a deliberate scope cut
  so effort went into the editor, sharing, and persistence. Swapping in real auth
  (NextAuth/Clerk) would touch only `src/lib/auth.ts` and the login page.
- **Validation & errors:** every API route checks authentication, ownership/access,
  JSON validity, title length, content size, email format, and file type/size,
  returning appropriate 4xx codes. The UI surfaces errors inline.
- **Security:** stored HTML is sanitized (scripts, event handlers, and
  `javascript:` URLs are stripped) before it is persisted or rendered. The
  sanitizer is intentionally an allowlist regex rather than a full DOM sanitizer —
  see `src/lib/sanitize.ts`.
- **Not real-time:** editing is single-user autosave, not live multi-cursor
  collaboration. See `ARCHITECTURE.md` for what a next iteration would add.
