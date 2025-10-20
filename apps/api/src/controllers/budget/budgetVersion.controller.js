import asyncHandler from "express-async-handler";
import { BudgetVersionService } from "../../services/budget/budgetVersion.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { StatusCodes } from "http-status-codes";

const budgetService = new BudgetVersionService();

export const createBudgetVersion = asyncHandler(async (req, res) => {
  const version = await budgetService.createBudgetVersion(
    req.params.projectId,
    req.body,
    req.user.id
  );
  res
    .status(StatusCodes.CREATED)
    .json(
      new ApiResponse(
        StatusCodes.CREATED,
        version,
        "Budget Version created successfully"
      )
    );
});

export const getBudgetVersions = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const query = req.query; // contains page, limit, type, locked

  const result = await budgetService.getBudgetVersions(projectId, query);

  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        result,
        "Budget Versions fetched successfully"
      )
    );
});

export const addLineItem = asyncHandler(async (req, res) => {
  const line = await budgetService.addLineItem(
    req.params.versionId,
    req.body,
    req.user.id
  );
  res
    .status(StatusCodes.CREATED)
    .json(
      new ApiResponse(StatusCodes.CREATED, line, "Line Item added successfully")
    );
});

export const updateLineItem = asyncHandler(async (req, res) => {
  const line = await budgetService.updateLineItem(
    req.params.lineId,
    req.body,
    req.user.id
  );
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, line, "Line Item updated successfully")
    );
});

export const deleteLineItem = asyncHandler(async (req, res) => {
  const result = await budgetService.deleteLineItem(
    req.params.lineId,
    req.user.id
  );
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, result, "Line Item deleted successfully")
    );
});

export const lockBaseline = asyncHandler(async (req, res) => {
  const version = await budgetService.lockBaseline(req.params.versionId);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, version, "Baseline version locked"));
});
