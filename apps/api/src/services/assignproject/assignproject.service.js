import prisma from "../../utils/prismaClient.js";
import { ApiError } from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";

export class ProjectUserService {

  async assignUser(projectId, userId, projectRole) {
    
    const exists = await prisma.projectUser.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (exists) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "User is already assigned to this project"
      );
    }

    // Create the project assignment
    const assignment = await prisma.projectUser.create({
      data: {
        projectId,
        userId,
        role: projectRole, // project-specific role
      },
      include: {
        user: true,
        project: true,
      },
    });

    return assignment;
  }

  // Optional: Get all users in a project
  async getAll(projectId, page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;

    const where= { projectId };

    if (filters.email) {
      where.user = { email: { contains: filters.email, mode: "insensitive" } };
    }

    const [total, users] = await prisma.$transaction([
      prisma.projectUser.count({ where }),
      prisma.projectUser.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
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

  // Update user's project role
  async updateRoleByEmail(projectId, email, projectRole) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");

    const assignment = await prisma.projectUser.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });
    if (!assignment)
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "User not assigned to this project"
      );

    const updated = await prisma.projectUser.update({
      where: { projectId_userId: { projectId, userId: user.id } },
      data: { role: projectRole },
      include: { user: true },
    });

    return updated;
  }

  // Remove user from a project
  async removeUser(projectId, userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");

    const assignment = await prisma.projectUser.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!assignment)
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "User is not assigned to this project"
      );

    await prisma.projectUser.delete({
      where: { projectId_userId: { projectId, userId } },
    });

    return {
      success: true,
      message: `User (${user.name}) has been removed from the project successfully`,
    };
  }
}


