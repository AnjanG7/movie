import express from "express";
import {
  getDashboardProjectStats,
  getDashboardUserStats,
} from "../controllers/dashboard/dashboard.stats.js";
import { getBudgetOverview } from '../controllers/budget/budgetLine.controller.js';
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { authorizeRoles } from "../middlewares/rolemiddleware.js";

const router = express.Router();
router.get(
  "/projectStats",
  authMiddleware,
  authorizeRoles("Admin"),
  getDashboardProjectStats
);

router.get(
  "/userStats",
  authMiddleware,
  authorizeRoles("Admin"),
  getDashboardUserStats
);
router.get(
  '/overview',
  authMiddleware,
  authorizeRoles('Producer', 'Admin'),
  getBudgetOverview
);

export default router;
