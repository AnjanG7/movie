import asyncHandler from "express-async-handler";
import { PostProductionService } from "../../services/postProduction/postProduction.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { StatusCodes } from "http-status-codes";

const postProductionService = new PostProductionService();

// ==================== POST TASKS ====================

export const createPostTask = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const postTask = await postProductionService.createPostTask(
    projectId,
    req.body,
    req.user
  );
  res
    .status(StatusCodes.CREATED)
    .json(
      new ApiResponse(
        StatusCodes.CREATED,
        postTask,
        "Post-production task created successfully"
      )
    );
});

export const getPostTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const result = await postProductionService.getPostTasks(
    projectId,
    req.query,
    req.user
  );
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        result,
        "Post-production tasks fetched successfully"
      )
    );
});

export const getPostTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const postTask = await postProductionService.getPostTask(id);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        postTask,
        "Post-production task fetched successfully"
      )
    );
});

export const updatePostTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = await postProductionService.updatePostTask(id, req.body);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        updated,
        "Post-production task updated successfully"
      )
    );
});

export const deletePostTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await postProductionService.deletePostTask(id);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, result, "Post-production task deleted")
    );
});

// ==================== POST BUDGET LINES ====================

export const getPostBudgetLines = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const result = await postProductionService.getPostBudgetLines(
    projectId,
    req.user
  );
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        result,
        "Post-production budget lines fetched successfully"
      )
    );
});

export const addPostBudgetLine = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const line = await postProductionService.addPostBudgetLine(
    projectId,
    req.body,
    req.user
  );
  res
    .status(StatusCodes.CREATED)
    .json(
      new ApiResponse(
        StatusCodes.CREATED,
        line,
        "Post-production budget line added successfully"
      )
    );
});

// ==================== FORECASTING ====================

export const getPostProductionForecast = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const forecast = await postProductionService.getPostProductionForecast(
    projectId,
    req.user
  );
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        forecast,
        "Post-production forecast fetched successfully"
      )
    );
});

export const updateROIWithPostProduction = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const metrics = await postProductionService.updateROIWithPostProduction(
    projectId,
    req.user
  );
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        metrics,
        "ROI updated with post-production data successfully"
      )
    );
});
