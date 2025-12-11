import prisma from '../../utils/prismaClient.js';
import { ApiError } from "../../utils/ApiError.js";
import StatusCodes from 'http-status-codes';

export class PublicityService {
  // ==================== PUBLICITY BUDGET ====================
  
  /**
   * Create a new publicity/P&A budget item
   */
  async createPublicityBudget(projectId, data) {
    const { name, category, description, budgetAmount, vendor, startDate, endDate, notes } = data;

    // Validate project exists
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

    const publicityBudget = await prisma.publicityBudget.create({
      data: {
        projectId,
        name,
        category,
        description: description || null,
        budgetAmount: parseFloat(budgetAmount),
        vendor: vendor || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: 'PLANNED',
        notes: notes || null
      },
      include: {
        project: {
          select: { id: true, title: true, baseCurrency: true }
        }
      }
    });

    return publicityBudget;
  }

  /**
   * Get all publicity budgets for a project with summary
   */
  async getPublicityBudgets(projectId, query = {}) {


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



    const { category, status } = query;

    const where = { projectId };
    if (category) where.category = category;
    if (status) where.status = status;

    const budgets = await prisma.publicityBudget.findMany({
      where,
      include: {
        expenses: {
          orderBy: { expenseDate: 'desc' }
        },
        campaignEvents: {
          orderBy: { startDate: 'asc' }
        },
        _count: {
          select: {
            expenses: true,
            campaignEvents: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate totals
    const totalBudget = budgets.reduce((sum, b) => sum + b.budgetAmount, 0);
    const totalActual = budgets.reduce((sum, b) => sum + b.actualAmount, 0);
    const variance = totalBudget - totalActual;
    const percentSpent = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

    return {
      budgets,
      summary: {
        totalBudget,
        totalActual,
        variance,
        percentSpent: parseFloat(percentSpent.toFixed(2)),
        itemCount: budgets.length
      }
    };
  }

  /**
   * Get single publicity budget with details
   */
  async getPublicityBudget(id) {
    const budget = await prisma.publicityBudget.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, title: true, baseCurrency: true }
        },
        expenses: {
          orderBy: { expenseDate: 'desc' }
        },
        campaignEvents: {
          orderBy: { startDate: 'asc' }
        }
      }
    });

    if (!budget) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Publicity budget not found');
    }

