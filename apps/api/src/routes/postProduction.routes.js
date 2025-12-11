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
import { authorizeProjectRoles } from '../middlewares/projectRoles.middlware.js';

const router = express.Router({ mergeParams: true });

// Base: /api/projects/:projectId/post-production

// ==================== TASKS ====================
router.post(
  '/tasks',
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  createPostTask
);

router.get(
  '/tasks',
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  getPostTasks
);

router.get(
  '/tasks/:id',
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  getPostTask
);

router.put(
  '/tasks/:id',
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  updatePostTask
);

router.delete(
  '/tasks/:id',
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  deletePostTask
);

// ==================== BUDGET LINES ====================
router.get(
  '/budget-lines',
  authMiddleware,
 authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  getPostBudgetLines
);

router.post(
  '/budget-lines',
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  addPostBudgetLine
);

// ==================== FORECASTING ====================
router.get(
  '/forecast',
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  getPostProductionForecast
);

router.post(
  '/update-roi',
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  updateROIWithPostProduction
);

export default router;
