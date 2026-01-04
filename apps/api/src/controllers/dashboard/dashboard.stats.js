import dayjs from "dayjs";
import prisma from "../../utils/prismaClient.js";

// ---------- helper functions ----------
function percentChange(current, previous) {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

// ---------- controller ----------
export async function getDashboardStats(req, res) {
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
    res.status(500).json({ message: "Failed to load dashboard stats" });
  }
}
