import asyncHandler from 'express-async-handler';
import { PDFService } from '../../services/export/pdf.service.js';
import prisma from '../../utils/prismaClient.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import StatusCodes from 'http-status-codes';

const pdfService = new PDFService();

// ============================================
// 1. EXPORT QUOTATION PDF
// ============================================
export const exportQuotationPDF = asyncHandler(async (req, res) => {
  const { projectId, versionId } = req.params;

  const quotation = await prisma.budgetVersion.findFirst({
    where: {
      id: versionId,
      projectId,
      type: 'QUOTE',
    },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          baseCurrency: true,
        },
      },
      lines: {
        orderBy: [
          { phase: 'asc' },
          { department: 'asc' },
        ],
      },
    },
  });

  if (!quotation) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Quotation not found');
  }

  const result = await pdfService.generateQuotationPDF(quotation, {
    includeLineItems: true,
    includeROI: true,
    includeWaterfall: false,
  });

  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, result, 'Quotation PDF generated successfully')
  );
});

// ============================================
// 2. EXPORT COST REPORT PDF
// ============================================
export const exportCostReportPDF = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Get project
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      baseCurrency: true,
    },
  });

  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Project not found');
  }

  // Get working budget version with lines
  const workingBudget = await prisma.budgetVersion.findFirst({
    where: {
      projectId,
      type: 'WORKING',
    },
    include: {
      lines: true,
    },
  });

  if (!workingBudget) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Working budget not found');
  }

  // Calculate costs for each line
  const linesWithCosts = await Promise.all(
    workingBudget.lines.map(async (line) => {
      // Get committed amount (approved POs)
      const pos = await prisma.purchaseOrder.findMany({
        where: {
          budgetLineId: line.id,
          status: { in: ['Approved', 'Completed'] },
        },
      });
      const committed = pos.reduce((sum, po) => sum + po.amount, 0);

      // Get spent amount (paid invoices)
      const invoices = await prisma.invoice.findMany({
        where: {
          po: { budgetLineId: line.id },
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

  // Calculate summary
  const summary = {
    totalBudget: linesWithCosts.reduce((sum, line) => sum + line.budgeted, 0),
    totalCommitted: linesWithCosts.reduce((sum, line) => sum + line.committed, 0),
    totalSpent: linesWithCosts.reduce((sum, line) => sum + line.spent, 0),
  };

  summary.efc = summary.totalSpent + summary.totalCommitted;
  summary.variance = summary.totalBudget - summary.efc;
  summary.variancePercent = summary.totalBudget > 0 ? (summary.variance / summary.totalBudget) * 100 : 0;

  // Group by phase
  const byPhase = linesWithCosts.reduce((acc, line) => {
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

  // Get significant variances (>10% variance)
  const variances = linesWithCosts
    .filter((line) => Math.abs(line.variancePercent) > 10)
    .sort((a, b) => Math.abs(b.variancePercent) - Math.abs(a.variancePercent))
    .slice(0, 20); // Top 20

  const reportData = {
    project,
    summary,
    byPhase,
    variances,
  };

  const result = await pdfService.generateCostReportPDF(reportData);

  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, result, 'Cost report PDF generated successfully')
  );
});

// ============================================
// 3. EXPORT CASHFLOW REPORT PDF
// ============================================
export const exportCashflowReportPDF = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { weeks = 12 } = req.query;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      baseCurrency: true,
    },
  });

  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Project not found');
  }

  // Get cashflow forecasts
  const forecasts = await prisma.cashflowForecast.findMany({
    where: { projectId },
    orderBy: { weekStart: 'asc' },
    take: parseInt(weeks),
  });

  if (forecasts.length === 0) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'No cashflow data found');
  }

  // Calculate summary
  const summary = {
    totalInflows: forecasts.reduce((sum, f) => sum + f.inflows, 0),
    totalOutflows: forecasts.reduce((sum, f) => sum + f.outflows, 0),
  };
  summary.netPosition = summary.totalInflows - summary.totalOutflows;
  summary.finalCumulative = forecasts[forecasts.length - 1].cumulative;

  // Find shortfall alerts
  const alerts = forecasts
    .filter((f) => f.cumulative < 0)
    .map((f) => ({
      weekStart: f.weekStart,
      message: `Projected shortfall of ${formatCurrency(Math.abs(f.cumulative), project.baseCurrency)}`,
    }));

  const cashflowData = {
    project,
    periodStart: forecasts[0].weekStart.toISOString().split('T')[0],
    periodEnd: forecasts[forecasts.length - 1].weekStart.toISOString().split('T')[0],
    summary,
    weeks: forecasts,
    alerts,
  };

  const result = await pdfService.generateCashflowReportPDF(cashflowData);

  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, result, 'Cashflow report PDF generated successfully')
  );
});

