import express from 'express';
import {
  createPostTask,
  getPostTasks,
  getPostTask,
  updatePostTask,
  deletePostTask,
  getPostBudgetLines,
  addPostBudgetLine,
  getPostProductionForecast,
  updateROIWithPostProduction
} from '../controllers/postProduction/postProduction.controller.js';
import { authMiddleware } from '../middlewares/authmiddleware.js';
import { authorizeRoles } from '../middlewares/rolemiddleware.js';

const router = express.Router({ mergeParams: true });

// Base: /api/projects/:projectId/post-production

// ==================== TASKS ====================
router.post(
  '/tasks',
  authMiddleware,
  authorizeRoles('Producer', 'Line Producer'),
  createPostTask
);

router.get(
  '/tasks',
  authMiddleware,
  authorizeRoles('Producer', 'Line Producer', 'Accountant'),
  getPostTasks
);

router.get(
  '/tasks/:id',
  authMiddleware,
  authorizeRoles('Producer', 'Line Producer', 'Accountant'),
  getPostTask
);

router.put(
  '/tasks/:id',
  authMiddleware,
  authorizeRoles('Producer', 'Line Producer'),
  updatePostTask
);

router.delete(
  '/tasks/:id',
  authMiddleware,
  authorizeRoles('Producer'),
  deletePostTask
);

// ==================== BUDGET LINES ====================
router.get(
  '/budget-lines',
  authMiddleware,
  authorizeRoles('Producer', 'Line Producer', 'Accountant'),
  getPostBudgetLines
);

router.post(
  '/budget-lines',
  authMiddleware,
  authorizeRoles('Producer', 'Line Producer'),
  addPostBudgetLine
);

// ==================== FORECASTING ====================
router.get(
  '/forecast',
  authMiddleware,
  authorizeRoles('Producer', 'Line Producer', 'Accountant', 'Investor'),
  getPostProductionForecast
);

router.post(
  '/update-roi',
  authMiddleware,
  authorizeRoles('Producer'),
  updateROIWithPostProduction
);

export default router;
