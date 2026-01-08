import asyncHandler from "express-async-handler";
import { ProjectService } from "../../services/project/project.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { StatusCodes } from "http-status-codes";
import { log } from "console";

const projectService = new ProjectService();


export const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.body, req.user);

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
export const changeProjectPhase = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { phase } = req.body;

  const result = await projectService.changeProjectPhase(
    projectId,
    phase,
    req.user
  );

  res.status(StatusCodes.OK).json(
    new ApiResponse(
      StatusCodes.OK,
      result,
      "Project phase updated successfully"
    )
  );
});

export const updateProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const updated = await projectService.updateProject(projectId, req.body, req.user);

  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, updated, "Project updated successfully")
    );
});
export const getProjectsByPhaseSummary = asyncHandler(async (req, res) => {
  const user = req.user;

  const summary = await projectService.getProjectsByPhase(user);

  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        summary,
        "Project summary by phase fetched successfully"
      )
    );
});
// -------------------------------
// Delete Project
// -------------------------------
export const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const result = await projectService.deleteProject(projectId,req.user);

  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, result, "Project deleted successfully")
    );
});
// Fetch Single Project
export const fetchProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await projectService.fetchProject(projectId,req.user);

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


  const data = await projectService.getAllProjects(req.query, req.user);

  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, data, "Projects fetched successfully")
    );
});


// Get All Active Projects
export const getAllActiveProjects = asyncHandler(async (req, res) => {
  const data = await projectService.getAllActiveProjects(
    req.query,
    req.user
  );

  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        data,
        "Active projects fetched successfully"
      )
    );
});