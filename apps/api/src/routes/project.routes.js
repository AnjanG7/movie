import express from "express";
import {
  createProject,
  assignProject,
  getAllProjects,
  fetchProject,
  deleteProject,
  updateProject,
  changeProjectPhase,
  getProjectsByPhaseSummary,
  getAllActiveProjects,
} from "../controllers/project/project.controller.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { authorizeRoles } from "../middlewares/rolemiddleware.js";
import { authorizeProjectRoles } from "../middlewares/projectRoles.middlware.js";

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  authorizeRoles("Admin", "Producer"),
  createProject
);
router.put(
  "/:projectId/phase",
  authMiddleware,
  authorizeRoles("Admin", "Producer"),
  changeProjectPhase
);
router.put(
  "/assign",
  authMiddleware,
  authorizeRoles("Admin", "Producer"),
  assignProject
);

router.get("/", authMiddleware, getAllProjects);
router.get(
  "/active",
  authMiddleware,
    authorizeRoles("Admin", "Producer"),
  getAllActiveProjects
);

router.get("/summary", authMiddleware, getProjectsByPhaseSummary);
router.get(
  "/:projectId",
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant", "Investor"),
  fetchProject
);
router.put(
  "/:projectId",
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  updateProject
);

router.delete(
  "/:projectId",
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
  deleteProject
);

export default router;
