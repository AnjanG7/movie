import { PrismaClient, FinancingType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  try {
    // ================== 1. CREATE ROLES ==================
    console.log('📋 Creating roles...');
    const roleNames = ['Admin', 'Producer', 'User'];
    const createdRoles = {};

    for (const roleName of roleNames) {
      const role = await prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: { name: roleName },
      });
      createdRoles[roleName] = role;
      console.log(`   ✅ ${roleName}`);
    }

    // ================== 2. CREATE ADMIN USER ==================
    console.log('\n👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@filmfinance.com' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@filmfinance.com',
        password: hashedPassword,
        status: 'ACTIVE',
        roleId: createdRoles['Admin'].id,
      },
    });
    console.log('   ✅ Admin user created');
    console.log('   📧 Email: admin@filmfinance.com');
    console.log('   🔑 Password: Admin123!');

   


   



  } catch (error) {
    console.error('\n❌ SEEDING FAILED:');
    console.error(error);
    throw error;
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
