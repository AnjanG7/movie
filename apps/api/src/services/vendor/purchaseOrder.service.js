import prisma from '../../utils/prismaClient.js';
import { ApiError } from '../../utils/ApiError.js';  // ← Changed to named import
import { StatusCodes } from 'http-status-codes';

export class PurchaseOrderService {
    // Create Purchase Order
// Update the createPurchaseOrder method to include budgetLineId
async createPurchaseOrder(projectId, data) {
  const { vendorId, amount, approvedBy, notes, budgetLineId } = data;

  // Verify project exists
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Project not found');
  }

  // Verify vendor exists
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Vendor not found');
  }

  // If budgetLineId provided, verify it exists
  if (budgetLineId) {
    const budgetLine = await prisma.budgetLineItem.findUnique({
      where: { id: budgetLineId },
    });
    if (!budgetLine) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Budget line not found');
    }
  }

  // Generate PO number
   const count = await prisma.purchaseOrder.count({
            where: { projectId }, // ← Count only POs for THIS project
        });
    const poNo = `PO-${project.title.substring(0, 3).toUpperCase()}-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      projectId,
      vendorId,
      poNo,
      amount,
      status: 'Pending',
      approvedBy,
      budgetLineId: budgetLineId || null,
    },
    include: {
      vendor: true,
      project: true,
      budgetLine: true,
    },
  });

  return purchaseOrder;
}


    // Get all POs for a project
    async getPurchaseOrders(projectId, query = {}) {
        const { page = 1, limit = 10, status } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const where = { projectId };
        if (status) where.status = status;

        const [purchaseOrders, total] = await Promise.all([
            prisma.purchaseOrder.findMany({
                where,
                include: {
                    vendor: true,
                    project: true,
                    invoices: true,
                    budgetLine: true,
                },
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.purchaseOrder.count({ where }),
        ]);

        return {
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit),
            purchaseOrders,
        };
    }

    // Get single PO
    async getPurchaseOrder(id) {
        const purchaseOrder = await prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                vendor: true,
                project: true,
                invoices: true,
                budgetLine: true,
            },
        });

        if (!purchaseOrder) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Purchase Order not found');
        }

        return purchaseOrder;
    }

    // Approve/Reject PO
    async updatePOStatus(id, status, userId) {
        if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid status');
        }

        const purchaseOrder = await prisma.purchaseOrder.findUnique({ where: { id } });
        if (!purchaseOrder) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Purchase Order not found');
        }
        
            let approverName = null;
    if (status === 'Approved' && userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true }
        });
        approverName = user?.name;
    }


        const updated = await prisma.purchaseOrder.update({
            where: { id },
            data: {
                status,
                 approvedBy: status === 'Approved' ? (approverName || userId) : po.approvedBy, // ← Store name instead of ID
            approvedAt: status === 'Approved' ? new Date() : po.approvedAt,
            },
            include: {
                vendor: true,
                project: true,
                budgetLine: true,
            },
        });

        return updated;
    }

    // Delete PO
    async deletePurchaseOrder(id) {
        const po = await prisma.purchaseOrder.findUnique({ where: { id } });
        if (!po) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Purchase Order not found');
        }

        // Check if PO has associated invoices
        const invoiceCount = await prisma.invoice.count({ where: { poId: id } });
        if (invoiceCount > 0) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                'Cannot delete PO with associated invoices'
            );
        }

        await prisma.purchaseOrder.delete({ where: { id } });
        return { message: 'Purchase Order deleted successfully' };
    }
}
