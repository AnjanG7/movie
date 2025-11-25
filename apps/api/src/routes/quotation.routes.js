import express from 'express';
import {
  createQuotation,
  getQuotations,
  getQuotation,
  updateAssumptions,
  addCostLine,
  updateCostLine,
  deleteCostLine,
  updateFinancingPlan,
  updateRevenueModel,
  calculateMetrics,
  convertToBaseline,
} from '../controllers/quotation/quotation.controller.js';
import { authMiddleware } from '../middlewares/authmiddleware.js';
import { authorizeRoles } from '../middlewares/rolemiddleware.js';

const router = express.Router({ mergeParams: true });

// Base: /api/projects/:projectId/quotations

// Create new quotation
router.post(
  '/',
  authMiddleware,
  authorizeRoles('Producer'),
  createQuotation
);

// Get all quotations for project
router.get(
  '/',
  authMiddleware,
  authorizeRoles('Producer', 'Line Producer', 'Accountant', 'Investor'),
  getQuotations
);

// Get specific quotation
router.get(
  '/:id',
  authMiddleware,
  authorizeRoles('Producer', 'Line Producer', 'Accountant', 'Investor'),
  getQuotation
);

// Update assumptions
router.patch(
  '/:id/assumptions',
  authMiddleware,
  authorizeRoles('Producer'),
  updateAssumptions
);

// Add cost line
router.post(
  '/:id/lines',
  authMiddleware,
  authorizeRoles('Producer', 'Line Producer'),
  addCostLine
);

// Update cost line
router.patch(
  '/:id/lines/:lineId',
  authMiddleware,
  authorizeRoles('Producer', 'Line Producer'),
  updateCostLine
);

// Delete cost line
router.delete(
  '/:id/lines/:lineId',
  authMiddleware,
  authorizeRoles('Producer'),
  deleteCostLine
);

// Update financing plan
router.patch(
  '/:id/financing',
  authMiddleware,
  authorizeRoles('Producer'),
  updateFinancingPlan
);

// Update revenue model
router.patch(
  '/:id/revenue',
  authMiddleware,
  authorizeRoles('Producer'),
  updateRevenueModel
);

// Calculate metrics (ROI, IRR, NPV)
router.post(
  '/:id/calculate',
  authMiddleware,
  authorizeRoles('Producer', 'Investor'),
  calculateMetrics
);

// Convert to baseline budget
router.post(
  '/:id/convert-to-baseline',
  authMiddleware,
  authorizeRoles('Producer'),
  convertToBaseline
);

export default router;
