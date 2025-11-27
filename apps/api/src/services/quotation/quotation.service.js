import prisma from '../../utils/prismaClient.js';
import { ApiError } from '../../utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';

export class QuotationService {
  // Create new quotation
async createQuotation(projectId, data, userId) {
    // FRONTEND sends: version, type, template, assumptions, financingPlan, revenueModel, lines
    const {
      version,
      template,
      assumptions,
      financingPlan,
      revenueModel,
      lines,
    } = data;

    if (!version) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Version is required');
    }

    // Ensure unique version per project
    const existing = await prisma.budgetVersion.findFirst({
      where: { projectId, version },
    });

    if (existing) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Version "${version}" already exists`
      );
    }

    // Calculate grandTotal from lines
    let grandTotal = 0;
    if (Array.isArray(lines) && lines.length > 0) {
      grandTotal = lines.reduce((sum, line) => {
        const qty = Number(line.qty ?? 1);
        const rate = Number(line.rate ?? 0);
        const taxPercent = Number(line.taxPercent ?? 0);

        const subtotal = qty * rate;
        const tax = subtotal * (taxPercent / 100);
        return sum + subtotal + tax;
      }, 0);
    }

    // Create quotation as a BudgetVersion
    const quotation = await prisma.budgetVersion.create({
      data: {
        projectId,
        version,
        type: 'QUOTE', // always a quotation
        createdBy: userId || null,
        template: template || null,
        assumptions: assumptions || null,
        financingPlan: financingPlan || null,
        revenueModel: revenueModel || null,
        grandTotal,

        // Create budget line items
        lines: Array.isArray(lines) && lines.length > 0
          ? {
              create: lines.map((line) => ({
                phase: line.phase || 'PRODUCTION',
                department: line.department || '',
                name: line.name || '',
                qty: Number(line.qty ?? 1),
                rate: Number(line.rate ?? 0),
                taxPercent: Number(line.taxPercent ?? 0),
                vendor: line.vendor || null,
                notes: line.notes || null,
              })),
            }
          : undefined,
      },
      include: {
        project: {
          select: { id: true, title: true, baseCurrency: true },
        },
        lines: true,
      },
    });

    return quotation;
  }


  // Get template assumptions
  getTemplateAssumptions(template) {
    const templates = {
      FEATURE: {
        currency: 'USD',
        taxPercent: 0,
        contingencyPercent: 10,
        insurancePercent: 3,
        bondPercent: 2,
        phases: ['DEVELOPMENT', 'PRE_PRODUCTION', 'PRODUCTION', 'POST_PRODUCTION', 'PUBLICITY'],
      },
      SERIES: {
        currency: 'USD',
        taxPercent: 0,
        contingencyPercent: 8,
        insurancePercent: 2.5,
        bondPercent: 1.5,
        phases: ['DEVELOPMENT', 'PRE_PRODUCTION', 'PRODUCTION', 'POST_PRODUCTION', 'PUBLICITY'],
      },
      SHORT: {
        currency: 'USD',
        taxPercent: 0,
        contingencyPercent: 15,
        insurancePercent: 2,
        bondPercent: 0,
        phases: ['PRE_PRODUCTION', 'PRODUCTION', 'POST_PRODUCTION'],
      },
    };

    return templates[template] || templates.FEATURE;
  }
  async updateQuotation(quotationId, data) {
  // Fetch existing quotation
  const existing = await prisma.budgetVersion.findUnique({
    where: { id: quotationId },
    include: { lines: true },
  });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Quotation not found');
  }

  if (existing.type !== 'QUOTE') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Can only update quotations, not baseline or working budgets'
    );
  }

  const {
    version,
    template,
    assumptions,
    financingPlan,
    revenueModel,
    lines,
  } = data;

  // Check for version uniqueness if version is changed
  if (version && version !== existing.version) {
    const duplicate = await prisma.budgetVersion.findFirst({
      where: { projectId: existing.projectId, version },
    });
    if (duplicate) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Version "${version}" already exists`);
    }
  }

  // Recalculate grandTotal if lines are provided
  let grandTotal = existing.grandTotal;
  if (Array.isArray(lines) && lines.length > 0) {
    grandTotal = lines.reduce((sum, line) => {
      const qty = Number(line.qty ?? 1);
      const rate = Number(line.rate ?? 0);
      const taxPercent = Number(line.taxPercent ?? 0);
      const subtotal = qty * rate;
      const tax = subtotal * (taxPercent / 100);
      return sum + subtotal + tax;
    }, 0);
  }

  // Update quotation
  const updated = await prisma.budgetVersion.update({
    where: { id: quotationId },
    data: {
      version: version ?? existing.version,
      template: template ?? existing.template,
      assumptions: assumptions ?? existing.assumptions,
      financingPlan: financingPlan ?? existing.financingPlan,
      revenueModel: revenueModel ?? existing.revenueModel,
      grandTotal,
      // Update lines if provided
      lines: Array.isArray(lines)
        ? {
            deleteMany: {}, // delete existing lines
            create: lines.map((line) => ({
              phase: line.phase || 'PRODUCTION',
              department: line.department || '',
              name: line.name || '',
              qty: Number(line.qty ?? 1),
              rate: Number(line.rate ?? 0),
              taxPercent: Number(line.taxPercent ?? 0),
              vendor: line.vendor || null,
              notes: line.notes || null,
            })),
          }
        : undefined,
    },
    include: { lines: true, project: { select: { id: true, title: true, baseCurrency: true } } },
  });

  return updated;
}

  // Delete quotation
