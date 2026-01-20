import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@imobix.com';
  const passwordRaw = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(passwordRaw, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      nome: 'Admin Imobix',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log(`User created/updated: ${admin.email} (Role: ${admin.role})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
