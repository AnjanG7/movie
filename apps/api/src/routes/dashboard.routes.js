import express from "express";
import { getDashboardStats } from "../controllers/dashboard/dashboard.stats.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { authorizeRoles } from "../middlewares/rolemiddleware.js";

const router = express.Router();
router.get(
  "/stats",
  authMiddleware,
  authorizeRoles("Admin"),
  getDashboardStats
);
export default router;
