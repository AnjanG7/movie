import express from "express";
import {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  getPOBalance, // Add this
} from "../controllers/vendor/invoice.controller.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { authorizeRoles } from "../middlewares/rolemiddleware.js";
import { authorizeProjectRoles } from '../middlewares/projectRoles.middlware.js';

const router = express.Router({ mergeParams: true });

// Base: /api/invoices
router.post(
  "/",
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  createInvoice
);

router.get(
  "/",
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  getInvoices
);

router.get(
  "/:id",
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  getInvoice
);

router.patch(
  "/:id/status",
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  updateInvoiceStatus
);

router.delete(
  "/:id",
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  deleteInvoice
);

// NEW: Get PO balance information
router.get(
  "/po/:poId/balance",
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  getPOBalance
);

export default router;