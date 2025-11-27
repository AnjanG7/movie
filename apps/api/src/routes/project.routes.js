import express from "express";
import {
  createProject,
  assignProject,
  getAllProjects,
  fetchProject,
  deleteProject,
  updateProject,
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
  fetchProject  
);
router.put(
  "/:projectId",
  authMiddleware,
  authorizeRoles("Admin", "Producer"),
  updateProject
);

router.delete(
  "/:projectId",
  authMiddleware,
  authorizeRoles("Admin", "Producer"),
  deleteProject
);


export default router;
