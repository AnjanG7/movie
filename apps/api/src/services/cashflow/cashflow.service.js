
import prisma from "../../utils/prismaClient.js";
import { ApiError } from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";

export class CashflowService {
  // Helper method to verify project access
  async verifyProjectAccess(projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
    }

    return project;
  }

  // Get cashflow forecast for a project
  async getCashflowForecast(projectId, query, user) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    const users = await prisma.user.findUnique({
      where: { id: user?.id },
      include: { role: true },
    });

    if (!project)
      throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
    const isAdmin = users.role?.name === "Admin";
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
    await this.verifyProjectAccess(projectId);

    const { startDate, endDate, weeks, all } = query;

    // Build where clause
    const where = { projectId };

    // If specific date range is provided
    if (startDate && endDate) {
      where.weekStart = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Fetch all entries for this project, ordered by date
    const forecasts = await prisma.cashflowForecast.findMany({
      where,
      orderBy: { weekStart: "asc" },
      // Only apply take limit if 'all' is not requested and weeks is specified
      ...(all !== "true" && weeks ? { take: parseInt(weeks) } : {}),
    });

    return forecasts;
  }

  // Create or update cashflow entry
  async upsertCashflowEntry(projectId, data, user) {
    await this.verifyProjectAccess(projectId);
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    const users = await prisma.user.findUnique({
      where: { id: user?.id },
      include: { role: true },
    });

    if (!project)
      throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
    const isAdmin = users.role?.name === "Admin";
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

    const { weekStart, inflows, outflows } = data;

    if (!weekStart) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "weekStart is required");
    }

    // Parse values
    const inflowsNum = Number(inflows) || 0;
    const outflowsNum = Number(outflows) || 0;

    // Normalize date to start of day (UTC) for consistent matching
    const weekStartDate = new Date(weekStart);
    weekStartDate.setUTCHours(0, 0, 0, 0);

    // Check for existing entry on this date
    // Use date range to catch any time-of-day variations
    const dayStart = new Date(weekStartDate);
    const dayEnd = new Date(weekStartDate);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const existing = await prisma.cashflowForecast.findFirst({
      where: {
        projectId,
        weekStart: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
    });

    // Calculate cumulative from previous entries
    const previousWeek = await prisma.cashflowForecast.findFirst({
      where: {
        projectId,
        weekStart: { lt: weekStartDate },
      },
      orderBy: { weekStart: "desc" },
    });

    const previousCumulative = previousWeek?.cumulative || 0;
    const cumulative = previousCumulative + inflowsNum - outflowsNum;

    let result;

    if (existing) {
      // Update existing entry
      result = await prisma.cashflowForecast.update({
        where: { id: existing.id },
        data: {
          inflows: inflowsNum,
          outflows: outflowsNum,
          cumulative,
        },
      });
    } else {
      // Create new entry
      result = await prisma.cashflowForecast.create({
        data: {
          projectId,
          weekStart: weekStartDate,
          inflows: inflowsNum,
          outflows: outflowsNum,
          cumulative,
        },
      });
    }

    // Recalculate all subsequent cumulatives
    await this.recalculateSubsequentCumulatives(projectId, weekStartDate);

    return result;
  }

  // Helper to recalculate cumulatives for weeks after a given date
  async recalculateSubsequentCumulatives(projectId, fromDate) {
    // Get ALL entries for this project to recalculate properly


    
    const allForecasts = await prisma.cashflowForecast.findMany({
      where: { projectId },
      orderBy: { weekStart: "asc" },
    });

    if (allForecasts.length === 0) return;

    let cumulative = 0;

    for (const forecast of allForecasts) {
      cumulative += (forecast.inflows || 0) - (forecast.outflows || 0);

      // Only update if cumulative changed
      if (forecast.cumulative !== cumulative) {
        await prisma.cashflowForecast.update({
          where: { id: forecast.id },
          data: { cumulative },
        });
      }
    }
  }

  // Auto-compute cashflow from financing and scheduled payments
