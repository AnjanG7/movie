import asyncHandler from "express-async-handler";
import { QuotationService } from "../../services/quotation/quotation.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { StatusCodes } from "http-status-codes";

const quotationService = new QuotationService();

// Create a new quotation version
export const createQuotation = asyncHandler(async (req, res) => {
  const quotation = await quotationService.createQuotation(
    req.params.projectId,
    req.body,
    req.user.id
  );
  res.status(StatusCodes.CREATED).json(new ApiResponse(
    StatusCodes.CREATED,
    quotation,
    "Quotation created successfully"
  ));
});

// Get all quotations for a project
export const getQuotations = asyncHandler(async (req, res) => {
  const result = await quotationService.getQuotations(req.params.projectId);
  res.status(StatusCodes.OK).json(new ApiResponse(
    StatusCodes.OK,
    result,
    "Quotations fetched successfully"
  ));
});

// Add assumptions to a quotation
export const addAssumptions = asyncHandler(async (req, res) => {
  const updatedQuotation = await quotationService.addAssumptions(
    req.params.quotationId,
    req.body
  );
  res.status(StatusCodes.OK).json(new ApiResponse(
    StatusCodes.OK,
    updatedQuotation,
    "Assumptions added successfully"
  ));
});

// Calculate ROI / IRR / NPV
export const calculateROI = asyncHandler(async (req, res) => {
  const result = await quotationService.calculateROI(req.params.quotationId);
  res.status(StatusCodes.OK).json(new ApiResponse(
    StatusCodes.OK,
    result,
    "ROI / IRR / NPV calculated"
  ));
});

// Convert quotation to baseline budget
export const convertToBaseline = asyncHandler(async (req, res) => {
  const baseline = await quotationService.convertToBaseline(req.params.quotationId);
  res.status(StatusCodes.OK).json(new ApiResponse(
    StatusCodes.OK,
    baseline,
    "Quotation converted to Baseline Budget"
  ));
});
