import prisma from "../../utils/prismaClient.js";
import { ApiError } from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";

export class ProjectUserService {
  async assignUser(projectId, userId, role) {

    const exists = await prisma.projectUser.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (exists) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "User is already assigned to this project"
      );
    }

    // Create assignment
    const assignment = await prisma.projectUser.create({
      data: {
        projectId,
        userId,
      role
      },
      include: {
        user: true,
        project: true,
      },
    });

    return assignment;
  }

  // Get all users in a project with pagination
  async getAll(projectId, page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;
    if (filters.email) {
      // Filter by user's email (case-insensitive)
      where.user = {
        email: { contains: filters.email, mode: "insensitive" },
      };
    }
    const [total, users] = await prisma.$transaction([
      prisma.projectUser.count({ where: { projectId } }),
      prisma.projectUser.findMany({
        where: { projectId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true, 
            },
          },
        },
        skip,
        take: limit,
        orderBy: { role: "asc" },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: users,
    };
  }

  // Update role of a user in a project using email
  async updateRoleByEmail(projectId, email, role) {
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    }

    // Find the assignment in the project
    const assignment = await prisma.projectUser.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });
    if (!assignment) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "User not assigned to this project"
      );
    }

    // Update the role
    const updated = await prisma.projectUser.update({
      where: { projectId_userId: { projectId, userId: user.id } },
      data: { role },
      include: { user: true },
    });

    return updated;
  }

  async removeUser(projectId, userId) {
    // 1. Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    }

    // 2. Check if user is assigned to the project
    const assignment = await prisma.projectUser.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!assignment) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "User is not assigned to this project"
      );
    }

    // 3. Remove the assignment
    await prisma.projectUser.delete({
      where: { projectId_userId: { projectId, userId } },
    });
      return {
    success: true,
    message: `User (${user.name}) has been removed from the project successfully`,
  };
  }
}
