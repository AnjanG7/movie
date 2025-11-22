import prisma from "../../utils/prismaClient.js";
import { ApiError } from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";

export class QuotationService {

  // Create new quotation version
  async createQuotation(projectId, data, userId) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");

    const quotation = await prisma.budgetVersion.create({
      data: {
        projectId,
        version: data.version || "v1",
        type: "QUOTE",
        createdBy: userId
      },
      include: { lines: true }
    });

    return quotation;
  }

  // Get all quotations
  async getQuotations(projectId) {
    return prisma.budgetVersion.findMany({
      where: { projectId, type: "QUOTE" },
      include: { lines: true }
    });
  }

  // Add assumptions (currency, tax %, contingency)
  async addAssumptions(quotationId, assumptions) {
    const quotation = await prisma.budgetVersion.findUnique({ where: { id: quotationId } });
    if (!quotation) throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");

    return prisma.budgetVersion.update({
      where: { id: quotationId },
      data: { sentTo: assumptions } // storing assumptions as JSON
    });
  }

  // ROI / IRR / NPV calculation
  async calculateROI(quotationId) {
    const quotation = await prisma.budgetVersion.findUnique({
      where: { id: quotationId },
      include: { lines: true }
    });
    if (!quotation) throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");

    const totalCost = quotation.lines.reduce((sum, line) => {
      return sum + line.qty * line.rate * (1 + (line.taxPercent || 0)/100);
    }, 0);

    // Simple ROI / NPV / IRR simulation (mocked, replace with real formulas)
    const projectedRevenue = totalCost * 1.5; 
    const roi = (projectedRevenue - totalCost) / totalCost;
    const npv = projectedRevenue - totalCost;
    const irr = 0.25; // placeholder 25%

    return { totalCost, projectedRevenue, roi, npv, irr };
  }

  // Convert quotation → baseline budget
  async convertToBaseline(quotationId) {
    const quotation = await prisma.budgetVersion.findUnique({ where: { id: quotationId } });
    if (!quotation) throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");

    if (quotation.type !== "QUOTE") throw new ApiError(StatusCodes.BAD_REQUEST, "Only quotations can be converted");

    return prisma.budgetVersion.update({
      where: { id: quotationId },
      data: { type: "BASELINE", lockedAt: new Date() }
    });
  }
}
