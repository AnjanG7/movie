import dayjs from "dayjs";
import prisma from "../../utils/prismaClient.js";

// ---------- helper functions ----------
function percentChange(current, previous) {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

// ---------- controller project stats ----------
export async function getDashboardProjectStats(req, res) {
  try {
    // date ranges
    const startOfThisMonth = dayjs().startOf("month").toDate();
    const startOfLastMonth = dayjs()
      .subtract(1, "month")
      .startOf("month")
      .toDate();
    const endOfLastMonth = dayjs().subtract(1, "month").endOf("month").toDate();

    // TOTAL PROJECTS
    const totalThisMonth = await prisma.project.count({
      where: { createdAt: { gte: startOfThisMonth } },
    });

    const totalLastMonth = await prisma.project.count({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    });

    res.json({
      totalProjects: {
        value: totalThisMonth,
        change: percentChange(totalThisMonth, totalLastMonth),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load project stats" });
  }
}

// ---------- controller user stats ----------
export async function getDashboardUserStats(req, res) {
  try {
    // date ranges
    const startOfThisMonth = dayjs().startOf("month").toDate();
    const startOfLastMonth = dayjs()
      .subtract(1, "month")
      .startOf("month")
      .toDate();
    const endOfLastMonth = dayjs().subtract(1, "month").endOf("month").toDate();

    // TOTAL USERS
    const totalThisMonth = await prisma.user.count({
      where: { createdAt: { gte: startOfThisMonth } },
    });

    const totalLastMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    });

    res.json({
      totalUsers: {
        value: totalThisMonth,
        change: percentChange(totalThisMonth, totalLastMonth),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load user stats" });
  }
}

export async function getDashboardActiveProjectStats(req, res) {
  try {
    // date ranges
    const startOfThisMonth = dayjs().startOf("month").toDate();
    const startOfLastMonth = dayjs()
      .subtract(1, "month")
      .startOf("month")
      .toDate();
    const endOfLastMonth = dayjs().subtract(1, "month").endOf("month").toDate();

    // TOTAL ACTIVE PROJECTS
    const totalThisMonth = await prisma.project.count({
      where: { createdAt: { gte: startOfThisMonth }, status: "active" },
    });

    const totalLastMonth = await prisma.project.count({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
        status: "active",
      },
    });

    res.json({
      totalActiveProjects: {
        value: totalThisMonth,
        change: percentChange(totalThisMonth, totalLastMonth),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load Active Project stats" });
  }
}
