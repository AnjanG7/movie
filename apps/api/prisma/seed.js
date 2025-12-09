import { PrismaClient, FinancingType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  try {
    // ================== 1. CREATE ROLES ==================
    console.log('📋 Creating roles...');
    const roleNames = ['Admin', 'Producer', 'Line Producer', 'Accountant', 'Investor'];
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

    // ================== 3. CREATE SAMPLE PROJECT ==================
    console.log('\n🎬 Creating sample project...');
    const sampleProject = await prisma.project.create({
      data: {
        title: 'Himalayan Dreams',
        baseCurrency: 'USD',
        timezone: 'Asia/Kathmandu',
        status: 'planning',
        ownerId: adminUser.id,
      },
    });
    console.log(`   ✅ Project created: ${sampleProject.title}`);

    // ================== 4. CREATE PHASES ==================
    console.log('\n📅 Creating project phases...');
    const phases = [
      { name: 'DEVELOPMENT', orderNo: 1 },
      { name: 'PRODUCTION', orderNo: 2 },
      { name: 'POST', orderNo: 3 },
      { name: 'PUBLICITY', orderNo: 4 },
    ];

    for (const phase of phases) {
      await prisma.phaseEntity.create({
        data: {
          ...phase,
          projectId: sampleProject.id,
        },
      });
      console.log(`   ✅ ${phase.name}`);
    }

    // ================== 5. CREATE SAMPLE BUDGET ==================
    console.log('\n💰 Creating sample budget...');
    const budgetVersion = await prisma.budgetVersion.create({
      data: {
        projectId: sampleProject.id,
        version: 'v1.0',
        type: 'QUOTE',
        createdBy: adminUser.id,
        grandTotal: 50000,
        lines: {
          create: [
            {
              phase: 'DEVELOPMENT',
              department: 'Script',
              name: 'Script Writer Fee',
              qty: 1,
              rate: 5000,
              taxPercent: 10,
            },
            {
              phase: 'PRODUCTION',
              department: 'Camera',
              name: 'Camera Equipment Rental',
              qty: 30,
              rate: 150,
              taxPercent: 13,
            },
            {
              phase: 'POST',
              department: 'Editing',
              name: 'Editor Fee',
              qty: 1,
              rate: 3000,
              taxPercent: 0,
            },
            {
              phase: 'PUBLICITY',
              department: 'Marketing',
              name: 'Trailer Production',
              qty: 1,
              rate: 8000,
              taxPercent: 13,
            },
          ],
        },
      },
    });
    console.log(`   ✅ Budget version created: ${budgetVersion.version}`);

    // ================== 6. CREATE VENDORS ==================
    console.log('\n🏢 Creating sample vendors...');
    const vendors = [
      { name: 'Camera House Ltd', currency: 'USD', contactInfo: { phone: '555-0001', email: 'contact@camerahouse.com' } },
      { name: 'Sound Studios Inc', currency: 'USD', contactInfo: { phone: '555-0002', email: 'info@soundstudios.com' } },
      { name: 'Marketing Pro', currency: 'USD', contactInfo: { phone: '555-0003', email: 'hello@marketingpro.com' } },
    ];

    for (const vendor of vendors) {
      await prisma.vendor.create({
        data: vendor,
      });
      console.log(`   ✅ ${vendor.name}`);
    }

    // ================== 7. CREATE FINANCING SOURCES ==================
    console.log('\n💵 Creating financing sources...');
    await prisma.financingSource.create({
      data: {
        projectId: sampleProject.id,
        type: FinancingType.EQUITY,
        amount: 30000,
        rate: 0,
      },
    });
    console.log('   ✅ Equity financing: $30,000');

    await prisma.financingSource.create({
      data: {
        projectId: sampleProject.id,
        type: FinancingType.LOAN,
        amount: 20000,
        rate: 5,
      },
    });
    console.log('   ✅ Loan financing: $20,000 @ 5%');

    // ================== SUCCESS ==================
    console.log('\n' + '='.repeat(50));
    console.log('✅ SEEDING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n🎥 Sample Project: Himalayan Dreams');
    console.log('='.repeat(50) + '\n');

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
