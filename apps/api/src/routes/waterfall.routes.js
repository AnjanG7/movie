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
  getPayouts
} from "../controllers/waterfall/waterfall.controller.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { authorizeRoles } from "../middlewares/rolemiddleware.js";

const router = express.Router({ mergeParams: true });
// Create a new waterfall
router.post("/", authMiddleware, authorizeRoles("Admin","Producer"), createWaterfall);
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("Admin","Producer", "Investor"),
  getWaterfallById
);
router.get(
  "/",
  authMiddleware,
  authorizeRoles("Admin","Producer", "Investor"),
  getWaterfallByProject
);


// Add tiers to a waterfall
router.post("/:id/tiers", authMiddleware, authorizeRoles("Admin","Producer"), addTiers);

// Update a tier

router.put(
  "/tiers/:tierId",
  authMiddleware,
  authorizeRoles("Admin","Producer"),
  updateTier
);

// Delete a tier
router.delete(
  "/tiers/:tierId",
  authMiddleware,
  authorizeRoles("Admin","Producer"),
  deleteTier
);

// Add participants to a waterfall
router.post(
  "/:id/participants",
  authMiddleware,
  authorizeRoles("Admin","Producer"),
  addParticipants
);
// Update a participant
router.put(
  "/participants/:participantId",
  authMiddleware,
  authorizeRoles("Admin","Producer"),
  updateParticipant
);

// Delete a participant
router.delete(
  "/participants/:participantId",
  authMiddleware,
  authorizeRoles("Admin","Producer"),
  deleteParticipant
);

// Add revenue period
router.post(
  "/:id/periods",
  authMiddleware,
  authorizeRoles("Admin","Producer"),
  addRevenuePeriod
);

// Update a revenue period
router.put(
  "/periods/:periodId",
  authMiddleware,
  authorizeRoles("Admin","Producer"),
  updatePeriod
);

// Delete a revenue period
router.delete(
  "/periods/:periodId",
  authMiddleware,
  authorizeRoles("Admin","Producer"),
  deletePeriod
);

// Calculate distributions
router.post(
  "/:id/distribution",
  authMiddleware,
  authorizeRoles("Admin","Producer", "Investor"),
  calculateDistribution
);

router.get("/:id/payouts", authMiddleware, authorizeRoles("Admin","Producer", "Investor"), getPayouts);

export default router;
