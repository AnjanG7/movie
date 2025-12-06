import express from "express";
import {
  createWaterfall,
  addTiers,
  addParticipants,
  addRevenuePeriod,
  calculateDistribution,
  updatePeriod,
  updateParticipant,
  updateTier,
  getWaterfallByProject,
  deleteParticipant,
  getWaterfallById,
  deleteTier,
  deletePeriod,
} from "../controllers/waterfall/waterfall.controller.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { authorizeRoles } from "../middlewares/rolemiddleware.js";

const router = express.Router({ mergeParams: true });
// Create a new waterfall
router.post("/", authMiddleware, authorizeRoles("Producer"), createWaterfall);
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("Producer", "Investor"),
  getWaterfallById
);
router.get(
  "/project",
  authMiddleware,
  authorizeRoles("Producer", "Investor"),
  getWaterfallByProject
);

// Add tiers to a waterfall
router.post("/:id/tiers", authMiddleware, authorizeRoles("Producer"), addTiers);

// Update a tier

router.put(
  "/tiers/:tierId",
  authMiddleware,
  authorizeRoles("Producer"),
  updateTier
);

// Delete a tier
router.delete(
  "/tiers/:tierId",
  authMiddleware,
  authorizeRoles("Producer"),
  deleteTier
);

// Add participants to a waterfall
router.post(
  "/:id/participants",
  authMiddleware,
  authorizeRoles("Producer"),
  addParticipants
);
// Update a participant
router.put(
  "/participants/:participantId",
  authMiddleware,
  authorizeRoles("Producer"),
  updateParticipant
);

// Delete a participant
router.delete(
  "/participants/:participantId",
  authMiddleware,
  authorizeRoles("Producer"),
  deleteParticipant
);

// Add revenue period
router.post(
  "/:id/periods",
  authMiddleware,
  authorizeRoles("Producer"),
  addRevenuePeriod
);

// Update a revenue period
router.put(
  "/periods/:periodId",
  authMiddleware,
  authorizeRoles("Producer"),
  updatePeriod
);

// Delete a revenue period
router.delete(
  "/periods/:periodId",
  authMiddleware,
  authorizeRoles("Producer"),
  deletePeriod
);

// Calculate distributions
router.get(
  "/:id/distribution",
  authMiddleware,
  authorizeRoles("Producer", "Investor"),
  calculateDistribution
);

export default router;
