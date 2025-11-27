import asyncHandler from 'express-async-handler';
import { PublicityService } from '../../services/publicity/publicity.service.js';
import { ApiResponse } from "../../utils/ApiResponse.js";
import { StatusCodes } from "http-status-codes";

const publicityService = new PublicityService();

// ==================== PUBLICITY BUDGET ====================

export const createPublicityBudget = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const budget = await publicityService.createPublicityBudget(projectId, req.body);
  
  res.status(StatusCodes.CREATED).json(
    new ApiResponse(StatusCodes.CREATED, budget, 'Publicity budget created successfully')
  );
});

export const getPublicityBudgets = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const result = await publicityService.getPublicityBudgets(projectId, req.query);
  
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, result, 'Publicity budgets fetched successfully')
  );
});

export const getPublicityBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const budget = await publicityService.getPublicityBudget(id);
  
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, budget, 'Publicity budget fetched successfully')
  );
});

export const updatePublicityBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = await publicityService.updatePublicityBudget(id, req.body);
  
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, updated, 'Publicity budget updated successfully')
  );
});

export const deletePublicityBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await publicityService.deletePublicityBudget(id);
  
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, result, 'Publicity budget deleted successfully')
  );
});

// ==================== EXPENSES ====================

export const addPublicityExpense = asyncHandler(async (req, res) => {
  const { budgetId } = req.params;
  const expense = await publicityService.addPublicityExpense(budgetId, req.body);
  
  res.status(StatusCodes.CREATED).json(
    new ApiResponse(StatusCodes.CREATED, expense, 'Expense added successfully')
  );
});

export const getPublicityExpenses = asyncHandler(async (req, res) => {
  const { budgetId } = req.params;
  const result = await publicityService.getPublicityExpenses(budgetId);
  
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, result, 'Expenses fetched successfully')
  );
});

export const updatePublicityExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = await publicityService.updatePublicityExpense(id, req.body);
  
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, updated, 'Expense updated successfully')
  );
});

export const deletePublicityExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await publicityService.deletePublicityExpense(id);
  
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, result, 'Expense deleted successfully')
  );
});

// ==================== CAMPAIGN CALENDAR ====================

export const createCampaignEvent = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const event = await publicityService.createCampaignEvent(projectId, req.body);
  
  res.status(StatusCodes.CREATED).json(
    new ApiResponse(StatusCodes.CREATED, event, 'Campaign event created successfully')
  );
});

export const getCampaignCalendar = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const events = await publicityService.getCampaignCalendar(projectId, req.query);
  
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, events, 'Campaign calendar fetched successfully')
  );
});

export const getCampaignEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = await publicityService.getCampaignEvent(id);
  
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, event, 'Campaign event fetched successfully')
  );
});

export const updateCampaignEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = await publicityService.updateCampaignEvent(id, req.body);
  
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, updated, 'Campaign event updated successfully')
  );
});

export const deleteCampaignEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await publicityService.deleteCampaignEvent(id);
  
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, result, 'Campaign event deleted successfully')
  );
});

// ==================== REPORTS ====================

export const getPublicitySummary = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const summary = await publicityService.getPublicitySummary(projectId);
  
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, summary, 'Publicity summary fetched successfully')
  );
});

export const updateROIWithPublicity = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const metrics = await publicityService.updateROIWithPublicity(projectId);
  
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, metrics, 'ROI updated with publicity data successfully')
  );
});
