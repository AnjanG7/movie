import { ApiError } from "../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import prisma from "../utils/prismaClient.js";

/**
 * Middleware to check project-specific roles
 * Admins bypass project restrictions
 * Producers can access their own projects
 * @param allowedRoles - array of project roles allowed for this route
 */
export const authorizeProjectRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;           // from authMiddleware
      const projectId = req.params?.projectId; // from route param

      if (!userId) throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
      if (!projectId) throw new ApiError(StatusCodes.BAD_REQUEST, "Project ID is required");

      // Fetch user with global role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (!user) throw new ApiError(StatusCodes.UNAUTHORIZED, "User not found");

      if (user.role?.name === "Admin") {
        req.projectRole = "Admin";
        return next();
      }

   
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");

      if (project.ownerId === userId) {
        req.projectRole = "Producer";
        return next();
      }


      const assignment = await prisma.projectUser.findUnique({
        where: { projectId_userId: { projectId, userId } },
      });

      if (!assignment) throw new ApiError(StatusCodes.FORBIDDEN, "Not assigned to this project");

      if (!allowedRoles.includes(assignment.role)) {
        throw new ApiError(StatusCodes.FORBIDDEN, "Access denied for this project role");
      }

      req.projectRole = assignment.role;
      next();
    } catch (err) {
      next(err);
    }
  };
};
