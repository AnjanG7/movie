import prisma from "../../utils/prismaClient.js";
import { ApiError } from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";

export class ExpenseService {

  async createExpense(data) {
    const { projectId, category, itemName, preProduction = 0, production = 0, postProduction = 0, notes } = data;

    const totalAmount = preProduction + production + postProduction;

    const expense = await prisma.expense.create({
      data: {
        projectId,
        category,
        itemName,
        preProduction,
        production,
        postProduction,
        totalAmount,
        notes,
      },
    });

    return expense;
  }

  /// Update expense
  async updateExpense(expenseId, data) {
    const { category, itemName, preProduction = 0, production = 0, postProduction = 0, notes } = data;

    const totalAmount = preProduction + production + postProduction;

    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        category,
        itemName,
        preProduction,
        production,
        postProduction,
        totalAmount,
        notes,
      },
    });

    return expense;
  }

  async deleteExpense(expenseId) {
    await prisma.expense.delete({ where: { id: expenseId } });
    return { message: "Expense deleted successfully" };
  }

  async fetchExpense(expenseId) {
    const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
    if (!expense) throw new ApiError(StatusCodes.NOT_FOUND, "Expense not found");
    return expense;
  }


  async fetchProjectExpenses(projectId) {
    return await prisma.expense.findMany({ where: { projectId } });
  }

  async getProjectExpenseSummary(projectId, taxRate = 0.1, contingencyRate = 0.05) {
    const itemTotals = await prisma.expense.groupBy({
      by: ["category", "itemName"],
      _sum: { preProduction: true, production: true, postProduction: true, totalAmount: true },
      where: { projectId },
    });

    const categorySummary = {};
    let grandTotalPre = 0;
    let grandTotalProd = 0;
    let grandTotalPost = 0;
    let grandTotalAmount = 0;

    itemTotals.forEach(item => {
      const { category, itemName, _sum } = item;
      if (!categorySummary[category]) {
        categorySummary[category] = {
          items: [],
          categoryTotalPre: 0,
          categoryTotalProd: 0,
          categoryTotalPost: 0,
          categoryTotalAmount: 0
        };
      }

      categorySummary[category].items.push({
        itemName,
        preProduction: _sum.preProduction || 0,
        production: _sum.production || 0,
        postProduction: _sum.postProduction || 0,
        totalAmount: _sum.totalAmount || 0
      });

      categorySummary[category].categoryTotalPre += _sum.preProduction || 0;
      categorySummary[category].categoryTotalProd += _sum.production || 0;
      categorySummary[category].categoryTotalPost += _sum.postProduction || 0;
      categorySummary[category].categoryTotalAmount += _sum.totalAmount || 0;

      grandTotalPre += _sum.preProduction || 0;
      grandTotalProd += _sum.production || 0;
      grandTotalPost += _sum.postProduction || 0;
      grandTotalAmount += _sum.totalAmount || 0;
    });

    const taxAmount = grandTotalAmount * (taxRate || 0);
    const contingencyAmount = grandTotalAmount * (contingencyRate || 0);
    const finalTotal = grandTotalAmount + taxAmount + contingencyAmount;

    return {
      categorySummary,
      grandTotals: {
        preProduction: grandTotalPre,
        production: grandTotalProd,
        postProduction: grandTotalPost,
        totalAmount: grandTotalAmount
      },
      taxAmount,
      contingencyAmount,
      finalTotal
    };
  }
}