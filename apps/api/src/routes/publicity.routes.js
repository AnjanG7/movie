import express from 'express';
import {
  createPublicityBudget,
  getPublicityBudgets,
  getPublicityBudget,
  updatePublicityBudget,
  deletePublicityBudget,
  getPublicityBudgetLines,
  addPublicityBudgetLine,
  updatePublicityBudgetLine,
  deletePublicityBudgetLine,
  addPublicityExpense,
  getPublicityExpenses,
  updatePublicityExpense,
  deletePublicityExpense,
  createCampaignEvent,
  getCampaignCalendar,
  getCampaignEvent,
  updateCampaignEvent,
  deleteCampaignEvent,
  getPublicitySummary,
  updateROIWithPublicity
} from '../controllers/publicity/publicity.controller.js';
import { authMiddleware } from '../middlewares/authmiddleware.js';
import { authorizeRoles } from '../middlewares/rolemiddleware.js';
import { authorizeProjectRoles } from '../middlewares/projectRoles.middlware.js';

const router = express.Router({ mergeParams: true });

// Base path: /api/projects/:projectId/publicity

// ==================== PUBLICITY BUDGET ROUTES ====================

router.post(
  '/budgets',
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  createPublicityBudget
);

router.get(
  '/budgets',
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  getPublicityBudgets
);

router.get(
  '/budgets/:publicityId',
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  getPublicityBudget
);

router.put(
  '/budgets/:id',
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  updatePublicityBudget
);

router.delete(
  '/budgets/:id',
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  deletePublicityBudget
);

// ==================== PUBLICITY BUDGET LINES (FROM MAIN BUDGET) ====================

router.get(
  '/budget-lines',
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  getPublicityBudgetLines
);

router.post(
  '/budget-lines',
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  addPublicityBudgetLine
);

router.put(
  '/budget-lines/:lineId',
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  updatePublicityBudgetLine
);

router.delete(
  '/budget-lines/:lineId',
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  deletePublicityBudgetLine
);

// ==================== EXPENSE ROUTES ====================

router.post(
  '/budgets/:budgetId/expenses',
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  addPublicityExpense
);

router.get(
  '/budgets/:budgetId/expenses',
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  getPublicityExpenses
);

router.put(
  '/expenses/:id',
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  updatePublicityExpense
);

router.delete(
  '/expenses/:id',
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  deletePublicityExpense
);

// ==================== CAMPAIGN CALENDAR ROUTES ====================

router.post(
  '/campaign',
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  createCampaignEvent
);

router.get(
  '/campaign',
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  getCampaignCalendar
);

router.get(
  '/campaign/:id',
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  getCampaignEvent
);

router.put(
  '/campaign/:id',
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  updateCampaignEvent
);

router.delete(
  '/campaign/:id',
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  deleteCampaignEvent
);

// ==================== REPORTS & ANALYTICS ====================

router.get(
  '/summary',
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  getPublicitySummary
);

router.post(
  '/update-roi',
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  updateROIWithPublicity
);

export default router;
