
import { StatusCodes } from 'http-status-codes';
import prisma from '../../utils/prismaClient.js';
import { ApiError } from '../../utils/ApiError.js';

export class FinancingSourceService {
  // Create financing source
  async createFinancingSource(projectId, data,user) {

        const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
    }

  
    const isAdmin = user.roles?.includes("Admin");

    if (
      !isAdmin &&
      project.ownerId !== user?.id &&
      !(await prisma.projectUser.findFirst({
        where: { projectId, userId: user?.id },
      }))
    ) {
      throw new ApiError(StatusCodes.FORBIDDEN, "You do not have permission");
    }
    const { type, amount, rate, fees, schedule } = data;

 const validTypes = ['EQUITY', 'LOAN', 'GRANT', 'INCENTIVE', 'MG'];
  if (!validTypes.includes(type)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Invalid type. Must be one of: ${validTypes.join(', ')}`
    );
  }
  
  // Ensure amount is a number
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Amount must be a valid number');
  }

    return await prisma.financingSource.create({
      data: {
        projectId,
        type,
        amount,
        rate: rate || null,
        fees: fees || null,
        schedule: schedule || null,
      },
    });
  }

  // Get financing sources for project (with quotation info)
  async getFinancingSources(projectId,user) {
    
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
    }

    const isAdmin = user.roles?.includes("Admin");

    if (
      !isAdmin &&
      project.ownerId !== user?.id &&
      !(await prisma.projectUser.findFirst({
        where: { projectId, userId: user?.id },
      }))
    ) {
      throw new ApiError(StatusCodes.FORBIDDEN, "You do not have permission");
    }
    const sources = await prisma.financingSource.findMany({
      where: { projectId },
      include: {
        drawdowns: true,
        sourceQuotation: {  // ✅ Include quotation info
          select: {
            version: true,
            type: true,
            createdAt: true,
          },
        },
        project: {  // ✅ Include project info for currency
          select: {
            baseCurrency: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add computed fields
    return sources.map((source) => {
      const totalDrawn = source.drawdowns.reduce(
        (sum, d) => sum + d.amount,
        0
      );
      return {
        ...source,
        totalDrawn,
        remaining: source.amount - totalDrawn,
      };
    });
  }

  // Update financing source
  async updateFinancingSource(id, data) {

    
    const source = await prisma.financingSource.findUnique({
      where: { id },
    });

    if (!source) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        'Financing source not found'
      );
    }

    // Don't allow updating if linked to quotation
    if (source.sourceQuotationId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Cannot edit financing source created from quotation. Edit the quotation instead.'
      );
    }

    return await prisma.financingSource.update({
      where: { id },
      data,
    });
  }

  // Delete financing source
  async deleteFinancingSource(id) {
    const source = await prisma.financingSource.findUnique({
      where: { id },
    });

    if (!source) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        'Financing source not found'
      );
    }

    // Don't allow deleting if linked to quotation
    if (source.sourceQuotationId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Cannot delete financing source created from quotation. Delete the quotation instead.'
      );
    }

    // Check if source has drawdowns
    const drawdownCount = await prisma.drawdown.count({
      where: { sourceId: id },
    });

    if (drawdownCount > 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Cannot delete financing source with existing drawdowns'
      );
    }

    await prisma.financingSource.delete({ where: { id } });
    return { message: 'Financing source deleted successfully' };
  }
}