async autoComputeCashflow(projectId, user, weeks = 12) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");

  const isAdmin = user.roles?.includes("Admin");
  if (
    !isAdmin &&
    project.ownerId !== user?.id &&
    !(await prisma.projectUser.findFirst({ where: { projectId, userId: user?.id } }))
  ) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You do not have permission");
  }

  await this.verifyProjectAccess(projectId);

  const startDate = new Date();
  startDate.setUTCHours(0, 0, 0, 0);

  // Fetch existing forecasts once to avoid repeated DB queries
  const existingForecasts = await prisma.cashflowForecast.findMany({
    where: { projectId },
    orderBy: { weekStart: "asc" },
  });

  // Preload cumulative from last existing forecast
  let lastCumulative = existingForecasts.length
    ? existingForecasts[existingForecasts.length - 1].cumulative
    : 0;

  const operations = []; // For transaction batching

  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(startDate);
    weekStart.setUTCDate(weekStart.getUTCDate() + i * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

    // Calculate inflows
    const drawdowns = await prisma.drawdown.findMany({
      where: { source: { projectId }, date: { gte: weekStart, lt: weekEnd } },
    });
    const inflows = drawdowns.reduce((sum, d) => sum + (d.amount || 0), 0);

    // Calculate outflows
    const installments = await prisma.installment.findMany({
      where: {
        scheduledPayment: {
          payee: {
            purchaseOrders: {
              some: { projectId },
            },
          },
        },
        dueDate: { gte: weekStart, lt: weekEnd },
        status: "Pending",
      },
      include: { scheduledPayment: true },
    });
    const outflows = installments.reduce((sum, inst) => sum + (inst.amount || 0), 0);

    // Calculate cumulative for this week
    lastCumulative += inflows - outflows;

    // Check if forecast already exists
    const existing = existingForecasts.find(f =>
      f.weekStart.getTime() === weekStart.getTime()
    );

    if (existing) {
      operations.push(
        prisma.cashflowForecast.update({
          where: { id: existing.id },
          data: { inflows, outflows, cumulative: lastCumulative },
        })
      );
    } else {
      operations.push(
        prisma.cashflowForecast.create({
          data: {
            projectId,
            weekStart,
            inflows,
            outflows,
            cumulative: lastCumulative,
          },
        })
      );
    }
  }

  // Execute all updates/inserts in a single transaction
  const forecasts = await prisma.$transaction(operations);

  return forecasts;
}


  // Get cashflow summary
  async getCashflowSummary(projectId, user) {
    await this.verifyProjectAccess(projectId);
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    const users = await prisma.user.findUnique({
      where: { id: user?.id },
      include: { role: true },
    });
    if (!project)
      throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
    const isAdmin = users.role?.name === "Admin";
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

    const totalInflows = forecasts.reduce(
      (sum, f) => sum + (f.inflows || 0),
      0
    );
    const totalOutflows = forecasts.reduce(
      (sum, f) => sum + (f.outflows || 0),
      0
    );
    const currentBalance =
      forecasts.length > 0 ? forecasts[forecasts.length - 1].cumulative : 0;

    const shortfalls = forecasts.filter((f) => f.cumulative < 0);
    const avgOutflow = totalOutflows / (forecasts.length || 1);
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
          message: `Negative balance of $${Math.abs(f.cumulative).toFixed(2)} expected`,
        })),
        ...lowBalanceWeeks.map((f) => ({
          type: "LOW_BALANCE",
          week: f.weekStart,
          amount: f.cumulative,
          message: `Low balance of $${f.cumulative.toFixed(2)} expected`,
        })),
      ],
    };
  }

  // Recalculate all cumulatives for a project
  async recalculateCumulatives(projectId, user) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    const users = await prisma.user.findUnique({
      where: { id: user?.id },
      include: { role: true },
    });
    if (!project)
      throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
    const isAdmin = users.role?.name === "Admin";
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
    await this.verifyProjectAccess(projectId);

    const forecasts = await prisma.cashflowForecast.findMany({
      where: { projectId },
      orderBy: { weekStart: "asc" },
    });

    let cumulative = 0;

    for (const forecast of forecasts) {
      cumulative += (forecast.inflows || 0) - (forecast.outflows || 0);
      await prisma.cashflowForecast.update({
        where: { id: forecast.id },
        data: { cumulative },
      });
    }

    return await prisma.cashflowForecast.findMany({
      where: { projectId },
      orderBy: { weekStart: "asc" },
    });
  }

  // Delete cashflow entry
  async deleteCashflowEntry(id) {
    const forecast = await prisma.cashflowForecast.findUnique({
      where: { id },
    });

    if (!forecast) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Cashflow entry not found");
    }

    const projectId = forecast.projectId;

    await prisma.cashflowForecast.delete({ where: { id } });
    await this.recalculateCumulatives(projectId);

    return { message: "Cashflow entry deleted successfully" };
  }
}
