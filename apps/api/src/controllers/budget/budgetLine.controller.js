import asyncHandler from 'express-async-handler';
import { BudgetLineService } from '../../services/budget/budgetLine.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { StatusCodes } from 'http-status-codes';

const budgetLineService = new BudgetLineService();

export const getBudgetLines = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const result = await budgetLineService.getBudgetLines(projectId);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, result, 'Budget lines fetched successfully')
    );
});

export const getVarianceReport = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const report = await budgetLineService.getVarianceReport(projectId);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, report, 'Variance report fetched successfully')
    );
});
