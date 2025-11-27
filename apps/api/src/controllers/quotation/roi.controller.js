import asyncHandler from 'express-async-handler';
import { ROIService } from '../../services/quotation/roi.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import StatusCodes from 'http-status-codes';
import prisma from '../../utils/prismaClient.js';

const roiService = new ROIService();

/**
 * Calculate ROI metrics for a quotation
 * POST /api/projects/:projectId/quotations/:versionId/calculate-roi
 */
export const calculateROI = asyncHandler(async (req, res) => {
  const { projectId, versionId } = req.params;
  const {
    projectedRevenue,
    distributionFeePercent = 20,
    productionPeriodMonths = 12,
    revenuePeriodYears = 3,
    discountRate = 0.10,
  } = req.body;

  // Get the budget version
  const budgetVersion = await prisma.budgetVersion.findFirst({
    where: {
      id: versionId,
      projectId,
    },
    include: {
      lines: true,
    },
  });

  if (!budgetVersion) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Budget version not found');
  }

  // Calculate total cost from budget lines
  const totalCost = budgetVersion.lines.reduce((sum, line) => {
    const lineTotal = line.qty * line.rate;
    const tax = lineTotal * (line.taxPercent || 0) / 100;
    return sum + lineTotal + tax;
  }, 0);

  // Calculate metrics
  const metrics = roiService.calculateComprehensiveMetrics({
    totalCost,
    projectedRevenue,
    distributionFeePercent,
    productionPeriodMonths,
    revenuePeriodYears,
    discountRate,
  });

  // Update budget version with metrics
  await prisma.budgetVersion.update({
    where: { id: versionId },
    data: {
      metrics: {
        ...metrics,
        updatedAt: new Date().toISOString(),
      },
      grandTotal: totalCost,
    },
  });

  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, metrics, 'ROI metrics calculated successfully')
  );
});

/**
 * Generate scenario analysis
 * POST /api/projects/:projectId/quotations/:versionId/scenarios
 */
export const generateScenarios = asyncHandler(async (req, res) => {
  const { projectId, versionId } = req.params;
  const {
    projectedRevenue,
    distributionFeePercent = 20,
    productionPeriodMonths = 12,
    revenuePeriodYears = 3,
    discountRate = 0.10,
  } = req.body;

  // Get budget version
  const budgetVersion = await prisma.budgetVersion.findFirst({
    where: {
      id: versionId,
      projectId,
    },
    include: {
      lines: true,
    },
  });

  if (!budgetVersion) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Budget version not found');
  }

  // Calculate total cost
  const totalCost = budgetVersion.lines.reduce((sum, line) => {
    const lineTotal = line.qty * line.rate;
    const tax = lineTotal * (line.taxPercent || 0) / 100;
    return sum + lineTotal + tax;
  }, 0);

  // Generate scenarios
  const scenarios = roiService.generateScenarios({
    totalCost,
    projectedRevenue,
    distributionFeePercent,
    productionPeriodMonths,
    revenuePeriodYears,
    discountRate,
  });

  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, scenarios, 'Scenarios generated successfully')
  );
});

/**
 * Get saved ROI metrics for a quotation
 * GET /api/projects/:projectId/quotations/:versionId/metrics
 */
export const getMetrics = asyncHandler(async (req, res) => {
  const { projectId, versionId } = req.params;

  const budgetVersion = await prisma.budgetVersion.findFirst({
    where: {
      id: versionId,
      projectId,
    },
    select: {
      id: true,
      version: true,
      type: true,
      metrics: true,
      grandTotal: true,
    },
  });

  if (!budgetVersion) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Budget version not found');
  }

  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, budgetVersion, 'Metrics retrieved successfully')
  );
});
