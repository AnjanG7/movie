import prisma from "../../utils/prismaClient.js";
import { ApiError } from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import { Phase } from "@prisma/client";

export class BudgetVersionService {

  // Create new Budget Version (WORKING / QUOTE)
  async createBudgetVersion(projectId, data, userId) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");

    const versionData = {
      projectId,
      version: data.version,
      type: data.type, // WORKING | QUOTE
      createdBy: userId,
    };

    const budgetVersion = await prisma.budgetVersion.create({
      data: versionData,
      include: { lines: true },
    });

    return budgetVersion;
  }

  // Get all Budget Versions for a Project
async getBudgetVersions(projectId, query) {
  const {
    page = 1,
    limit = 10,
    type,      // optional filter: "BASELINE", "WORKING", "QUOTE"
    locked,    // optional filter: true/false
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  // Build dynamic where clause
  const where = { projectId };

  if (type) where.type = type;
  if (locked !== undefined) {
    if (locked === "true" || locked === true) where.lockedAt = { not: null };
    else if (locked === "false" || locked === false) where.lockedAt = null;
  }

  // Fetch data with pagination
  const [versions, total] = await Promise.all([
    prisma.budgetVersion.findMany({
      where,
      include: { lines: true },
      skip,
      take,
      orderBy: { createdAt: "asc" },
    }),
    prisma.budgetVersion.count({ where }),
  ]);

  return {
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
    versions,
  };
}



  // Add Line Item
  async addLineItem(versionId, lineData, userId) {
    const version = await prisma.budgetVersion.findUnique({ where: { id: versionId } });
    if (!version) throw new ApiError(StatusCodes.NOT_FOUND, "Budget Version not found");

    const lineItem = await prisma.budgetLineItem.create({
      data: {
        ...lineData,
        budgetVersionId: versionId,
      },
    });

    // Create ChangeOrder
    await prisma.changeOrder.create({
      data: {
        versionId,
        reason: "Added Line Item",
        oldValue: null,
        newValue: lineData,
        createdBy: userId,
      },
    });

    return lineItem;
  }

  // Update Line Item
  async updateLineItem(lineId, updateData, userId) {
    const line = await prisma.budgetLineItem.findUnique({ where: { id: lineId } });
    if (!line) throw new ApiError(StatusCodes.NOT_FOUND, "Line Item not found");

    const updatedLine = await prisma.budgetLineItem.update({
      where: { id: lineId },
      data: updateData,
    });

    // Record ChangeOrder
    await prisma.changeOrder.create({
      data: {
        versionId: line.budgetVersionId,
        reason: "Updated Line Item",
        oldValue: line,
        newValue: updateData,
        createdBy: userId,
      },
    });

    return updatedLine;
  }

  // Delete Line Item
  async deleteLineItem(lineId, userId) {
    const line = await prisma.budgetLineItem.findUnique({ where: { id: lineId } });
    if (!line) throw new ApiError(StatusCodes.NOT_FOUND, "Line Item not found");

    await prisma.budgetLineItem.delete({ where: { id: lineId } });

    // Record ChangeOrder
    await prisma.changeOrder.create({
      data: {
        versionId: line.budgetVersionId,
        reason: "Deleted Line Item",
        oldValue: line,
        newValue: null,
        createdBy: userId,
      },
    });

    return { message: "Line Item deleted successfully" };
  }

  // Lock BASELINE version
  async lockBaseline(versionId) {
    const version = await prisma.budgetVersion.findUnique({ where: { id: versionId } });
    if (!version) throw new ApiError(StatusCodes.NOT_FOUND, "Budget Version not found");
    if (version.type !== "BASELINE") throw new ApiError(StatusCodes.BAD_REQUEST, "Only BASELINE can be locked");

    return prisma.budgetVersion.update({
      where: { id: versionId },
      data: { lockedAt: new Date() },
    });
  }
}
