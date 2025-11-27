import asyncHandler from "express-async-handler";
import { QuotationService } from "../../services/quotation/quotation.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { StatusCodes } from "http-status-codes";

const quotationService = new QuotationService();

export const createQuotation = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Debug log – helpful while testing
  console.log("📥 createQuotation body:", JSON.stringify(req.body, null, 2));

  const quotation = await quotationService.createQuotation(
    projectId,
    req.body,
    req.user?.id // your authMiddleware sets req.user.id
  );

  res
    .status(StatusCodes.CREATED)
    .json(
      new ApiResponse(
        StatusCodes.CREATED,
        quotation,
        "Quotation created successfully"
      )
    );
});

export const getQuotations = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const quotations = await quotationService.getQuotations(projectId);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        quotations,
        "Quotations fetched successfully"
      )
    );
});

export const getQuotation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const quotation = await quotationService.getQuotation(id);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        quotation,
        "Quotation fetched successfully"
      )
    );
});
export const updateQuotation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { body } = req;

  const updatedQuotation = await quotationService.updateQuotation(id, body);

  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        updatedQuotation,
        "Quotation updated successfully"
      )
    );
});

export const deleteQuotation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await quotationService.deleteQuotation(id);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, null, "Quotation deleted successfully")
    );
});

export const updateAssumptions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const quotation = await quotationService.updateAssumptions(id, req.body);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        quotation,
        "Assumptions updated successfully"
      )
    );
});

export const addCostLine = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const line = await quotationService.addCostLine(id, req.body);
  res
    .status(StatusCodes.CREATED)
    .json(
      new ApiResponse(StatusCodes.CREATED, line, "Cost line added successfully")
    );
});

export const updateCostLine = asyncHandler(async (req, res) => {
  const { lineId } = req.params;
  const line = await quotationService.updateCostLine(lineId, req.body);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, line, "Cost line updated successfully")
    );
});

export const deleteCostLine = asyncHandler(async (req, res) => {
  const { lineId } = req.params;
  const result = await quotationService.deleteCostLine(lineId);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, result, "Cost line deleted successfully")
    );
});

export const updateFinancingPlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const quotation = await quotationService.updateFinancingPlan(id, req.body);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        quotation,
        "Financing plan updated successfully"
      )
    );
});

export const updateRevenueModel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const quotation = await quotationService.updateRevenueModel(id, req.body);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        quotation,
        "Revenue model updated successfully"
      )
    );
});

export const calculateMetrics = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const metrics = await quotationService.calculateMetrics(id);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        metrics,
        "Metrics calculated successfully"
      )
    );
});

export const convertToBaseline = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await quotationService.convertToBaseline(id);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        result,
        "Quotation converted to baseline successfully"
      )
    );
});
