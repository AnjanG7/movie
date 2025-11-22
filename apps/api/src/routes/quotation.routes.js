import express from "express";
import {
  createQuotation,
  getQuotations,
  addAssumptions,
  calculateROI,
  convertToBaseline
} from "../controllers/quotation/quotation.controller.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { authorizeRoles } from "../middlewares/rolemiddleware.js";

const router = express.Router({ mergeParams: true });

// Base URL: /api/projects/:projectId/quotations
router.post("/", authMiddleware, authorizeRoles("Producer"), createQuotation);
router.get("/", authMiddleware, authorizeRoles("Producer", "Investor"), getQuotations);

router.post("/:quotationId/assumptions", authMiddleware, authorizeRoles("Producer"), addAssumptions);
router.get("/:quotationId/calculate", authMiddleware, authorizeRoles("Producer"), calculateROI);

router.post("/:quotationId/convert", authMiddleware, authorizeRoles("Producer"), convertToBaseline);

export default router;
