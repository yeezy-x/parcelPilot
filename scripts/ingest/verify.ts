import "dotenv/config";

import { prisma } from "@/lib/db/prisma";

async function main() {
  const [
    accounts,
    orders,
    tickets,
    escalations,
    documents,
    chunks,
  ] = await Promise.all([
    prisma.account.count(),
    prisma.order.count(),
    prisma.ticket.count(),
    prisma.escalation.count(),
    prisma.document.count(),
    prisma.documentChunk.count(),
  ]);

  console.log({
    accounts,
    orders,
    tickets,
    escalations,
    documents,
    chunks,
  });

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(
    "Database verification failed:",
  );

  console.error(error);

  await prisma.$disconnect();

  process.exit(1);
});