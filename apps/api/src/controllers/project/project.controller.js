import asyncHandler from "express-async-handler";
import { ProjectService } from "../../services/project/project.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { StatusCodes } from "http-status-codes";

const projectService = new ProjectService();


export const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.body, req.user.id);

  res
    .status(StatusCodes.CREATED)
    .json(
      new ApiResponse(
        StatusCodes.CREATED,
        project,
        "Project created successfully with default phases and baseline budget"
      )
    );
});

// Fetch Single Project
export const fetchProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await projectService.fetchProject(projectId);

  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, project, "Project fetched successfully")
    );
});


// Assign Project Owner hai
export const assignProject = asyncHandler(async (req, res) => {
  const { projectId, ownerId } = req.body;
  const updated = await projectService.assignProject(projectId, ownerId);

  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, updated, "Project assigned successfully")
    );
});

// Get All Projects
export const getAllProjects = asyncHandler(async (req, res) => {
  const data = await projectService.getAllProjects(req.query);

  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, data, "Projects fetched successfully")
    );
});
