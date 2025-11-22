import express from "express";
import {
  createWaterfall,
  addTiers,
  addParticipants,
  addRevenuePeriod,
  calculateDistribution
} from "../controllers/waterfall/waterfall.controller.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { authorizeRoles } from "../middlewares/rolemiddleware.js";

const router = express.Router({ mergeParams: true }); 
// Create a new waterfall
router.post("/", authMiddleware, authorizeRoles("Producer"), createWaterfall);

// Add tiers to a waterfall
router.post("/:id/tiers", authMiddleware, authorizeRoles("Producer"), addTiers);

// Add participants to a waterfall
router.post("/:id/participants", authMiddleware, authorizeRoles("Producer"), addParticipants);

// Add revenue period
router.post("/:id/periods", authMiddleware, authorizeRoles("Producer"), addRevenuePeriod);

// Calculate distributions
router.get("/:id/distribution", authMiddleware, authorizeRoles("Producer", "Investor"), calculateDistribution);

export default router;
