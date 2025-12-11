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
import { authorizeProjectRoles } from '../middlewares/projectRoles.middlware.js';

const router = express.Router({ mergeParams: true });

// Base: /api/projects/:projectId/quotations

// Create new quotation
router.post(
  '/',
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  createQuotation
);

// Get all quotations for project
router.get(
  '/',
  authMiddleware,
 authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  getQuotations
);

// Get specific quotation
router.get(
  '/:id',
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  getQuotation
);

// Update assumptions
router.patch(
  '/:id/assumptions',
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  updateAssumptions
);

// Add cost line
router.post(
  '/:id/lines',
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  addCostLine
);

// Update cost line
router.patch(
  '/:id/lines/:lineId',
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  updateCostLine
);

// Delete cost line
router.delete(
  '/:id/lines/:lineId',
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  deleteCostLine
);

// Update financing plan
router.patch(
  '/:id/financing',
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  updateFinancingPlan
);

// Update revenue model
router.patch(
  '/:id/revenue',
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  updateRevenueModel
);

// Calculate metrics (ROI, IRR, NPV)
router.post(
  '/:id/calculate',
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  calculateMetrics
);

// Convert to baseline budget
router.post(
  '/:id/convert-to-baseline',
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  convertToBaseline
);
//update quotation
router.put(
  '/:id',
  authMiddleware,
 authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  updateQuotation
);
router.delete(
  '/:id',
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  deleteQuotation
);

export default router;
