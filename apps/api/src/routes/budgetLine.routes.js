import express from 'express';
import {
  getBudgetLines,
  getVarianceReport,
} from '../controllers/budget/budgetLine.controller.js';
import { authMiddleware } from '../middlewares/authmiddleware.js';
import { authorizeRoles } from '../middlewares/rolemiddleware.js';
import { authorizeProjectRoles } from '../middlewares/projectRoles.middlware.js';

const router = express.Router({ mergeParams: true });

// Base: /api/projects/:projectId/budget-lines
router.get(
  '/',
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  getBudgetLines
);

router.get(
  '/variance-report',
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  getVarianceReport
);

export default router;