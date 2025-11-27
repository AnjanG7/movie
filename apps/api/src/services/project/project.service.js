import prisma from "../../utils/prismaClient.js";
import { ApiError } from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import { Phase } from "@prisma/client";

export class ProjectService {
  // Create Project + Default Phases + Baseline Budget
  async createProject(data, userId) {
    const { title, baseCurrency, timezone, ownerId, status } = data;

    // Default phases
    const phases = [
      Phase.DEVELOPMENT,
      Phase.PRODUCTION,
      Phase.POST,
      Phase.PUBLICITY,
    ];
    const phaseEntities = phases.map((phase, index) => ({
      name: phase,
      orderNo: index + 1,
    }));

    // Create project WITHOUT any budget versions
    const project = await prisma.project.create({
      data: {
        title,
        baseCurrency,
        timezone: timezone || "Asia/Kathmandu",
        status: status || "planning",
        ownerId: ownerId || userId,
        phases: {
          create: phaseEntities,
        },
        // No budgetVersions here!
      },
      include: {
        phases: true,
        budgetVersions: true,
      },
    });

    return project;
  }

  // Update Project hai

  async updateProject(projectId, data) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
    }

    const { title, baseCurrency, timezone, status, ownerId } = data;

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        title: title ?? project.title,
        baseCurrency: baseCurrency ?? project.baseCurrency,
        timezone: timezone ?? project.timezone,
        status: status ?? project.status,
        ownerId: ownerId ?? project.ownerId,
      },
      include: {
        phases: true,
        budgetVersions: true,
      },
    });

    return updated;
  }
//delete hai
async deleteProject(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
  }


  await prisma.project.delete({
    where: { id: projectId },
  });

  return { message: "Project deleted successfully" };
}

  // Assign Project Owner hai
  async assignProject(projectId, ownerId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { ownerId },
      include: {
        budgetVersions: true,
        phases: true,
      },
    });

    return updated;
  }

  async getAllProjects(query) {
    let { page = 1, limit = 10, status, baseCurrency, ownerId, search } = query;

    const where = {};

    if (status) where.status = status;
    if (baseCurrency) where.baseCurrency = baseCurrency;
    if (ownerId) where.ownerId = ownerId;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { baseCurrency: { contains: search, mode: "insensitive" } },
      ];
    }

    const fetchAll = limit === -1 || !limit;
    const skip = fetchAll ? undefined : (Number(page) - 1) * Number(limit);
    const take = fetchAll ? undefined : Number(limit);

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          phases: true,
          budgetVersions: true,
        },
      }),
      prisma.project.count({ where }),
    ]);

    return {
      total,
      page: Number(page),
      totalPages: fetchAll ? 1 : Math.ceil(total / limit),
      projects,
    };
  }
  // Fetch single project by ID
  async fetchProject(projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        phases: true,
        budgetVersions: {
          include: {
            lines: true, // optional if you want budget line items too
          },
        },
      },
    });

    if (!project) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
    }

    return project;
  }
}