async deleteQuotation(quotationId) {
  const quotation = await prisma.budgetVersion.findUnique({
    where: { id: quotationId },
    include: { lines: true },
  });

  if (!quotation) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Quotation not found');
  }

  if (quotation.type !== 'QUOTE') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Can only delete quotations, not baseline or working budgets'
    );
  }

  // Delete all lines first
  await prisma.budgetLineItem.deleteMany({
    where: { budgetVersionId: quotationId },
  });

  // Delete the quotation
  await prisma.budgetVersion.delete({
    where: { id: quotationId },
  });

  return { message: 'Quotation deleted successfully' };
}

  // Update assumptions
  async updateAssumptions(quotationId, assumptions) {
    const quotation = await prisma.budgetVersion.findUnique({
      where: { id: quotationId },
    });

    if (!quotation) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Quotation not found');
    }

    if (quotation.type !== 'QUOTE') {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Can only update assumptions for quotations'
      );
    }

    return await prisma.budgetVersion.update({
      where: { id: quotationId },
      data: { assumptions },
    });
  }

  // Get quotation
  async getQuotation(quotationId) {
    const quotation = await prisma.budgetVersion.findUnique({
      where: { id: quotationId },
      include: {
        project: true,
        lines: {
          orderBy: [{ phase: 'asc' }, { department: 'asc' }],
        },
      },
    });

    if (!quotation) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Quotation not found');
    }

    // Calculate totals
    const totalsByPhase = {};
    let grandTotal = 0;

    quotation.lines.forEach((line) => {
      const lineTotal = line.qty * line.rate * (1 + (line.taxPercent || 0) / 100);
      grandTotal += lineTotal;

      if (!totalsByPhase[line.phase]) {
        totalsByPhase[line.phase] = 0;
      }
      totalsByPhase[line.phase] += lineTotal;
    });

    // Apply contingency, insurance, bond
    const assumptions = quotation.assumptions || {};
    const contingency = grandTotal * ((assumptions.contingencyPercent || 0) / 100);
    const insurance = grandTotal * ((assumptions.insurancePercent || 0) / 100);
    const bond = grandTotal * ((assumptions.bondPercent || 0) / 100);

    const totalWithOverheads = grandTotal + contingency + insurance + bond;

    return {
      ...quotation,
      summary: {
        subtotal: grandTotal,
        contingency,
        insurance,
        bond,
        total: totalWithOverheads,
        totalsByPhase,
      },
    };
  }

  // Get all quotations for a project
  async getQuotations(projectId) {
    const quotations = await prisma.budgetVersion.findMany({
      where: {
        projectId,
        type: 'QUOTE',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        lines: true,
      },
    });

    return quotations.map((q) => {
      const grandTotal = q.lines.reduce(
        (sum, line) => sum + line.qty * line.rate * (1 + (line.taxPercent || 0) / 100),
        0
      );

      const assumptions = q.assumptions || {};
      const contingency = grandTotal * ((assumptions.contingencyPercent || 0) / 100);
      const insurance = grandTotal * ((assumptions.insurancePercent || 0) / 100);
      const bond = grandTotal * ((assumptions.bondPercent || 0) / 100);

      return {
        ...q,
        total: grandTotal + contingency + insurance + bond,
      };
    });
  }

  // Add cost line to quotation
  async addCostLine(quotationId, data) {
    const quotation = await prisma.budgetVersion.findUnique({
      where: { id: quotationId },
    });

    if (!quotation) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Quotation not found');
    }

    const line = await prisma.budgetLineItem.create({
      data: {
        budgetVersionId: quotationId,
        phase: data.phase,
        department: data.department || null,
        name: data.name,
        qty: data.qty || 1,
        rate: data.rate,
        taxPercent: data.taxPercent || 0,
        vendor: data.vendor || null,
        notes: data.notes || null,
      },
    });

    return line;
  }

  // Update cost line
  async updateCostLine(lineId, data) {
    const line = await prisma.budgetLineItem.findUnique({
      where: { id: lineId },
    });

    if (!line) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Line item not found');
    }

    return await prisma.budgetLineItem.update({
      where: { id: lineId },
      data,
    });
  }

  // Delete cost line
  async deleteCostLine(lineId) {
    const line = await prisma.budgetLineItem.findUnique({
      where: { id: lineId },
    });

    if (!line) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Line item not found');
    }

    await prisma.budgetLineItem.delete({ where: { id: lineId } });
    return { message: 'Line item deleted successfully' };
  }

  // Update financing plan
  async updateFinancingPlan(quotationId, financingPlan) {
    const quotation = await prisma.budgetVersion.findUnique({
      where: { id: quotationId },
    });

    if (!quotation) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Quotation not found');
    }

    return await prisma.budgetVersion.update({
      where: { id: quotationId },
      data: { financingPlan },
    });
  }

  // Update revenue model
  async updateRevenueModel(quotationId, revenueModel) {
    const quotation = await prisma.budgetVersion.findUnique({
      where: { id: quotationId },
    });

    if (!quotation) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Quotation not found');
    }

    return await prisma.budgetVersion.update({
      where: { id: quotationId },
      data: { revenueModel },
    });
  }

  // Calculate financial metrics (ROI, IRR, NPV)
  async calculateMetrics(quotationId) {
    const quotation = await this.getQuotation(quotationId);
    
    const totalCost = quotation.summary.total;
    const revenueModel = quotation.revenueModel || {};

    // Simple calculations (you can enhance these)
    const projectedRevenue = revenueModel.grossRevenue || totalCost * 1.5;
    const distributionFees = projectedRevenue * (revenueModel.distributionFeePercent || 20) / 100;
    const netRevenue = projectedRevenue - distributionFees;
    
    const profit = netRevenue - totalCost;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
    
    // Simplified NPV (assuming 10% discount rate and 3 years)
    const discountRate = 0.10;
    const years = 3;
    const annualCashflow = netRevenue / years;
    let npv = -totalCost;
    for (let i = 1; i <= years; i++) {
      npv += annualCashflow / Math.pow(1 + discountRate, i);
    }

    // Simplified IRR (iterative approximation)
    let irr = 0;
    const cashflows = [-totalCost, ...Array(years).fill(annualCashflow)];
    
    // Simple IRR calculation using NPV = 0
    for (let rate = 0; rate <= 1; rate += 0.01) {
      let testNpv = 0;
      cashflows.forEach((cf, i) => {
        testNpv += cf / Math.pow(1 + rate, i);
      });
      if (Math.abs(testNpv) < 1000) {
        irr = rate * 100;
        break;
      }
    }

    const metrics = {
      totalCost,
      projectedRevenue,
      distributionFees,
      netRevenue,
      profit,
      roi: parseFloat(roi.toFixed(2)),
      npv: parseFloat(npv.toFixed(2)),
      irr: parseFloat(irr.toFixed(2)),
      breakEvenRevenue: totalCost + distributionFees,
      calculatedAt: new Date().toISOString(),
    };

    // Save metrics
    await prisma.budgetVersion.update({
      where: { id: quotationId },
      data: { metrics },
    });

    return metrics;
  }

  // Convert quotation to baseline budget
