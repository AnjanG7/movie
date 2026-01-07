import asyncHandler from 'express-async-handler';
import { BudgetLineService } from '../../services/budget/budgetLine.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { StatusCodes } from 'http-status-codes';

const budgetLineService = new BudgetLineService();

export const getBudgetLines = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const result = await budgetLineService.getBudgetLines(projectId,req.user);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, result, 'Budget lines fetched successfully')
    );
});

export const getVarianceReport = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const report = await budgetLineService.getVarianceReport(projectId,req.user);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, report, 'Variance report fetched successfully')
    );
});
export const getBudgetOverview = asyncHandler(async (req, res) => {
  const overview = await budgetLineService.getProducerBudgetOverview(req.user);

  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        overview,
        'Budget overview fetched successfully'
      )
    );
});

