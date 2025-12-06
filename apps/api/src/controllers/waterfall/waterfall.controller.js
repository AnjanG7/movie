import asyncHandler from "express-async-handler";
import { WaterfallService } from "../../services/waterfall/waterfall.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { StatusCodes } from "http-status-codes";

const waterfallService = new WaterfallService();


export const createWaterfall = asyncHandler(async (req, res) => {
  const waterfall = await waterfallService.createWaterfall(req.params.projectId);
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, waterfall, "Waterfall created successfully"));
});


export const addTiers = asyncHandler(async (req, res) => {
  const tiers = await waterfallService.addTiers(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, tiers, "Tiers added successfully"));
});


export const addParticipants = asyncHandler(async (req, res) => {
  const participants = await waterfallService.addParticipants(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, participants, "Participants added successfully"));
});


export const addRevenuePeriod = asyncHandler(async (req, res) => {
  const period = await waterfallService.addPeriod(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, period, "Revenue period added successfully"));
});


export const calculateDistribution = asyncHandler(async (req, res) => {
  const payouts = await waterfallService.calculateDistribution(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, payouts, "Distribution calculated successfully"));
});

export const listWaterfalls = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const user = req.user;


  if (user.role !== "Admin") {
    return res.status(StatusCodes.FORBIDDEN).json(
      new ApiResponse(StatusCodes.FORBIDDEN, null, "Not allowed")
    );
  }

  const waterfalls = await waterfallService.listWaterfalls(page, limit);
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, waterfalls, "Waterfalls listed successfully")
  );
});


export const updateTier = asyncHandler(async (req, res) => {
  const tierId = req.params.tierId;
  const data = req.body;

  const tier = await waterfallService.updateTier(tierId, data);
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, tier, "Tier updated successfully")
  );
});

export const deleteTier = asyncHandler(async (req, res) => {
  const tierId = req.params.tierId;

  await waterfallService.deleteTier(tierId);
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, null, "Tier deleted successfully")
  );
});

export const getWaterfallByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const waterfall = await waterfallService.getWaterfallByProject(projectId);

  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, waterfall, "Waterfall fetched successfully")
  );
});
// Get waterfall by ID
export const getWaterfallById = asyncHandler(async (req, res) => {
  const { id } = req.params; // waterfall ID

  const waterfall = await waterfallService.getWaterfallById(id);

  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, waterfall, "Waterfall fetched successfully")
  );
});

export const updateParticipant = asyncHandler(async (req, res) => {
  const participantId = req.params.participantId;
  const data = req.body;

  const participant = await waterfallService.updateParticipant(participantId, data);
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, participant, "Participant updated successfully")
  );
});

export const deleteParticipant = asyncHandler(async (req, res) => {
  const participantId = req.params.participantId;

  await waterfallService.deleteParticipant(participantId);
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, null, "Participant deleted successfully")
  );
});


export const updatePeriod = asyncHandler(async (req, res) => {
  const periodId = req.params.periodId;
  const data = req.body;

  const period = await waterfallService.updatePeriod(periodId, data);
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, period, "Revenue period updated successfully")
  );
});

export const deletePeriod = asyncHandler(async (req, res) => {
  const periodId = req.params.periodId;

  await waterfallService.deletePeriod(periodId);
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, null, "Revenue period deleted successfully")
  );
});