// ============================================
// 4. EXPORT WATERFALL STATEMENT PDF
// ============================================
export const exportWaterfallStatementPDF = asyncHandler(async (req, res) => {
  const { projectId, waterfallId } = req.params;
  const { periodId } = req.query;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      baseCurrency: true,
    },
  });

  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Project not found');
  }

  // Get waterfall definition
  const waterfall = await prisma.waterfallDefinition.findFirst({
    where: {
      id: waterfallId,
      projectId,
    },
    include: {
      tiers: {
        orderBy: { tierOrder: 'asc' },
      },
      participants: {
        orderBy: { orderNo: 'asc' },
      },
      periods: {
        where: periodId ? { id: periodId } : undefined,
        orderBy: { periodStart: 'desc' },
        take: 1,
      },
    },
  });

  if (!waterfall) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Waterfall not found');
  }

  if (!waterfall.periods || waterfall.periods.length === 0) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'No revenue periods found');
  }

  const period = waterfall.periods[0];

  // Get payouts for this period
  const payouts = await prisma.waterfallPayout.findMany({
    where: {
      participant: {
        waterfallId,
      },
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
    },
    include: {
      participant: true,
    },
  });

  // Calculate revenue breakdown
  const grossRevenue = period.netRevenue / 0.8; // Assuming 20% dist fee
  const distributionFees = grossRevenue * 0.2;
  const expenses = 0; // Placeholder

  const revenue = {
    gross: grossRevenue,
    fees: distributionFees,
    expenses,
    net: period.netRevenue,
  };

  // Map tiers with amounts
  const tiersWithAmounts = waterfall.tiers.map((tier) => ({
    order: tier.tierOrder,
    description: tier.description || `Tier ${tier.tierOrder}`,
    pctSplit: tier.pctSplit || 0,
    amount: (period.netRevenue * (tier.pctSplit || 0)) / 100,
  }));

  // Map participant payouts
  const participantPayouts = payouts.map((payout) => ({
    name: payout.participant.name,
    role: payout.participant.role,
    pctShare: payout.participant.pctShare || 0,
    amount: payout.amount,
  }));

  // Calculate cumulative (all periods to date)
  const allPeriods = await prisma.waterfallPeriod.findMany({
    where: { waterfallId },
  });

  const allPayouts = await prisma.waterfallPayout.findMany({
    where: {
      participant: {
        waterfallId,
      },
    },
  });

  const cumulative = {
    totalRevenue: allPeriods.reduce((sum, p) => sum + p.netRevenue, 0),
    totalDistributed: allPayouts.reduce((sum, p) => sum + p.amount, 0),
    remaining: 0,
  };
  cumulative.remaining = cumulative.totalRevenue - cumulative.totalDistributed;

  const waterfallData = {
    project,
    periodLabel: `Period ${period.periodStart.toISOString().split('T')[0]} to ${period.periodEnd.toISOString().split('T')[0]}`,
    periodStart: period.periodStart.toISOString().split('T')[0],
    periodEnd: period.periodEnd.toISOString().split('T')[0],
    revenue,
    tiers: tiersWithAmounts,
    payouts: participantPayouts,
    cumulative,
  };

  const result = await pdfService.generateWaterfallStatementPDF(waterfallData);

  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, result, 'Waterfall statement PDF generated successfully')
  );
});

