# AI Workflow Note

This is an AI-forward role, so I worked the way I would on the job: using an AI
coding agent to move fast on scaffolding and boilerplate, while keeping the
product decisions, architecture, and verification firmly mine.

## Which AI tools I used

- **Claude Code (Claude Opus)** — the primary tool. An agentic CLI/IDE assistant
  that can read/write files, run commands, run the test suite, and drive a browser
  to verify the running app. I used it for scaffolding, implementation, and
  in-loop verification.

## Where AI materially sped up my work

- **Project scaffolding.** Next.js + TypeScript + Tailwind v4 + Prisma + Vitest
  config and the full folder structure were generated in minutes instead of the
  usual fiddly setup.
- **CRUD + API boilerplate.** The repetitive shape of the eight API routes
  (auth-check → access-check → validate → persist) was generated consistently,
  which let me focus on the *access-control* and *validation* logic that actually
  matters.
- **Editor integration.** Wiring TipTap (StarterKit + Underline + Placeholder)
  into a React component with a toolbar and HTML in/out is exactly the kind of
  library glue AI does well.
- **Tests.** The 29 unit tests were drafted quickly, then I reviewed each case for
  whether it tested something meaningful (e.g. the owner-wins-over-share edge
  case, XSS stripping) rather than trivia.
- **Docs.** First drafts of this README/architecture note were AI-assisted, then
  edited for accuracy.

## What I changed or rejected

- **Persistence for deployment.** The initial instinct was "SQLite everywhere."
  I rejected shipping that to a serverless host (Vercel's filesystem is ephemeral)
  and made the schema explicitly swappable to Postgres for production, with the
  build seeding demo users idempotently. This is a judgment call AI won't make
  for you.
- **Autosave double-write.** The editor fired a spurious save on first mount
  (TipTap emits an update when it renders loaded content). I caught this while
  verifying in the browser and added a `hydrated` guard so opening a document
  doesn't write back to the DB needlessly.
- **A build-breaking name clash.** The generated `Editor` component imported
  TipTap's `Editor` type under the same name. The production build caught it; I
  aliased the type. (Lesson: always run the real `next build`, not just the dev
  server.)
- **Sanitization scope.** I kept the HTML sanitizer as a documented allowlist
  regex rather than pulling in a heavier dependency, and I was explicit in the
  code and README about that tradeoff instead of pretending it's a full sanitizer.
- **Kept the scope tight.** I declined AI-suggested extras (folders, search,
  real-time) to protect the core, per the prompt's guidance.

## How I verified correctness, UX, and reliability

- **Automated tests.** `npm test` → 29 passing unit tests over the access-control,
  validation, sanitizer, and import logic.
- **Real production build.** `npm run build` compiles all routes and type-checks —
  this is what caught the naming conflict.
- **In-browser end-to-end checks.** I drove the running app and confirmed: login
  as Alice, dashboard renders owned-vs-shared correctly, the editor loads and
  formats content, and **a typed edit persisted to the database across a reload**
  (verified by inspecting the stored row).
- **Access control on the wire.** I hit the API directly with separate user
  cookies: Bob sees the shared doc under "shared with me" with the `edit` role,
  and **Carol (no access) gets HTTP 403** on the same document — confirming the
  server enforces sharing, not just the UI.

## Bottom line

AI compressed the mechanical parts — scaffolding, boilerplate, first-draft tests
and docs — from hours to minutes. The parts that determine whether the product is
*correct and shippable* — the data model, the permission logic, the deployment
persistence decision, and the verification that edits actually persist and
strangers are actually blocked — I owned and checked myself.
