import express from "express";
import * as ExpenseController from "../../src/controllers/expense/expense.controller.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
const router = express.Router();

router.post("/", authMiddleware, ExpenseController.createExpense);
router.put("/:expenseId", authMiddleware, ExpenseController.updateExpense);
router.delete("/:expenseId", authMiddleware, ExpenseController.deleteExpense);
router.get("/:expenseId", authMiddleware, ExpenseController.fetchExpense);
router.get(
  "/project/:projectId",
  authMiddleware,
  ExpenseController.fetchProjectExpenses
);
router.get(
  "/project/:projectId/summary",
  authMiddleware,
  ExpenseController.getProjectExpenseSummary
);

export default router;
