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
import { authorizeProjectRoles } from "../middlewares/projectRoles.middlware.js";

const router = express.Router({ mergeParams: true });
// Create a new waterfall
router.post("/", authMiddleware, authorizeRoles("Admin","Producer"), createWaterfall);
router.get(
  "/:id",
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  getWaterfallById
);
router.get(
  "/",
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  getWaterfallByProject
);


// Add tiers to a waterfall
router.post("/:id/tiers", authMiddleware,authorizeProjectRoles("Producer", "LineProducer", "Accountant"),addTiers);

// Update a tier

router.put(
  "/tiers/:tierId",
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  updateTier
);

// Delete a tier
router.delete(
  "/tiers/:tierId",
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  deleteTier
);

// Add participants to a waterfall
router.post(
  "/:id/participants",
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  addParticipants
);
// Update a participant
router.put(
  "/participants/:participantId",
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  updateParticipant
);

// Delete a participant
router.delete(
  "/participants/:participantId",
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  deleteParticipant
);

// Add revenue period
router.post(
  "/:id/periods",
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  addRevenuePeriod
);

// Update a revenue period
router.put(
  "/periods/:periodId",
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  updatePeriod
);

// Delete a revenue period
router.delete(
  "/periods/:periodId",
  authMiddleware,
 authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  deletePeriod
);

// Calculate distributions
router.post(
  "/:id/distribution",
  authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  calculateDistribution
);

router.get("/:id/payouts", authMiddleware, authorizeProjectRoles("Producer", "LineProducer", "Accountant"), getPayouts);

export default router;