    return budget;
  }

  /**
   * Update publicity budget
   */
  async updatePublicityBudget(id, data) {
    const budget = await prisma.publicityBudget.findUnique({ where: { id } });

    if (!budget) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Publicity budget not found');
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.budgetAmount !== undefined) updateData.budgetAmount = parseFloat(data.budgetAmount);
    if (data.vendor !== undefined) updateData.vendor = data.vendor;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updated = await prisma.publicityBudget.update({
      where: { id },
      data: updateData,
      include: {
        expenses: true,
        campaignEvents: true
      }
    });

    return updated;
  }

  /**
   * Delete publicity budget
   */
  async deletePublicityBudget(id) {
    const budget = await prisma.publicityBudget.findUnique({ where: { id } });

    if (!budget) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Publicity budget not found');
    }

    await prisma.publicityBudget.delete({ where: { id } });

    return { message: 'Publicity budget deleted successfully' };
  }

  // ==================== PUBLICITY EXPENSES ====================

  /**
   * Add an expense to a publicity budget item
   */
  async addPublicityExpense(publicityBudgetId, data) {
    const { description, amount, expenseDate, vendor, invoiceNumber, attachmentUrl, notes } = data;

    const budget = await prisma.publicityBudget.findUnique({
      where: { id: publicityBudgetId }
    });

    if (!budget) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Publicity budget not found');
    }

    const expense = await prisma.publicityExpense.create({
      data: {
        publicityBudgetId,
        description,
        amount: parseFloat(amount),
        expenseDate: new Date(expenseDate),
        vendor: vendor || null,
        invoiceNumber: invoiceNumber || null,
        attachmentUrl: attachmentUrl || null,
        notes: notes || null
      }
    });

    // Recalculate actual amount
    const totalExpenses = await prisma.publicityExpense.aggregate({
      where: { publicityBudgetId },
      _sum: { amount: true }
    });

    await prisma.publicityBudget.update({
      where: { id: publicityBudgetId },
      data: { actualAmount: totalExpenses._sum.amount || 0 }
    });

    return expense;
  }

  /**
   * Get all expenses for a publicity budget
   */
  async getPublicityExpenses(publicityBudgetId) {
    const expenses = await prisma.publicityExpense.findMany({
      where: { publicityBudgetId },
      orderBy: { expenseDate: 'desc' }
    });

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      expenses,
      total
    };
  }

  /**
   * Update an expense
   */
  async updatePublicityExpense(id, data) {
    const expense = await prisma.publicityExpense.findUnique({ where: { id } });

    if (!expense) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Expense not found');
    }

    const updateData = {};
    if (data.description !== undefined) updateData.description = data.description;
    if (data.amount !== undefined) updateData.amount = parseFloat(data.amount);
    if (data.expenseDate !== undefined) updateData.expenseDate = new Date(data.expenseDate);
    if (data.vendor !== undefined) updateData.vendor = data.vendor;
    if (data.invoiceNumber !== undefined) updateData.invoiceNumber = data.invoiceNumber;
    if (data.attachmentUrl !== undefined) updateData.attachmentUrl = data.attachmentUrl;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updated = await prisma.publicityExpense.update({
      where: { id },
      data: updateData
    });

    // Recalculate actual amount
    const totalExpenses = await prisma.publicityExpense.aggregate({
      where: { publicityBudgetId: expense.publicityBudgetId },
      _sum: { amount: true }
    });

    await prisma.publicityBudget.update({
      where: { id: expense.publicityBudgetId },
      data: { actualAmount: totalExpenses._sum.amount || 0 }
    });

    return updated;
  }

  /**
   * Delete an expense
   */
  async deletePublicityExpense(id) {
    const expense = await prisma.publicityExpense.findUnique({
      where: { id }
    });

    if (!expense) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Expense not found');
    }

    await prisma.publicityExpense.delete({ where: { id } });

    // Recalculate actual amount
    const totalExpenses = await prisma.publicityExpense.aggregate({
      where: { publicityBudgetId: expense.publicityBudgetId },
      _sum: { amount: true }
    });

    await prisma.publicityBudget.update({
      where: { id: expense.publicityBudgetId },
      data: { actualAmount: totalExpenses._sum.amount || 0 }
    });

    return { message: 'Expense deleted successfully' };
  }

  // ==================== CAMPAIGN CALENDAR ====================

  /**
   * Create a campaign event
   */
  async createCampaignEvent(projectId, data) {
    const { title, description, eventType, startDate, endDate, deliverable, publicityBudgetId, notes } = data;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Project not found');
    }

    // Validate publicity budget if provided
    if (publicityBudgetId) {
      const budget = await prisma.publicityBudget.findUnique({
        where: { id: publicityBudgetId }
      });
      if (!budget || budget.projectId !== projectId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid publicity budget');
      }
    }

    const event = await prisma.campaignEvent.create({
      data: {
        projectId,
        title,
        description: description || null,
        eventType,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        deliverable: deliverable || null,
        publicityBudgetId: publicityBudgetId || null,
        status: 'UPCOMING',
        notes: notes || null
      },
      include: {
        project: {
          select: { id: true, title: true }
        },
        publicityBudget: {
          select: { id: true, name: true, category: true }
        }
      }
    });

    return event;
  }

  /**
   * Get campaign calendar for a project
   */
  async getCampaignCalendar(projectId, query = {}) {


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
    const { eventType, status, upcoming, fromDate, toDate } = query;

    const where = { projectId };
    if (eventType) where.eventType = eventType;
    if (status) where.status = status;
    
    if (upcoming === 'true') {
      where.startDate = {
        gte: new Date()
      };
    }

    if (fromDate || toDate) {
      where.startDate = {};
      if (fromDate) where.startDate.gte = new Date(fromDate);
      if (toDate) where.startDate.lte = new Date(toDate);
    }

    const events = await prisma.campaignEvent.findMany({
      where,
      include: {
        publicityBudget: {
          select: { id: true, name: true, category: true, budgetAmount: true }
        }
      },
      orderBy: { startDate: 'asc' }
    });

    return events;
  }

  /**
   * Get single campaign event
   */
  async getCampaignEvent(id) {
    const event = await prisma.campaignEvent.findUnique({
      where: { id },
      include: {
        project: true,
        publicityBudget: true
      }
    });

    if (!event) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Campaign event not found');
    }

    return event;
  }

  /**
   * Update campaign event
   */
  async updateCampaignEvent(id, data) {
    const event = await prisma.campaignEvent.findUnique({ where: { id } });

    if (!event) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Campaign event not found');
    }

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.eventType !== undefined) updateData.eventType = data.eventType;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.deliverable !== undefined) updateData.deliverable = data.deliverable;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.publicityBudgetId !== undefined) updateData.publicityBudgetId = data.publicityBudgetId;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updated = await prisma.campaignEvent.update({
      where: { id },
      data: updateData,
      include: {
        publicityBudget: true
      }
    });

    return updated;
  }

  /**
   * Delete campaign event
   */
  async deleteCampaignEvent(id) {
    const event = await prisma.campaignEvent.findUnique({ where: { id } });

    if (!event) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Campaign event not found');
    }

    await prisma.campaignEvent.delete({ where: { id } });

    return { message: 'Campaign event deleted successfully' };
  }

  // ==================== REPORTS & ANALYTICS ====================

  /**
   * Get comprehensive P&A summary report
   */
  async getPublicitySummary(projectId) {
    const [budgets, events] = await Promise.all([
      prisma.publicityBudget.findMany({
        where: { projectId },
        include: {
          expenses: true,
          _count: {
            select: { expenses: true, campaignEvents: true }
          }
        }
      }),
      prisma.campaignEvent.findMany({
        where: { projectId }
      })
    ]);

    // Group by category
    const byCategory = budgets.reduce((acc, budget) => {
      if (!acc[budget.category]) {
        acc[budget.category] = {
          category: budget.category,
          budgeted: 0,
          actual: 0,
          variance: 0,
          count: 0
        };
      }
      acc[budget.category].budgeted += budget.budgetAmount;
      acc[budget.category].actual += budget.actualAmount;
      acc[budget.category].variance += (budget.budgetAmount - budget.actualAmount);
      acc[budget.category].count += 1;
      return acc;
    }, {});

    // Group by status
    const byStatus = budgets.reduce((acc, budget) => {
      if (!acc[budget.status]) {
        acc[budget.status] = {
          status: budget.status,
          budgeted: 0,
          actual: 0,
          count: 0
        };
      }
      acc[budget.status].budgeted += budget.budgetAmount;
      acc[budget.status].actual += budget.actualAmount;
      acc[budget.status].count += 1;
      return acc;
    }, {});

    const totalBudget = budgets.reduce((sum, b) => sum + b.budgetAmount, 0);
    const totalActual = budgets.reduce((sum, b) => sum + b.actualAmount, 0);
    const totalVariance = totalBudget - totalActual;

    // Campaign stats
    const upcomingEvents = events.filter(e => e.status === 'UPCOMING' && new Date(e.startDate) >= new Date()).length;
    const completedEvents = events.filter(e => e.status === 'COMPLETED').length;
    const inProgressEvents = events.filter(e => e.status === 'IN_PROGRESS').length;

    return {
      summary: {
        totalBudget,
        totalActual,
        totalVariance,
        percentSpent: totalBudget > 0 ? parseFloat(((totalActual / totalBudget) * 100).toFixed(2)) : 0,
        itemCount: budgets.length,
        upcomingEvents,
        completedEvents,
        inProgressEvents,
        totalEvents: events.length
      },
      byCategory: Object.values(byCategory),
      byStatus: Object.values(byStatus),
      recentExpenses: await prisma.publicityExpense.findMany({
        where: {
          publicityBudget: { projectId }
        },
        include: {
          publicityBudget: {
            select: { name: true, category: true }
          }
        },
        orderBy: { expenseDate: 'desc' },
        take: 10
      })
    };
  }

  /**
   * Update ROI forecast including P&A costs
   */
  async updateROIWithPublicity(projectId) {
    // Get latest quotation/baseline budget
    const quotation = await prisma.budgetVersion.findFirst({
      where: {
        projectId,
        type: { in: ['QUOTE', 'BASELINE'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!quotation) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'No quotation or baseline budget found');
    }

    // Get P&A actual spend
    const publicityData = await this.getPublicitySummary(projectId);
    const paActual = publicityData.summary.totalActual;
    const paBudgeted = publicityData.summary.totalBudget;

    // Get existing metrics or create new
    const originalMetrics = quotation.metrics || {};
    const baseTotalCost = originalMetrics.totalCost || quotation.grandTotal || 0;
    
    // Calculate updated total cost
    const updatedTotalCost = baseTotalCost + paActual;

    // Revenue projections (from original or default multiplier)
    const projectedRevenue = originalMetrics.projectedRevenue || updatedTotalCost * 1.5;
    const distributionFeePercent = originalMetrics.distributionFeePercent || 20;
    const distributionFees = projectedRevenue * (distributionFeePercent / 100);
    const netRevenue = projectedRevenue - distributionFees - updatedTotalCost;
    const profit = netRevenue;
    const roi = updatedTotalCost > 0 ? (profit / updatedTotalCost) * 100 : 0;

    // Simple IRR approximation (3-year payback)
    const years = 3;
    const annualCashflow = netRevenue / years;
    
    // NPV calculation
    const discountRate = 0.10;
    let npv = -updatedTotalCost;
    for (let i = 1; i <= years; i++) {
      npv += annualCashflow / Math.pow(1 + discountRate, i);
    }

    // Break-even calculation
    const breakEvenRevenue = updatedTotalCost + distributionFees;

    const updatedMetrics = {
      ...originalMetrics,
      baseTotalCost,
      publicityActual: paActual,
      publicityBudgeted: paBudgeted,
      totalCost: updatedTotalCost,
      projectedRevenue,
      distributionFeePercent,
      distributionFees,
      netRevenue,
      profit,
      roi: parseFloat(roi.toFixed(2)),
      npv: parseFloat(npv.toFixed(2)),
      breakEvenRevenue: parseFloat(breakEvenRevenue.toFixed(2)),
      updatedAt: new Date().toISOString(),
      includesPA: true
    };

    // Update the quotation with new metrics
    await prisma.budgetVersion.update({
      where: { id: quotation.id },
      data: { metrics: updatedMetrics }
    });

    return updatedMetrics;
  }
}
