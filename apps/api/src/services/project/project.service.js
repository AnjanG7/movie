import prisma from "../../utils/prismaClient.js";
import { ApiError } from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import { Phase } from "@prisma/client";

export class ProjectService {
  // Create Project + Default Phases + Baseline Budget
  async createProject(data, user) {
    const { title, baseCurrency, timezone, status } = data;

    const phases = [
      Phase.DEVELOPMENT,
      Phase.PRODUCTION,
      Phase.POST,
      Phase.PUBLICITY,
    ];

    const phaseEntities = phases.map((phase, index) => ({
      name: phase,
      orderNo: index + 1,
      startedAt: phase === Phase.DEVELOPMENT ? new Date() : null,
      endedAt: null,
    }));

    const project = await prisma.project.create({
      data: {
        title,
        baseCurrency,
        timezone: timezone || "Asia/Kathmandu",
        status: status || "planning",
        ownerId: user?.id,
        currentPhase: Phase.DEVELOPMENT,
        phases: {
          create: phaseEntities,
        },
      },
      include: {
        phases: true,
        budgetVersions: true,
      },
    });

    return project;
  }
  async changeProjectPhase(projectId, newPhase, user) {
    // Normalize input phase
    const normalizedPhase = newPhase?.toUpperCase();

    // Validate phase name
    const phaseOrder = ["DEVELOPMENT", "PRODUCTION", "POST", "PUBLICITY"];
    if (!phaseOrder.includes(normalizedPhase)) {
      throw new ApiError(400, "Invalid phase name");
    }

    // Fetch project and its phases
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { phases: true }, // get phase entities
    });

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    // Permission check: Admin or project owner
    const userRecord = await prisma.user.findUnique({
      where: { id: user?.id },
      include: { role: true },
    });

    const isAdmin = userRecord.role?.name === "Admin";
    if (!isAdmin && project.ownerId !== user?.id) {
      throw new ApiError(403, "Not allowed");
    }

    // Phase transition validation
    const currentIndex = phaseOrder.indexOf(project.currentPhase);
    const nextIndex = phaseOrder.indexOf(normalizedPhase);
    if (nextIndex !== currentIndex + 1 && nextIndex !== currentIndex) {
      throw new ApiError(400, "Invalid phase transition");
    }

    // Transaction: End current phase, start new phase, update project
    await prisma.$transaction(async (tx) => {
      // End current phase
      await tx.phaseEntity.updateMany({
        where: {
          projectId,
          name: project.currentPhase,
          endedAt: null,
        },
        data: {
          endedAt: new Date(),
        },
      });

      // Start next phase
      const nextPhaseEntity = project.phases.find(
        (p) => p.name.toUpperCase() === normalizedPhase
      );

      if (!nextPhaseEntity) {
        throw new ApiError(400, "Phase entity not found in project");
      }

      await tx.phaseEntity.updateMany({
        where: {
          projectId,
          name: normalizedPhase,
        },
        data: {
          startedAt: new Date(),
          endedAt: null,
        },
      });

      // Update project's current phase
      await tx.project.update({
        where: { id: projectId },
        data: { currentPhase: normalizedPhase },
      });
    });

    return { message: "Phase updated successfully", newPhase: normalizedPhase };
  }

  // Update Project hai

  async updateProject(projectId, data, user) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    const users = await prisma.user.findUnique({
      where: { id: user?.id },
      include: { role: true },
    });

    if (!project)
      throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
    const isAdmin = users.role?.name === "Admin";
    // Only Admin or Project Owner
    if (
      !isAdmin &&
      project.ownerId !== user?.id &&
      !(await prisma.projectUser.findFirst({
        where: { projectId, userId: user?.id },
      }))
    ) {
      throw new ApiError(StatusCodes.FORBIDDEN, "You do not have permission");
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
  async deleteProject(projectId, user) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    const users = await prisma.user.findUnique({
      where: { id: user?.id },
      include: { role: true },
    });

    if (!project)
      throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
    const isAdmin = users.role?.name === "Admin";
    // Only Admin or Project Owner
    if (
      !isAdmin &&
      project.ownerId !== user?.id &&
      !(await prisma.projectUser.findFirst({
        where: { projectId, userId: user?.id },
      }))
    ) {
      throw new ApiError(StatusCodes.FORBIDDEN, "You do not have permission");
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
  async getProjectsByPhase(user) {
    const isAdmin = user.roles?.includes("Admin");

    const where = {};

    if (!isAdmin) {
      where.OR = [
        { ownerId: user.id },
        { users: { some: { userId: user.id } } },
      ];
    }

    const data = await prisma.project.groupBy({
      by: ["currentPhase"],
      where,
      _count: { id: true },
    });

    return data;
  }
  async getAllActiveProjects(query, user) {
    let { page = 1, limit = 10, baseCurrency, search } = query;

    const isAdmin = user.roles?.includes("Admin");
    const where = {
      status: "active",
    };

    if (!isAdmin) {
      where.OR = [
        { ownerId: user.id },
        { users: { some: { userId: user.id } } },
      ];
    }

    if (baseCurrency) where.baseCurrency = baseCurrency;

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { baseCurrency: { contains: search, mode: "insensitive" } },
          ],
        },
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

  async getAllProjects(query, user) {
    let { page = 1, limit = 10, status, baseCurrency, search } = query;
    const isAdmin = user.roles?.includes("Admin");

    const where = {};

    if (!isAdmin) {
      // Non-admin users: show projects they own OR are assigned to
      where.OR = [
        { ownerId: user.id },

        { users: { some: { userId: user.id } } },
      ];
    }

    if (status) where.status = status;
    if (baseCurrency) where.baseCurrency = baseCurrency;

    if (search) {
      where.AND = [
        where.AND || {},
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { baseCurrency: { contains: search, mode: "insensitive" } },
          ],
        },
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
          users: { include: { user: true } }, // include assigned users
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

  async fetchProject(projectId, user) {
    // Fetch project including phases, budgetVersions, and assigned users
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        phases: true,
        budgetVersions: {
          include: { lines: true }, // optional: budget lines
        },
        users: { include: { user: true } }, // assigned users
      },
    });

    if (!project) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
    }

    const isAdmin = user.roles?.includes("Admin");
    const isOwner = project.ownerId === user.id;
    const isAssigned = project.users.some((pu) => pu.userId === user.id);

    // Authorization: only Admin, owner, or assigned users
    if (!isAdmin && !isOwner && !isAssigned) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden: Access denied");
    }

    // Attach current user's role
    const currentUserAssignment = project.users.find(
      (pu) => pu.userId === user.id
    );
    const currentUserRole = currentUserAssignment?.role || null;

    return {
      ...project,
      currentUserRole,
    };
  }
}
