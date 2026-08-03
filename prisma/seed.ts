import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seeds three demo users and a couple of starter documents (including one
 * shared across users) so reviewers can immediately exercise the sharing flow.
 */
async function main() {
  const users = [
    { email: "alice@ajaia.dev", name: "Alice" },
    { email: "bob@ajaia.dev", name: "Bob" },
    { email: "carol@ajaia.dev", name: "Carol" },
  ];

  const created = [];
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name },
      create: u,
    });
    created.push(user);
  }
  const [alice, bob] = created;

  // Alice's welcome doc.
  await prisma.document.upsert({
    where: { id: "seed-welcome" },
    update: {},
    create: {
      id: "seed-welcome",
      title: "Welcome to Ajaia Docs",
      ownerId: alice.id,
      content:
        "<h1>Welcome to Ajaia Docs</h1><p>This is a <strong>lightweight collaborative editor</strong>. Try:</p><ul><li><strong>Bold</strong>, <em>italic</em>, and <u>underline</u></li><li>Headings and lists</li><li>Sharing this doc with a teammate</li></ul><p>Everything you type is saved automatically.</p>",
    },
  });

  // A doc owned by Alice and shared with Bob so the "Shared with me" view is non-empty.
  const shared = await prisma.document.upsert({
    where: { id: "seed-shared" },
    update: {},
    create: {
      id: "seed-shared",
      title: "Q3 Planning (shared)",
      ownerId: alice.id,
      content:
        "<h2>Q3 Planning</h2><p>Alice shared this document with Bob.</p><ol><li>Define goals</li><li>Assign owners</li><li>Ship</li></ol>",
    },
  });

  await prisma.share.upsert({
    where: { documentId_userId: { documentId: shared.id, userId: bob.id } },
    update: { role: "edit" },
    create: { documentId: shared.id, userId: bob.id, role: "edit" },
  });

  console.log("Seeded users:", created.map((u) => `${u.name} <${u.email}>`).join(", "));
  console.log("Seeded documents: 'Welcome to Ajaia Docs' (Alice), 'Q3 Planning' (Alice → shared with Bob)");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
