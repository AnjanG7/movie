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

const router = express.Router();

// Base: /api/invoices
router.post(
  "/",
  authMiddleware,
  authorizeRoles("Producer", "Line Producer", "Accountant"),
  createInvoice
);

router.get(
  "/",
  authMiddleware,
  authorizeRoles("Producer", "Line Producer", "Accountant"),
  getInvoices
);

router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("Producer", "Line Producer", "Accountant"),
  getInvoice
);

router.patch(
  "/:id/status",
  authMiddleware,
  authorizeRoles("Producer", "Accountant"),
  updateInvoiceStatus
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("Producer"),
  deleteInvoice
);

// NEW: Get PO balance information
router.get(
  "/po/:poId/balance",
  authMiddleware,
  authorizeRoles("Producer", "Line Producer", "Accountant"),
  getPOBalance
);

export default router;
