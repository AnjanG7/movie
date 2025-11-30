import prisma from "../../utils/prismaClient.js";
import { ApiError } from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";

export class CashflowService {
  // Get cashflow forecast for a project
  async getCashflowForecast(projectId, user, query = {}) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project)
      throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
    const isAdmin = user.roles?.includes("Admin");
    // Only Admin or Project Owner
    if (
      !isAdmin &&
      project.ownerId !== user?.id &&
      !(await prisma.projectUser.findFirst({
        where: { projectId, userId: user?.id },
      }))
    ) {
      throw new ApiError(StatusCodes.FORBIDDEN, "You do not have permission");
    }

    const { startDate, endDate, weeks = 12 } = query;

    const forecasts = await prisma.cashflowForecast.findMany({
      where: {
        projectId,
        ...(startDate && endDate
          ? {
              weekStart: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }
          : {}),
      },
      orderBy: { weekStart: "asc" },
      take: weeks ? parseInt(weeks) : undefined,
    });

    return forecasts;
  }

  // Create or update cashflow entry
  async upsertCashflowEntry(projectId, user, data) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project)
      throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
  const isAdmin = user.roles?.includes("Admin");
    // Only Admin or Project Owner
    if (
      !isAdmin&&
      project.ownerId !== user?.id &&
      !(await prisma.projectUser.findFirst({
        where: { projectId, userId: user?.id },
      }))
    ) {
      throw new ApiError(StatusCodes.FORBIDDEN, "You do not have permission");
    }
    const { weekStart, inflows, outflows } = data;

    // Check if entry exists for this week
    const existing = await prisma.cashflowForecast.findFirst({
      where: {
        projectId,
        weekStart: new Date(weekStart),
      },
    });

    // Calculate cumulative (get previous week's cumulative)
    const previousWeek = await prisma.cashflowForecast.findFirst({
      where: {
        projectId,
        weekStart: {
          lt: new Date(weekStart),
        },
      },
      orderBy: { weekStart: "desc" },
    });

    const previousCumulative = previousWeek?.cumulative || 0;
    const cumulative = previousCumulative + inflows - outflows;

    if (existing) {
      // Update existing
      return await prisma.cashflowForecast.update({
        where: { id: existing.id },
        data: {
          inflows,
          outflows,
          cumulative,
        },
      });
    } else {
      // Create new
      return await prisma.cashflowForecast.create({
        data: {
          projectId,
          weekStart: new Date(weekStart),
          inflows,
          outflows,
          cumulative,
        },
      });
    }
  }

  // Auto-compute cashflow from financing and scheduled payments
  async autoComputeCashflow(projectId, user, weeks = 12) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project)
      throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
  const isAdmin = user.roles?.includes("Admin");
    // Only Admin or Project Owner
    if (
      !isAdmin&&
      project.ownerId !== user?.id&&
      !(await prisma.projectUser.findFirst({
        where: { projectId, userId: user?.id },
      }))
    ) {
      throw new ApiError(StatusCodes.FORBIDDEN, "You do not have permission");
    }
    const startDate = new Date();
    const forecasts = [];

    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + i * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      // Calculate inflows from financing drawdowns
      const drawdowns = await prisma.drawdown.findMany({
        where: {
          source: {
            projectId,
          },
          date: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
      });

      const inflows = drawdowns.reduce((sum, d) => sum + d.amount, 0);

      // Calculate outflows from scheduled payments
      const installments = await prisma.installment.findMany({
        where: {
          scheduledPayment: {
            payee: {
              purchaseOrders: {
                some: {
                  projectId,
                },
              },
            },
          },
          dueDate: {
            gte: weekStart,
            lt: weekEnd,
          },
          status: "Pending",
        },
        include: {
          scheduledPayment: true,
        },
      });

      const outflows = installments.reduce((sum, inst) => sum + inst.amount, 0);

      // Get previous cumulative
      const previousWeek =
        forecasts.length > 0 ? forecasts[forecasts.length - 1] : null;
      const previousCumulative = previousWeek?.cumulative || 0;
      const cumulative = previousCumulative + inflows - outflows;

      // Upsert forecast
      const forecast = await this.upsertCashflowEntry(projectId, {
        weekStart: weekStart.toISOString(),
        inflows,
        outflows,
      });

      forecasts.push(forecast);
    }

    return forecasts;
  }

  // Get cashflow summary
  async getCashflowSummary(projectId, user) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project)
      throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
  const isAdmin = user.roles?.includes("Admin");
    // Only Admin or Project Owner
    if (
     !isAdmin &&
      project.ownerId !== user?.id &&
      !(await prisma.projectUser.findFirst({
        where: { projectId, userId: user?.id },
      }))
    ) {
      throw new ApiError(StatusCodes.FORBIDDEN, "You do not have permission");
    }
    const forecasts = await prisma.cashflowForecast.findMany({
      where: { projectId },
      orderBy: { weekStart: "asc" },
    });

    const totalInflows = forecasts.reduce((sum, f) => sum + f.inflows, 0);
    const totalOutflows = forecasts.reduce((sum, f) => sum + f.outflows, 0);
    const currentBalance =
      forecasts.length > 0 ? forecasts[forecasts.length - 1].cumulative : 0;

    // Find weeks with negative balance (shortfalls)
    const shortfalls = forecasts.filter((f) => f.cumulative < 0);

    // Find weeks with low balance (< 10% of average weekly outflow)
    const avgOutflow = totalOutflows / forecasts.length || 0;
    const lowBalanceThreshold = avgOutflow * 0.1;
    const lowBalanceWeeks = forecasts.filter(
      (f) => f.cumulative > 0 && f.cumulative < lowBalanceThreshold
    );

    return {
      totalInflows,
      totalOutflows,
      netCashflow: totalInflows - totalOutflows,
      currentBalance,
      shortfalls: shortfalls.length,
      lowBalanceWeeks: lowBalanceWeeks.length,
      alerts: [
        ...shortfalls.map((f) => ({
          type: "SHORTFALL",
          week: f.weekStart,
          amount: f.cumulative,
          message: `Negative balance of ${Math.abs(f.cumulative).toFixed(2)} expected`,
        })),
        ...lowBalanceWeeks.map((f) => ({
          type: "LOW_BALANCE",
          week: f.weekStart,
          amount: f.cumulative,
          message: `Low balance of ${f.cumulative.toFixed(2)} expected`,
        })),
      ],
    };
  }

  // Recalculate all cumulatives
  async recalculateCumulatives(projectId, user) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project)
      throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
  const isAdmin = user.roles?.includes("Admin");
    // Only Admin or Project Owner
    if (
      !isAdmin &&
      project.ownerId !== user?.id&&
      !(await prisma.projectUser.findFirst({
        where: { projectId, userId: user?.id },
      }))
    ) {
      throw new ApiError(StatusCodes.FORBIDDEN, "You do not have permission");
    }
    const forecasts = await prisma.cashflowForecast.findMany({
      where: { projectId },
      orderBy: { weekStart: "asc" },
    });

    let cumulative = 0;
    for (const forecast of forecasts) {
      cumulative += forecast.inflows - forecast.outflows;
      await prisma.cashflowForecast.update({
        where: { id: forecast.id },
        data: { cumulative },
      });
    }

    return forecasts;
  }

  // Delete cashflow entry
  async deleteCashflowEntry(id) {
    const forecast = await prisma.cashflowForecast.findUnique({
      where: { id },
    });

    if (!forecast) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Cashflow entry not found");
    }

    await prisma.cashflowForecast.delete({ where: { id } });

    // Recalculate cumulatives for remaining entries
    await this.recalculateCumulatives(forecast.projectId);

    return { message: "Cashflow entry deleted successfully" };
  }
}
