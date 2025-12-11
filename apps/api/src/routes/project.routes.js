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
import { authorizeProjectRoles } from "../middlewares/projectRoles.middlware.js";

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
  getAllProjects
);

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
