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
  deleteQuotation,
  updateQuotation,
} from '../controllers/quotation/quotation.controller.js';
import { authMiddleware } from '../middlewares/authmiddleware.js';
import { authorizeRoles } from '../middlewares/rolemiddleware.js';

const router = express.Router({ mergeParams: true });

// Base: /api/projects/:projectId/quotations

// Create new quotation
router.post(
  '/',
  authMiddleware,
  authorizeRoles("Admin",'Producer'),
  createQuotation
);

// Get all quotations for project
router.get(
  '/',
  authMiddleware,
  authorizeRoles("Admin",'Producer', 'Line Producer', 'Accountant', 'Investor'),
  getQuotations
);

// Get specific quotation
router.get(
  '/:id',
  authMiddleware,
  authorizeRoles("Admin",'Producer', 'Line Producer', 'Accountant', 'Investor'),
  getQuotation
);

// Update assumptions
router.patch(
  '/:id/assumptions',
  authMiddleware,
  authorizeRoles("Admin",'Producer'),
  updateAssumptions
);

// Add cost line
router.post(
  '/:id/lines',
  authMiddleware,
  authorizeRoles("Admin",'Producer', 'Line Producer'),
  addCostLine
);

// Update cost line
router.patch(
  '/:id/lines/:lineId',
  authMiddleware,
  authorizeRoles("Admin",'Producer', 'Line Producer'),
  updateCostLine
);

// Delete cost line
router.delete(
  '/:id/lines/:lineId',
  authMiddleware,
  authorizeRoles("Admin",'Producer'),
  deleteCostLine
);

// Update financing plan
router.patch(
  '/:id/financing',
  authMiddleware,
  authorizeRoles("Admin",'Producer'),
  updateFinancingPlan
);

// Update revenue model
router.patch(
  '/:id/revenue',
  authMiddleware,
  authorizeRoles("Admin",'Producer'),
  updateRevenueModel
);

// Calculate metrics (ROI, IRR, NPV)
router.post(
  '/:id/calculate',
  authMiddleware,
  authorizeRoles("Admin",'Producer', 'Investor'),
  calculateMetrics
);

// Convert to baseline budget
router.post(
  '/:id/convert-to-baseline',
  authMiddleware,
  authorizeRoles("Admin",'Producer'),
  convertToBaseline
);
//update quotation
router.put(
  '/:id',
  authMiddleware,
  authorizeRoles("Admin",'Producer'),
  updateQuotation
);
router.delete(
  '/:id',
  authMiddleware,
  authorizeRoles("Admin",'Producer'),
  deleteQuotation
);

export default router;
