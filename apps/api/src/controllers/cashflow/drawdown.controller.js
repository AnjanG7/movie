import asyncHandler from "express-async-handler";
import { DrawdownService } from "../../services/cashflow/drawdown.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { StatusCodes } from "http-status-codes";

const drawdownService = new DrawdownService();

export const createDrawdown = asyncHandler(async (req, res) => {
  const drawdown = await drawdownService.createDrawdown(req.body);
  res
    .status(StatusCodes.CREATED)
    .json(
      new ApiResponse(
        StatusCodes.CREATED,
        drawdown,
        "Drawdown created successfully"
      )
    );
});

export const getDrawdowns = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const drawdowns = await drawdownService.getDrawdowns(
    projectId,
    req.query,
    req.user
  );
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        drawdowns,
        "Drawdowns fetched successfully"
      )
    );
});

export const deleteDrawdown = asyncHandler(async (req, res) => {
  const result = await drawdownService.deleteDrawdown(req.params.id);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, result, "Drawdown deleted"));
});
