import express from "express";
import {
  createBudgetVersion,
  getBudgetVersions,
  addLineItem,
  updateLineItem,
  deleteLineItem,
  lockBaseline,
} from "../controllers/budget/budgetVersion.controller.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { authorizeRoles } from "../middlewares/rolemiddleware.js";

const router = express.Router({ mergeParams: true });

// Base URL yo ho hai: /api/projects/:projectId/budget
router.post("/", authMiddleware, authorizeRoles("Producer"), createBudgetVersion);
router.get("/", authMiddleware, authorizeRoles("Producer","Investor"), getBudgetVersions);

router.post("/:versionId/lines", authMiddleware, authorizeRoles("Line Producer"), addLineItem);
router.put("/lines/:lineId", authMiddleware, authorizeRoles("Line Producer"), updateLineItem);
router.delete("/lines/:lineId", authMiddleware, authorizeRoles("Line Producer"), deleteLineItem);

router.post("/:versionId/lock", authMiddleware, authorizeRoles("Producer"), lockBaseline);

export default router;
