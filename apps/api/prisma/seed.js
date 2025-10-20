// prisma/seed.js
/*import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ----------------- Users and Roles -----------------
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { name: 'Admin' },
  });

  const producerRole = await prisma.role.upsert({
    where: { name: 'Producer' },
    update: {},
    create: { name: 'Producer' },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@filmapp.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@filmapp.com',
      password: 'hashed_password',
      roles: {
        create: { roleId: adminRole.id },
      },
    },
  });

  // ----------------- Project 1: Himalayan Dreams -----------------
  const project1 = await prisma.project.create({
    data: {
      title: "Himalayan Dreams",
      baseCurrency: "USD",
      ownerId: adminUser.id,
      phases: {
        create: [
          { name: "DEVELOPMENT", orderNo: 1 },
          { name: "PRODUCTION", orderNo: 2 },
          { name: "POST", orderNo: 3 },
          { name: "PUBLICITY", orderNo: 4 },
        ],
      },
      budgetVersions: {
        create: {
          version: "v1",
          type: "QUOTE",
          createdBy: adminUser.id,
          lines: {
            create: [
              {
                phase: "DEVELOPMENT",
                department: "Script",
                name: "Script Writer Fee",
                qty: 1,
                rate: 5000,
                taxPercent: 10,
              },
              {
                phase: "PRODUCTION",
                department: "Camera",
                name: "Camera Equipment Rental",
                qty: 30,
                rate: 150,
                taxPercent: 13,
              },
              {
                phase: "POST",
                department: "Editing",
                name: "Editor Fee",
                qty: 1,
                rate: 3000,
              },
            ],
          },
        },
      },
      financingSources: {
        create: [
          { type: "Equity", amount: 50000 },
          { type: "Loan", amount: 20000, rate: 5 },
        ],
      },
      cashflowForecasts: {
        create: [
          { weekStart: new Date("2025-01-01"), inflows: 10000, outflows: 5000, cumulative: 5000 },
          { weekStart: new Date("2025-01-08"), inflows: 15000, outflows: 8000, cumulative: 12000 },
        ],
      },
      waterfallDefinitions: {
        create: {
          tiers: {
            create: [
              { tierOrder: 1, pctSplit: 50, description: "Investor Return" },
              { tierOrder: 2, pctSplit: 50, description: "Producer Profit" },
            ],
          },
          participants: {
            create: [
              { name: "Investor A", role: "Investor", pctShare: 50 },
              { name: "Producer Team", role: "Producer", pctShare: 50 },
            ],
          },
        },
      },
      distributionDeals: {
        create: {
          territory: "Nepal",
          window: "Theatrical",
          feePercent: 15,
          expensesCap: 1000,
          minimumGuarantee: 2000,
          revenueStatements: {
            create: [
              {
                periodStart: new Date("2025-03-01"),
                periodEnd: new Date("2025-03-31"),
                gross: 15000,
                fee: 2250,
                expenses: 800,
                net: 11950,
              },
            ],
          },
        },
      },
    },
  });

  // ----------------- Project 2: Urban Mirage -----------------
  const project2 = await prisma.project.create({
    data: {
      title: "Urban Mirage",
      baseCurrency: "NPR",
      ownerId: adminUser.id,
      phases: {
        create: [
          { name: "DEVELOPMENT", orderNo: 1 },
          { name: "PRODUCTION", orderNo: 2 },
          { name: "POST", orderNo: 3 },
          { name: "PUBLICITY", orderNo: 4 },
        ],
      },
      budgetVersions: {
        create: {
          version: "v1",
          type: "BASELINE",
          createdBy: adminUser.id,
          lines: {
            create: [
              {
                phase: "DEVELOPMENT",
                department: "Research",
                name: "Location Scouting",
                qty: 5,
                rate: 5000,
              },
              {
                phase: "PRODUCTION",
                department: "Cast",
                name: "Lead Actor Fee",
                qty: 1,
                rate: 30000,
              },
              {
                phase: "PUBLICITY",
                department: "Marketing",
                name: "Trailer Launch",
                qty: 1,
                rate: 10000,
              },
            ],
          },
        },
      },
      financingSources: {
        create: [
          { type: "Equity", amount: 80000 },
          { type: "Incentive", amount: 10000 },
        ],
      },
      cashflowForecasts: {
        create: [
          { weekStart: new Date("2025-02-01"), inflows: 20000, outflows: 10000, cumulative: 10000 },
          { weekStart: new Date("2025-02-08"), inflows: 30000, outflows: 15000, cumulative: 25000 },
        ],
      },
      waterfallDefinitions: {
        create: {
          tiers: {
            create: [
              { tierOrder: 1, pctSplit: 60, description: "Investors" },
              { tierOrder: 2, pctSplit: 40, description: "Producers" },
            ],
          },
          participants: {
            create: [
              { name: "Investor B", role: "Investor", pctShare: 60 },
              { name: "Producer Team", role: "Producer", pctShare: 40 },
            ],
          },
        },
      },
      distributionDeals: {
        create: {
          territory: "India",
          window: "OTT",
          feePercent: 20,
          expensesCap: 1500,
          minimumGuarantee: 5000,
          revenueStatements: {
            create: [
              {
                periodStart: new Date("2025-05-01"),
                periodEnd: new Date("2025-05-31"),
                gross: 30000,
                fee: 6000,
                expenses: 1200,
                net: 22800,
              },
            ],
          },
        },
      },
    },
  });

  console.log("✅ Seeding complete:");
  console.log({ project1: project1.title, project2: project2.title });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
*/
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const roles = ["Admin", "Producer", "Investor","Line Producer"];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("✅ Roles seeded");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
