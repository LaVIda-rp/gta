const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient();
  console.log("Prisma Client created successfully.");
  await prisma.$disconnect();
}

test().catch(console.error);
