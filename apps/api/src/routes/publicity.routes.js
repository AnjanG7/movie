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
import { authorizeProjectRoles } from '../middlewares/projectRoles.middlware.js';

const router = express.Router({ mergeParams: true });

// Base path: /api/projects/:projectId/publicity

// Publicity Budget Routes
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
  '/budgets/:id',
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

// Expense Routes
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

// Campaign Calendar Routes
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

// Reports & Analytics
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
