import express from "express";
import {
  createProject,
  assignProject,
  getAllProjects,
  fetchProject,
} from "../controllers/project/project.controller.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { authorizeRoles } from "../middlewares/rolemiddleware.js";

const router = express.Router();


router.post(
  "/create",
  authMiddleware,
  authorizeRoles("Admin", "Producer"),
  createProject
);

router.put(
  "/assign",
  authMiddleware,
  authorizeRoles("Admin","Producer"),
  assignProject
);

router.get(
  "/",
  authMiddleware,
  authorizeRoles("Admin", "Producer"),
  getAllProjects
);

router.get(
  "/:projectId",
  authMiddleware,
  authorizeRoles("Admin", "Producer"),
  fetchProject   // <-- Add this controller
);


export default router;
