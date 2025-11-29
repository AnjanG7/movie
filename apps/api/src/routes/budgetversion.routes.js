import express from "express";
import {
  createBudgetVersion,
  getBudgetVersions,
  addLineItem,
  updateLineItem,
  deleteLineItem,
  lockBaseline,
  updateBudgetVersion,
  deleteBudgetVersion
} from "../controllers/budget/budgetVersion.controller.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { authorizeRoles } from "../middlewares/rolemiddleware.js";

const router = express.Router({ mergeParams: true });

// Base URL yo ho hai: /api/projects/:projectId/budget
router.post("/", authMiddleware, authorizeRoles("Producer"), createBudgetVersion);
router.get("/", authMiddleware, authorizeRoles("Producer","Investor"), getBudgetVersions);
router.put("/:versionId", authMiddleware, authorizeRoles("Producer"), updateBudgetVersion);
router.delete("/:versionId", authMiddleware, authorizeRoles("Producer"), deleteBudgetVersion);

router.post("/:versionId/lines", authMiddleware, authorizeRoles("Producer","Line Producer"), addLineItem);
router.put("/lines/:lineId", authMiddleware, authorizeRoles("Producer","Line Producer"), updateLineItem);
router.delete("/lines/:lineId", authMiddleware, authorizeRoles("Producer","Line Producer"), deleteLineItem);

router.post("/:versionId/lock", authMiddleware, authorizeRoles("Producer"), lockBaseline);

export default router;
