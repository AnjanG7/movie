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
    const defaultLineItems = [
      { phase: "DEVELOPMENT", name: "Script Development", qty: 1, rate: 5000 },
      { phase: "PRODUCTION", name: "Camera Equipment", qty: 1, rate: 20000 },
      { phase: "POST", name: "Editing", qty: 1, rate: 10000 },
      { phase: "PUBLICITY", name: "Marketing Campaign", qty: 1, rate: 8000 },
    ];
    // Baseline budget version
    const baselineBudgetVersion = {
      version: "v1",
      type: "BASELINE",
      createdBy: userId,
      lines: {
        create: defaultLineItems,
      },
    };

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

        budgetVersions: {
          create: baselineBudgetVersion,
        },
      },
      include: {
        phases: true,
        budgetVersions: true,
      },
    });

    return project;
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
  let {
    page = 1,
    limit = 10,
    status,
    baseCurrency,
    ownerId,
    search,
  } = query;

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


