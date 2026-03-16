import asyncHandler from "express-async-handler";
import { ExpenseService } from "../../services/expense/expense.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { StatusCodes } from "http-status-codes";

const expenseService = new ExpenseService();

// Create Expense
export const createExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.createExpense(req.body);
  res.status(StatusCodes.CREATED).json(
    new ApiResponse(StatusCodes.CREATED, expense, "Expense created successfully")
  );
});

// Update Expense
export const updateExpense = asyncHandler(async (req, res) => {
  const { expenseId } = req.params;
  const expense = await expenseService.updateExpense(expenseId, req.body);
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, expense, "Expense updated successfully")
  );
});

// Delete Expense
export const deleteExpense = asyncHandler(async (req, res) => {
  const { expenseId } = req.params;
  const result = await expenseService.deleteExpense(expenseId);
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, result, "Expense deleted successfully")
  );
});

// Fetch Single Expense
export const fetchExpense = asyncHandler(async (req, res) => {
  const { expenseId } = req.params;
  const expense = await expenseService.fetchExpense(expenseId);
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, expense, "Expense fetched successfully")
  );
});

// Fetch All Expenses for a Project
export const fetchProjectExpenses = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const expenses = await expenseService.fetchProjectExpenses(projectId);
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, expenses, "Project expenses fetched successfully")
  );
});

// Fetch Project Expense Summary with dynamic tax & contingency
export const getProjectExpenseSummary = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const taxRate = parseFloat(req.query.taxRate) || 0.1;
  const contingencyRate = parseFloat(req.query.contingencyRate) || 0.05;

  const summary = await expenseService.getProjectExpenseSummary(projectId, taxRate, contingencyRate);
  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, summary, "Project expense summary fetched successfully")
  );
});