// ============================================
// 5. EXPORT PURCHASE ORDER PDF
// ============================================
export const exportPurchaseOrderPDF = asyncHandler(async (req, res) => {
  const { projectId, poId } = req.params;

  const po = await prisma.purchaseOrder.findFirst({
    where: {
      id: poId,
      projectId,
    },
    include: {
      vendor: true,
      project: {
        select: {
          id: true,
          title: true,
          baseCurrency: true,
        },
      },
      budgetLine: true,
    },
  });

  if (!po) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Purchase order not found');
  }

  // Get approver details if exists
  let approver = null;
  if (po.approvedBy) {
    approver = await prisma.user.findUnique({
      where: { id: po.approvedBy },
      select: { name: true, email: true },
    });
  }

  const poData = {
    ...po,
    approver,
    description: po.budgetLine?.name || 'Purchase Order',
    paymentTerms: 'Net 30 days',
  };

  const result = await pdfService.generatePurchaseOrderPDF(poData);

  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, result, 'Purchase order PDF generated successfully')
  );
});

// ============================================
// 6. EXPORT INVOICE PDF
// ============================================
export const exportInvoicePDF = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      vendor: true,
      po: {
        include: {
          project: {
            select: {
              id: true,
              title: true,
              baseCurrency: true,
            },
          },
        },
      },
      payments: true,
    },
  });

  if (!invoice) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Invoice not found');
  }

  const invoiceData = {
    ...invoice,
    description: `Invoice for ${invoice.po?.project?.title || 'Project'}`,
  };

  const result = await pdfService.generateInvoicePDF(invoiceData);

  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, result, 'Invoice PDF generated successfully')
  );
});

// ============================================
// 7. EXPORT BUDGET SUMMARY PDF
// ============================================
export const exportBudgetSummaryPDF = asyncHandler(async (req, res) => {
  const { projectId, versionId } = req.params;

  const budget = await prisma.budgetVersion.findFirst({
    where: {
      id: versionId,
      projectId,
    },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          baseCurrency: true,
        },
      },
      lines: {
        orderBy: [
          { phase: 'asc' },
          { department: 'asc' },
        ],
      },
    },
  });

  if (!budget) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Budget version not found');
  }

  const result = await pdfService.generateBudgetSummaryPDF(budget);

  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, result, 'Budget summary PDF generated successfully')
  );
});

// ============================================
// 8. EXPORT PROJECT OVERVIEW PDF
// ============================================
export const exportProjectOverviewPDF = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      phases: true,
      budgetVersions: {
        where: { type: 'WORKING' },
        include: { lines: true },
        take: 1,
      },
    },
  });

  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Project not found');
  }

  // Calculate financial summary
  const workingBudget = project.budgetVersions[0];
  let financialSummary = null;

  if (workingBudget) {
    const budget = workingBudget.grandTotal || 0;

    // Get spent and committed
    const pos = await prisma.purchaseOrder.findMany({
      where: { projectId, status: { in: ['Approved', 'Completed'] } },
    });
    const committed = pos.reduce((sum, po) => sum + po.amount, 0);

    const invoices = await prisma.invoice.findMany({
      where: {
        po: { projectId },
        status: 'Paid',
      },
    });
    const spent = invoices.reduce((sum, inv) => sum + inv.amount, 0);

    financialSummary = {
      budget,
      spent,
      committed,
      remaining: budget - spent - committed,
      completionPercent: budget > 0 ? (spent / budget) * 100 : 0,
    };
  }

  // Get metrics
  const activePOs = await prisma.purchaseOrder.count({
    where: { projectId, status: { in: ['Pending', 'Approved'] } },
  });

  const metrics = {
    daysInProduction: Math.floor((Date.now() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
    budgetUtilization: financialSummary ? financialSummary.completionPercent : 0,
    scheduleStatus: 'On Track',
    activePOs,
    pendingApprovals: await prisma.purchaseOrder.count({
      where: { projectId, status: 'Pending' },
    }),
  };

  // Get team (placeholder - you can expand this)
  const team = [
    { name: 'Producer', role: 'Producer', email: 'producer@example.com' },
  ];

  const projectData = {
    ...project,
    financialSummary,
    metrics,
    team,
  };

  const result = await pdfService.generateProjectOverviewPDF(projectData);

  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, result, 'Project overview PDF generated successfully')
  );
});

// ============================================
// UTILITY FUNCTION
// ============================================
function formatCurrency(amount, currency = 'USD') {
  const symbols = { USD: '$', EUR: '€', GBP: '£', NPR: 'Rs.' };
  const symbol = symbols[currency] || currency;
  return `${symbol}${Math.abs(amount).toFixed(2)}`;
}
