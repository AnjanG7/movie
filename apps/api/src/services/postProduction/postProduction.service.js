import prisma from '../../utils/prismaClient.js';
import { ApiError } from '../../utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';

export class PostProductionService {
  // ==================== POST TASKS ====================
  
  /**
   * Create a new post-production task
   */
  async createPostTask(projectId, data) {
    const { name, type, assigneeId, vendorId, costEstimate, dueDate, notes } = data;

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });
    
    if (!project) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Project not found');
    }

    // Verify vendor if provided
    if (vendorId) {
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId }
      });
      if (!vendor) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Vendor not found');
      }
    }

    const postTask = await prisma.postTask.create({
      data: {
        projectId,
        name,
        type: type || null,
        assigneeId: assigneeId || null,
        vendorId: vendorId || null,
        costEstimate: parseFloat(costEstimate),
        actualCost: data.actualCost ? parseFloat(data.actualCost) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: data.status || 'PENDING',
        notes: notes || null,
        attachments: data.attachments || null
      }
    });

    return postTask;
  }

  /**
   * Get all post tasks for a project
   */
  async getPostTasks(projectId, query = {}) {
    const { page = 1, limit = 20, type, status, vendorId } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = { projectId };
    
    if (type) where.type = type;
    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;

    const [postTasks, total] = await Promise.all([
      prisma.postTask.findMany({
        where,
        include: {
          project: {
            select: { id: true, title: true }
          }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.postTask.count({ where })
    ]);

    return {
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      postTasks
    };
  }

  /**
   * Get single post task
   */
  async getPostTask(id) {
    const postTask = await prisma.postTask.findUnique({
      where: { id },
      include: {
        project: true
      }
    });

    if (!postTask) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Post task not found');
    }

    return postTask;
  }

  /**
   * Update post task
   */
  async updatePostTask(id, data) {
    const postTask = await prisma.postTask.findUnique({
      where: { id }
    });

    if (!postTask) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Post task not found');
    }

    const updateData = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
    if (data.vendorId !== undefined) updateData.vendorId = data.vendorId;
    if (data.costEstimate !== undefined) updateData.costEstimate = parseFloat(data.costEstimate);
    if (data.actualCost !== undefined) updateData.actualCost = parseFloat(data.actualCost);
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.attachments !== undefined) updateData.attachments = data.attachments;

    const updated = await prisma.postTask.update({
      where: { id },
      data: updateData,
      include: {
        project: true
      }
    });

    return updated;
  }

  /**
   * Delete post task
   */
  async deletePostTask(id) {
    const postTask = await prisma.postTask.findUnique({
      where: { id }
    });

    if (!postTask) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Post task not found');
    }

    await prisma.postTask.delete({
      where: { id }
    });

    return { message: 'Post task deleted successfully' };
  }

  // ==================== POST BUDGET LINES ====================

  /**
   * Get all POST phase budget line items for a project
   */
  async getPostBudgetLines(projectId) {
    // Get working budget version
    const workingBudget = await prisma.budgetVersion.findFirst({
      where: {
        projectId,
        type: 'WORKING'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!workingBudget) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'No working budget found for this project');
    }

    const postLines = await prisma.budgetLineItem.findMany({
      where: {
        budgetVersionId: workingBudget.id,
        phase: 'POST'
      },
      orderBy: { createdAt: 'asc' }
    });

    const total = postLines.reduce((sum, line) => {
      const lineTotal = line.qty * line.rate * (1 + (line.taxPercent || 0) / 100);
      return sum + lineTotal;
    }, 0);

    return {
      budgetVersionId: workingBudget.id,
      lines: postLines,
      totalEstimated: total
    };
  }

  /**
   * Add POST phase budget line item
   */
  async addPostBudgetLine(projectId, data) {
    // Get working budget
    const workingBudget = await prisma.budgetVersion.findFirst({
      where: {
        projectId,
        type: 'WORKING'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!workingBudget) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'No working budget found');
    }

    const line = await prisma.budgetLineItem.create({
      data: {
        budgetVersionId: workingBudget.id,
        phase: 'POST',
        department: data.department || 'Post Production',
        name: data.name,
        qty: data.qty || 1,
        rate: parseFloat(data.rate),
        taxPercent: data.taxPercent || 0,
        vendor: data.vendor || null,
        notes: data.notes || null
      }
    });

    return line;
  }

  // ==================== FORECASTING ====================

  /**
   * Get post-production cost forecast and summary
   */
  async getPostProductionForecast(projectId) {
    // Get POST tasks
    const postTasks = await prisma.postTask.findMany({
      where: { projectId }
    });

    // Get POST budget lines
    const postBudget = await this.getPostBudgetLines(projectId);

    // Calculate totals
    const taskEstimated = postTasks.reduce((sum, task) => sum + task.costEstimate, 0);
    const taskActual = postTasks.reduce((sum, task) => sum + (task.actualCost || 0), 0);
    
    const budgetEstimated = postBudget.totalEstimated;

    // Get paid amounts (invoices/payments for POST vendors)
    const postVendorIds = postTasks
      .filter(t => t.vendorId)
      .map(t => t.vendorId);

    let totalPaid = 0;
    if (postVendorIds.length > 0) {
      const payments = await prisma.payment.findMany({
        where: {
          invoice: {
            vendorId: { in: postVendorIds }
          },
          status: 'Paid'
        },
        include: {
          invoice: true
        }
      });
      totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    }

    const totalEstimated = budgetEstimated + taskEstimated;
    const totalActual = taskActual + totalPaid;
    const remaining = totalEstimated - totalActual;
    const variance = totalEstimated - totalActual;

    // Task breakdown by type
    const tasksByType = postTasks.reduce((acc, task) => {
      const type = task.type || 'OTHER';
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          estimated: 0,
          actual: 0,
          pending: 0,
          inProgress: 0,
          completed: 0
        };
      }
      acc[type].count += 1;
      acc[type].estimated += task.costEstimate;
      acc[type].actual += task.actualCost || 0;
      
      if (task.status === 'PENDING') acc[type].pending += 1;
      if (task.status === 'IN_PROGRESS') acc[type].inProgress += 1;
      if (task.status === 'COMPLETED') acc[type].completed += 1;
      
      return acc;
    }, {});

    // Task breakdown by status
    const tasksByStatus = postTasks.reduce((acc, task) => {
      const status = task.status;
      if (!acc[status]) {
        acc[status] = { count: 0, estimated: 0, actual: 0 };
      }
      acc[status].count += 1;
      acc[status].estimated += task.costEstimate;
      acc[status].actual += task.actualCost || 0;
      return acc;
    }, {});

    return {
      summary: {
        totalEstimated,
        totalActual,
        totalPaid,
        remaining,
        variance,
        completionPercentage: totalEstimated > 0 ? (totalActual / totalEstimated * 100) : 0
      },
      budgetLines: {
        count: postBudget.lines.length,
        total: budgetEstimated
      },
      tasks: {
        total: postTasks.length,
        estimated: taskEstimated,
        actual: taskActual,
        byType: tasksByType,
        byStatus: tasksByStatus
      }
    };
  }

  /**
   * Update project ROI forecast with post-production data
   */
  async updateROIWithPostProduction(projectId) {
    // Get latest quotation metrics
    const quotation = await prisma.budgetVersion.findFirst({
      where: {
        projectId,
        type: 'QUOTE'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!quotation || !quotation.metrics) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'No quotation with metrics found');
    }

    // Get post-production forecast
    const postForecast = await this.getPostProductionForecast(projectId);

    // Update total cost with actual post-production costs
    const originalMetrics = quotation.metrics;
    const updatedTotalCost = originalMetrics.totalCost + postForecast.summary.totalActual;

    // Recalculate metrics
    const projectedRevenue = originalMetrics.projectedRevenue || updatedTotalCost * 1.5;
    const distributionFees = projectedRevenue * 0.20; // 20% default
    const netRevenue = projectedRevenue - distributionFees;
    const profit = netRevenue - updatedTotalCost;
    const roi = updatedTotalCost > 0 ? (profit / updatedTotalCost) * 100 : 0;

    // Simple NPV calculation
    const discountRate = 0.10;
    const years = 3;
    const annualCashflow = netRevenue / years;
    let npv = -updatedTotalCost;
    for (let i = 1; i <= years; i++) {
      npv += annualCashflow / Math.pow(1 + discountRate, i);
    }

    const updatedMetrics = {
      ...originalMetrics,
      totalCost: updatedTotalCost,
      postProductionActual: postForecast.summary.totalActual,
      postProductionVariance: postForecast.summary.variance,
      projectedRevenue,
      netRevenue,
      profit,
      roi: parseFloat(roi.toFixed(2)),
      npv: parseFloat(npv.toFixed(2)),
      breakEvenRevenue: updatedTotalCost + distributionFees,
      updatedAt: new Date().toISOString()
    };

    // Save updated metrics back to quotation
    await prisma.budgetVersion.update({
      where: { id: quotation.id },
      data: { metrics: updatedMetrics }
    });

    return updatedMetrics;
  }
}
