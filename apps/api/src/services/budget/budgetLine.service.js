import prisma from '../../utils/prismaClient.js';
import { ApiError } from '../../utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';

export class BudgetLineService {
  // Get budget lines for a project's working budget
  async getBudgetLines(projectId,user) {
    // Get the working budget version for this project
    const workingBudget = await prisma.budgetVersion.findFirst({
      where: {
        projectId,
        type: 'WORKING',
      },
      include: {
        project:true,
        lines: {
          orderBy: [{ phase: 'asc' }, { department: 'asc' }],
        },
      },
    });
     const isAdmin = user.roles?.includes("Admin");
  if (
    !isAdmin &&
    workingBudget.project.ownerId !== user?.id &&
    budgetVersion.createdBy !== user?.id
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You do not have permission to view this budget'
    );
  }
    if (!workingBudget) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'No working budget found for this project');
    }

    // Calculate spent amount for each line
    const linesWithSpent = await Promise.all(
      workingBudget.lines.map(async (line) => {
        // Get total from approved/completed POs
        const pos = await prisma.purchaseOrder.findMany({
          where: {
            budgetLineId: line.id,
            status: { in: ['Approved', 'Completed'] },
          },
        });

        const committed = pos.reduce((sum, po) => sum + po.amount, 0);

        // Get total from paid invoices
        const invoices = await prisma.invoice.findMany({
          where: {
            po: {
              budgetLineId: line.id,
            },
            status: 'Paid',
          },
        });

        const spent = invoices.reduce((sum, inv) => sum + inv.amount, 0);

        const budgeted = line.qty * line.rate * (1 + (line.taxPercent || 0) / 100);
        const variance = budgeted - spent;
        const variancePercent = budgeted > 0 ? (variance / budgeted) * 100 : 0;

        return {
          ...line,
          budgeted,
          committed,
          spent,
          remaining: budgeted - committed,
          variance,
          variancePercent,
        };
      })
    );

    return {
      budgetVersion: workingBudget,
      lines: linesWithSpent,
    };
  }

  // Get variance report
  async getVarianceReport(projectId,user) {
    const { lines } = await this.getBudgetLines(projectId,user);

    const summary = {
      totalBudgeted: lines.reduce((sum, line) => sum + line.budgeted, 0),
      totalCommitted: lines.reduce((sum, line) => sum + line.committed, 0),
      totalSpent: lines.reduce((sum, line) => sum + line.spent, 0),
      totalVariance: lines.reduce((sum, line) => sum + line.variance, 0),
      overBudgetLines: lines.filter((line) => line.variance < 0).length,
      underBudgetLines: lines.filter((line) => line.variance > 0 && line.spent > 0).length,
    };

    const byPhase = lines.reduce((acc, line) => {
      if (!acc[line.phase]) {
        acc[line.phase] = {
          budgeted: 0,
          committed: 0,
          spent: 0,
          variance: 0,
        };
      }
      acc[line.phase].budgeted += line.budgeted;
      acc[line.phase].committed += line.committed;
      acc[line.phase].spent += line.spent;
      acc[line.phase].variance += line.variance;
      return acc;
    }, {});

    return {
      summary,
      byPhase,
      lines: lines.filter((line) => Math.abs(line.variancePercent) > 10), // Show lines with >10% variance
    };
  }
}
