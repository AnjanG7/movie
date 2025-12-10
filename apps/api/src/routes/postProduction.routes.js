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
  authorizeRoles("Admin",'Producer', 'Line Producer'),
  createPostTask
);

router.get(
  '/tasks',
  authMiddleware,
  authorizeRoles("Admin",'Producer', 'Line Producer', 'Accountant'),
  getPostTasks
);

router.get(
  '/tasks/:id',
  authMiddleware,
  authorizeRoles("Admin",'Producer', 'Line Producer', 'Accountant'),
  getPostTask
);

router.put(
  '/tasks/:id',
  authMiddleware,
  authorizeRoles("Admin",'Producer', 'Line Producer'),
  updatePostTask
);

router.delete(
  '/tasks/:id',
  authMiddleware,
  authorizeRoles("Admin",'Producer'),
  deletePostTask
);

// ==================== BUDGET LINES ====================
router.get(
  '/budget-lines',
  authMiddleware,
  authorizeRoles("Admin",'Producer', 'Line Producer', 'Accountant'),
  getPostBudgetLines
);

router.post(
  '/budget-lines',
  authMiddleware,
  authorizeRoles("Admin",'Producer', 'Line Producer'),
  addPostBudgetLine
);

// ==================== FORECASTING ====================
router.get(
  '/forecast',
  authMiddleware,
  authorizeRoles('"Admin",Producer', 'Line Producer', 'Accountant', 'Investor'),
  getPostProductionForecast
);

router.post(
  '/update-roi',
  authMiddleware,
  authorizeRoles("Admin",'Producer'),
  updateROIWithPostProduction
);

export default router;
