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
import { authorizeProjectRoles } from "../middlewares/projectRoles.middlware.js";

const router = express.Router({ mergeParams: true });

// Base URL yo ho hai: /api/projects/:projectId/budget
router.post("/", authMiddleware,   authorizeProjectRoles("Producer", "LineProducer", "Accountant"), createBudgetVersion);
router.get("/", authMiddleware,  authorizeProjectRoles("Producer", "LineProducer", "Accountant"), getBudgetVersions);
router.put("/:versionId", authMiddleware,   authorizeProjectRoles("Producer", "LineProducer", "Accountant"), updateBudgetVersion);
router.delete("/:versionId", authMiddleware,   authorizeProjectRoles("Producer", "LineProducer", "Accountant"), deleteBudgetVersion);

router.post("/:versionId/lines", authMiddleware,  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),addLineItem);
router.put("/lines/:lineId", authMiddleware,   authorizeProjectRoles("Producer", "LineProducer", "Accountant"),updateLineItem);
router.delete("/lines/:lineId", authMiddleware,  authorizeProjectRoles("Producer", "LineProducer", "Accountant"), deleteLineItem);

router.post("/:versionId/lock", authMiddleware,   authorizeProjectRoles("Producer", "LineProducer", "Accountant"),lockBaseline);

export default router;
