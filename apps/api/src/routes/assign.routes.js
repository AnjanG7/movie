import express from "express";
import {
  assignUser,
  getAllUsers,
  updateUserRole,
  removeUser,
} from "../controllers/assignproject/assignproject.controllers.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { authorizeRoles } from "../middlewares/rolemiddleware.js";

const router = express.Router({ mergeParams: true });

// Base: /api/projects/:projectId/users

// Assign user to project
router.post(
  "/",
  authMiddleware,
  authorizeRoles("Admin", "Producer"),
  assignUser
);

// Get all users in project (with pagination)
router.get(
  "/",
  authMiddleware,
  authorizeRoles("Admin", "Producer"),
  getAllUsers
);

// Update user's role in project
router.put(
  "/:email/role",
  authMiddleware,
  authorizeRoles("Admin", "Producer"),
  updateUserRole
);

// Remove user from project
router.delete(
  "/:email",
  authMiddleware,
  authorizeRoles("Admin", "Producer"),
  removeUser
);

export default router;
