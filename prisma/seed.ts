import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = 'admin';
  const password = 'admin';

  const hashedPassword = await hash(password, 10);

  const existing = await prisma.user.findUnique({
    where: { username },
  });

  if (!existing) {
    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        fullName: 'Administrator',
        role: 'admin',
      },
    });

    console.log(`✅ Admin user created: ${username}/${password}`);
  } else {
    console.log('ℹ️ Admin user already exists');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
