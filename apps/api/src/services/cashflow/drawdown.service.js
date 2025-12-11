import prisma from '../../utils/prismaClient.js';
import { ApiError } from '../../utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';

export class DrawdownService {
    // Create drawdown
    async createDrawdown(data) {
        const { sourceId, date, amount } = data;

        // Verify financing source exists
        const source = await prisma.financingSource.findUnique({
            where: { id: sourceId },
        });

        if (!source) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Financing source not found');
        }

        // Check if total drawdowns exceed source amount
        const existingDrawdowns = await prisma.drawdown.findMany({
            where: { sourceId },
        });

        const totalDrawn = existingDrawdowns.reduce((sum, d) => sum + d.amount, 0);
        if (totalDrawn + amount > source.amount) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                `Total drawdowns (${totalDrawn + amount}) exceed source amount (${source.amount})`
            );
        }

        return await prisma.drawdown.create({
            data: {
                sourceId,
                date: new Date(date),
                amount,
            },
            include: {
                source: true,
            },
        });
    }

    // Get drawdowns for a project
    async getDrawdowns(projectId, query = {},user) {
        const { sourceId } = query;
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project)
      throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
    const isAdmin = user.roles?.includes("Admin");
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

        const where = {
            source: { projectId },
            ...(sourceId && { sourceId }),
        };

        return await prisma.drawdown.findMany({
            where,
            include: {
                source: true,
            },
            orderBy: { date: 'desc' },
        });
    }

    // Delete drawdown
    async deleteDrawdown(id) {
        
        const drawdown = await prisma.drawdown.findUnique({ where: { id } });
        if (!drawdown) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Drawdown not found');
        }

        await prisma.drawdown.delete({ where: { id } });
        return { message: 'Drawdown deleted successfully' };
    }
}
