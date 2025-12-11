import express from 'express';
import {
  calculateROI,
  generateScenarios,
  getMetrics,
} from '../controllers/quotation/roi.controller.js';
import { authMiddleware } from '../middlewares/authmiddleware.js';
import { authorizeRoles } from '../middlewares/rolemiddleware.js';
import { authorizeProjectRoles } from '../middlewares/projectRoles.middlware.js';

const router = express.Router({ mergeParams: true });

// POST /api/projects/:projectId/quotations/:versionId/calculate-roi
router.post(
  '/:versionId/calculate-roi',
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  calculateROI
);

// POST /api/projects/:projectId/quotations/:versionId/scenarios
router.post(
  '/:versionId/scenarios',
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  generateScenarios
);

// GET /api/projects/:projectId/quotations/:versionId/metrics
router.get(
  '/:versionId/metrics',
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  getMetrics
);

export default router;
