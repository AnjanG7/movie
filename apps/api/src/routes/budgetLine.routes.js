import express from 'express';
import {
  getBudgetLines,
  getVarianceReport,
} from '../controllers/budget/budgetLine.controller.js';
import { authMiddleware } from '../middlewares/authmiddleware.js';
import { authorizeRoles } from '../middlewares/rolemiddleware.js';

const router = express.Router({ mergeParams: true });

// Base: /api/projects/:projectId/budget-lines
router.get(
  '/',
  authMiddleware,
  authorizeRoles('Producer', 'Line Producer','Admin'),
  getBudgetLines
);

router.get(
  '/variance-report',
  authMiddleware,
  authorizeRoles('Producer', 'Line Producer', 'Admin'),
  getVarianceReport
);

export default router;