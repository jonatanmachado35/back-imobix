import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...\n');

  // ─────────────────────────────────────────────
  // 1. SUPER ADMIN  (sem tenant — tenantId = null)
  // ─────────────────────────────────────────────
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@imobix.com';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';
  const superAdminHash = await bcrypt.hash(superAdminPassword, 10);

  const superAdmin = await (prisma.user as any).upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      email: superAdminEmail,
      nome: 'Super Admin Imobix',
      passwordHash: superAdminHash,
      role: Role.SUPER_ADMIN,
      tenantId: null,
      primeiroAcesso: false,
      tema: 'light',
    },
  });

  console.log(`✅ SUPER_ADMIN → ${superAdmin.email}`);

  // ─────────────────────────────────────────────
  // 2. TENANT DEMO
  // ─────────────────────────────────────────────
  const tenantNome = process.env.TENANT_NOME || 'Imobiliária Demo';

  const tenant = await (prisma.tenant as any).upsert({
    where: { id: 'tenant-demo' },
    update: {},
    create: {
      id: 'tenant-demo',
      nome: tenantNome,
      status: 'ATIVO',
      plano: 'PRO',
    },
  });

  console.log(`✅ Tenant     → ${tenant.nome} (id: ${tenant.id})`);

  // ─────────────────────────────────────────────
  // 3. BRANDING padrão do tenant demo
  // ─────────────────────────────────────────────
  await (prisma.tenantBranding as any).upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      nomePainel: tenantNome,
      subtitulo: 'Gestão de Temporada',
      corPrimaria: '#2563EB',
      corSidebar: '#1E3A5F',
    },
  });

  console.log(`✅ Branding   → padrão criado para "${tenantNome}"`);

  // ─────────────────────────────────────────────
  // 4. ADMIN do tenant demo
  // ─────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@imobix.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const adminHash = await bcrypt.hash(adminPassword, 10);

  const admin = await (prisma.user as any).upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      nome: 'Admin Demo',
      passwordHash: adminHash,
      role: Role.ADMIN,
      tenantId: tenant.id,
      primeiroAcesso: false,
      tema: 'light',
    },
  });

  console.log(`✅ ADMIN      → ${admin.email} (tenant: ${tenant.nome})`);

  console.log('\n🎉 Seed concluída com sucesso!\n');
  console.log('─────────────────────────────────────────');
  console.log('  Credenciais de acesso:');
  console.log(`  SUPER_ADMIN : ${superAdminEmail} / ${superAdminPassword}`);
  console.log(`  ADMIN       : ${adminEmail} / ${adminPassword}`);
  console.log('─────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