// Convert quotation to baseline budget
async convertToBaseline(quotationId) {
  const quotation = await prisma.budgetVersion.findUnique({
    where: { id: quotationId },
    include: { lines: true },
  });

  if (!quotation) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Quotation not found');
  }

  if (quotation.type !== 'QUOTE') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Only quotations can be converted to baseline'
    );
  }

  // Check if baseline already exists
  const existingBaseline = await prisma.budgetVersion.findFirst({
    where: {
      projectId: quotation.projectId,
      type: 'BASELINE',
    },
  });

  if (existingBaseline) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Baseline budget already exists for this project'
    );
  }

  // Create baseline
  const baseline = await prisma.budgetVersion.create({
    data: {
      projectId: quotation.projectId,
      version: 'BASELINE',
      type: 'BASELINE',
      template: quotation.template,
      assumptions: quotation.assumptions,
      financingPlan: quotation.financingPlan,
      revenueModel: quotation.revenueModel,
      metrics: quotation.metrics,
      createdBy: quotation.createdBy,
    },
  });

  // Copy all lines to baseline
  for (const line of quotation.lines) {
    await prisma.budgetLineItem.create({
      data: {
        budgetVersionId: baseline.id,
        phase: line.phase,
        department: line.department,
        name: line.name,
        qty: line.qty,
        rate: line.rate,
        taxPercent: line.taxPercent,
        vendor: line.vendor,
        notes: line.notes,
      },
    });
  }

  // Create working budget from baseline
  const working = await prisma.budgetVersion.create({
    data: {
      projectId: quotation.projectId,
      version: 'WORKING-V1',
      type: 'WORKING',
      template: quotation.template,
      assumptions: quotation.assumptions,
      financingPlan: quotation.financingPlan,
      revenueModel: quotation.revenueModel,
      metrics: quotation.metrics,
      createdBy: quotation.createdBy,
    },
  });

  // Copy lines to working budget
  for (const line of quotation.lines) {
    await prisma.budgetLineItem.create({
      data: {
        budgetVersionId: working.id,
        phase: line.phase,
        department: line.department,
        name: line.name,
        qty: line.qty,
        rate: line.rate,
        taxPercent: line.taxPercent,
        vendor: line.vendor,
        notes: line.notes,
      },
    });
  }

  // Mark quotation as accepted
  await prisma.budgetVersion.update({
    where: { id: quotationId },
    data: { acceptedAt: new Date() },
  });

  return { baseline, working };
}

}
