import express from 'express';
import {
  createPublicityBudget,
  getPublicityBudgets,
  getPublicityBudget,
  updatePublicityBudget,
  deletePublicityBudget,
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

const router = express.Router({ mergeParams: true });

// Base path: /api/projects/:projectId/publicity

// Publicity Budget Routes
router.post(
  '/budgets',
  authMiddleware,
  authorizeRoles("Admin",'Producer', 'Line Producer'),
  createPublicityBudget
);

router.get(
  '/budgets',
  authMiddleware,
  authorizeRoles("Admin",'Producer', 'Line Producer', 'Accountant', 'Investor'),
  getPublicityBudgets
);

router.get(
  '/budgets/:id',
  authMiddleware,
  authorizeRoles("Admin",'Producer', 'Line Producer', 'Accountant', 'Investor'),
  getPublicityBudget
);

router.put(
  '/budgets/:id',
  authMiddleware,
  authorizeRoles("Admin",'Producer', 'Line Producer'),
  updatePublicityBudget
);

router.delete(
  '/budgets/:id',
  authMiddleware,
  authorizeRoles("Admin",'Producer'),
  deletePublicityBudget
);

// Expense Routes
router.post(
  '/budgets/:budgetId/expenses',
  authMiddleware,
  authorizeRoles("Admin",'Producer', 'Line Producer', 'Accountant'),
  addPublicityExpense
);

router.get(
  '/budgets/:budgetId/expenses',
  authMiddleware,
  authorizeRoles("Admin",'Producer', 'Line Producer', 'Accountant', 'Investor'),
  getPublicityExpenses
);

router.put(
  '/expenses/:id',
  authMiddleware,
  authorizeRoles("Admin",'Producer', 'Line Producer', 'Accountant'),
  updatePublicityExpense
);

router.delete(
  '/expenses/:id',
  authMiddleware,
  authorizeRoles("Admin",'Producer', 'Accountant'),
  deletePublicityExpense
);

// Campaign Calendar Routes
router.post(
  '/campaign',
  authMiddleware,
  authorizeRoles("Admin",'Producer', 'Line Producer'),
  createCampaignEvent
);

router.get(
  '/campaign',
  authMiddleware,
  authorizeRoles("Admin",'Producer', 'Line Producer', 'Accountant', 'Investor'),
  getCampaignCalendar
);

router.get(
  '/campaign/:id',
  authMiddleware,
  authorizeRoles("Admin",'Producer', 'Line Producer', 'Accountant', 'Investor'),
  getCampaignEvent
);

router.put(
  '/campaign/:id',
  authMiddleware,
  authorizeRoles("Admin",'Producer', 'Line Producer'),
  updateCampaignEvent
);

router.delete(
  '/campaign/:id',
  authMiddleware,
  authorizeRoles("Admin",'Producer'),
  deleteCampaignEvent
);

// Reports & Analytics
router.get(
  '/summary',
  authMiddleware,
  authorizeRoles("Admin",'Producer', 'Line Producer', 'Accountant', 'Investor'),
  getPublicitySummary
);

router.post(
  '/update-roi',
  authMiddleware,
  authorizeRoles("Admin",'Producer'),
  updateROIWithPublicity
);

export default router;
