import express from 'express';
import {
  exportQuotationPDF,
  exportCostReportPDF,
  exportCashflowReportPDF,
  exportWaterfallStatementPDF,
  exportPurchaseOrderPDF,
  exportInvoicePDF,
  exportBudgetSummaryPDF,
  exportProjectOverviewPDF,
} from '../controllers/export/export.controller.js';
import { authMiddleware } from '../middlewares/authmiddleware.js';
import { authorizeRoles } from '../middlewares/rolemiddleware.js';

const router = express.Router({ mergeParams: true });

// ============================================
// QUOTATION EXPORTS
// ============================================
// GET /api/projects/:projectId/quotations/:versionId/export/pdf
router.get(
  '/:versionId/export/pdf',
  authMiddleware,
  authorizeRoles('Admin', 'Producer', 'Investor'),
  exportQuotationPDF
);

// ============================================
// REPORT EXPORTS
// ============================================
// GET /api/projects/:projectId/reports/cost/export/pdf
router.get(
  '/:projectId/reports/cost/export/pdf',
  authMiddleware,
  authorizeRoles('Admin', 'Producer', 'Accountant'),
  exportCostReportPDF
);

// GET /api/projects/:projectId/reports/cashflow/export/pdf
router.get(
  '/:projectId/reports/cashflow/export/pdf',
  authMiddleware,
  authorizeRoles('Admin', 'Producer', 'Accountant'),
  exportCashflowReportPDF
);

// ============================================
// WATERFALL EXPORTS
// ============================================
// GET /api/projects/:projectId/waterfalls/:waterfallId/export/pdf
router.get(
  '/:projectId/waterfalls/:waterfallId/export/pdf',
  authMiddleware,
  authorizeRoles('Admin', 'Producer', 'Investor'),
  exportWaterfallStatementPDF
);

// ============================================
// PURCHASE ORDER EXPORTS
// ============================================
// GET /api/projects/:projectId/purchase-orders/:poId/export/pdf
router.get(
  '/:projectId/purchase-orders/:poId/export/pdf',
  authMiddleware,
  authorizeRoles('Admin', 'Producer', 'Line Producer', 'Accountant'),
  exportPurchaseOrderPDF
);

// ============================================
// INVOICE EXPORTS
// ============================================
// GET /api/invoices/:invoiceId/export/pdf
router.get(
  '/invoices/:invoiceId/export/pdf',
  authMiddleware,
  authorizeRoles('Admin', 'Producer', 'Accountant'),
  exportInvoicePDF
);

// ============================================
// BUDGET EXPORTS
// ============================================
// GET /api/projects/:projectId/budget/:versionId/export/pdf
router.get(
  '/:projectId/budget/:versionId/export/pdf',
  authMiddleware,
  authorizeRoles('Admin', 'Producer', 'Line Producer', 'Accountant', 'Investor'),
  exportBudgetSummaryPDF
);

// ============================================
// PROJECT OVERVIEW EXPORT
// ============================================
// GET /api/projects/:projectId/export/pdf
router.get(
  '/:projectId/export/pdf',
  authMiddleware,
  authorizeRoles('Admin', 'Producer', 'Investor'),
  exportProjectOverviewPDF
);

export default router;
