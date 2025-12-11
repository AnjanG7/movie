import { ProjectUserService } from "../../services/assignproject/assignproject.service.js";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../../utils/ApiError.js";
import prisma from "../../utils/prismaClient.js";

const projectUserService = new ProjectUserService();

export const assignUser = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { email, role } = req.body;

    if (!email) throw new ApiError(StatusCodes.BAD_REQUEST, "Email is required");
    if (!role) throw new ApiError(StatusCodes.BAD_REQUEST, "Project role is required");


    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");


    const assignment = await projectUserService.assignUser(projectId, user.id, role);

    res.status(StatusCodes.CREATED).json(assignment);
  } catch (err) {
    next(err);
  }
};


export const getAllUsers = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 10, email } = req.query;

    const filters = {};
    if (email) filters.email = email;

    const result = await projectUserService.getAll(projectId, Number(page), Number(limit), filters);

    res.status(StatusCodes.OK).json(result);
  } catch (err) {
    next(err);
  }
};


export const updateUserRole = async (req, res, next) => {
  try {
    const { projectId, email } = req.params;
    const { role } = req.body;

    if (!role) throw new ApiError(StatusCodes.BAD_REQUEST, "Project role is required");

    const updatedAssignment = await projectUserService.updateRoleByEmail(projectId, email, role);

    res.status(StatusCodes.OK).json(updatedAssignment);
  } catch (err) {
    next(err);
  }
};


export const removeUser = async (req, res, next) => {
  try {
    const { projectId, userId } = req.params;

    const result = await projectUserService.removeUser(projectId, userId);

    res.status(StatusCodes.OK).json(result);
  } catch (err) {
    next(err);
  }
};
