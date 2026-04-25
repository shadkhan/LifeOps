import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  await prisma.user.upsert({
    where: {
      email: "admin@lifeops.local",
    },
    update: {
      username: "admin",
      name: "Admin",
      passwordHash,
    },
    create: {
      email: "admin@lifeops.local",
      username: "admin",
      name: "Admin",
      passwordHash,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
