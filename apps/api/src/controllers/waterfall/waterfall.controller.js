import asyncHandler from "express-async-handler";
import { WaterfallService } from "../../services/waterfall/waterfall.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { StatusCodes } from "http-status-codes";

const waterfallService = new WaterfallService();

// Create a new waterfall
export const createWaterfall = asyncHandler(async (req, res) => {
  const waterfall = await waterfallService.createWaterfall(req.params.projectId);
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, waterfall, "Waterfall created successfully"));
});

// Add tiers
export const addTiers = asyncHandler(async (req, res) => {
  const tiers = await waterfallService.addTiers(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, tiers, "Tiers added successfully"));
});

// Add participants
export const addParticipants = asyncHandler(async (req, res) => {
  const participants = await waterfallService.addParticipants(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, participants, "Participants added successfully"));
});

// Add revenue period
export const addRevenuePeriod = asyncHandler(async (req, res) => {
  const period = await waterfallService.addPeriod(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, period, "Revenue period added successfully"));
});

// Calculate distribution
export const calculateDistribution = asyncHandler(async (req, res) => {
  const payouts = await waterfallService.calculateDistribution(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, payouts, "Distribution calculated successfully"));
});
