# Submission — Ajaia Docs

**Candidate:** Radhika Kumar (radh7042@gmail.com)
**Project:** Ajaia Docs — a lightweight collaborative document editor (Google Docs-inspired)

---

## What's included

| File / folder | Description |
| --- | --- |
| `src/` | Full source — Next.js App Router frontend + Node API routes |
| `prisma/` | Database schema (`schema.prisma`), migration, and seed script |
| `README.md` | Setup, run instructions, feature list, deployment guide |
| `ARCHITECTURE.md` | Architecture note — priorities, decisions, tradeoffs, what's next |
| `AI_WORKFLOW.md` | AI tools used, where they helped, what I changed/rejected, how I verified |
| `SUBMISSION.md` | This file |
| `VIDEO.txt` | Walkthrough video URL |
| `samples/sample-import.md` | Sample file for testing the upload/import feature |
| `vercel.json` | Deployment config |

---

## Live product URL

> _Add your deployed URL here after deploying (see README → Deployment)._
> Local run instructions are in `README.md` and work with zero configuration.

## Demo credentials (for reviewing the sharing flow)

Mock auth, **no passwords** — pick a user on the login screen:

- `alice@ajaia.dev` (owns the seeded documents)
- `bob@ajaia.dev` (already has a document shared with him)
- `carol@ajaia.dev` (no shared access — useful for testing the access boundary)

To review sharing: sign in as Alice, share a doc with `bob@ajaia.dev`, then sign
in as Bob in a second/incognito window to see it under **Shared with me**.

---

## Feature status

### ✅ Working (end to end)

- Create, rename, edit, delete, save & reopen documents
- Rich text: **bold**, *italic*, underline, H1–H3, bullet & numbered lists, quotes, undo/redo
- Autosave with a live save-status indicator
- File upload: `.txt` / `.md` / `.docx` → new editable document
- Sharing: owner + grant edit/view access by email + owned-vs-shared distinction + view-only mode
- Persistence across refresh (SQLite via Prisma)
- Server-side access control (verified: non-collaborators get 403)
- Validation + error handling on all API routes; HTML sanitization
- 29 automated unit tests

### 🟡 Partial / intentionally deprioritized

- **Real-time multi-user collaboration** — single-user autosave only (no live cursors).
- **Real authentication** — mock cookie session with seeded users (isolated to `lib/auth.ts`).
- **HTML sanitizer** — allowlist regex, not a full DOM sanitizer (documented in code + README).

### ⏭️ What I'd build next with 2–4 more hours

1. Live presence / collaboration indicators (websockets)
2. Document version history (snapshot on save)
3. Export to PDF / Markdown
4. Harden auth (NextAuth) and swap sanitizer to DOMPurify

---

## Quick start

```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev          # http://localhost:3000
npm test             # 29 passing tests
```
