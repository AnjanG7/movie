import prisma from "../../utils/prismaClient.js";
import { ApiError } from "../../utils/ApiError.js"; // ← Changed to named import
import { StatusCodes } from "http-status-codes";

export class PurchaseOrderService {
  // Create Purchase Order
  // Update the createPurchaseOrder method to include budgetLineId
  async createPurchaseOrder(projectId, data, user, retryCount = 0) {
    const maxRetries = 3;

    try {
      // Extract only the fields your schema supports
      const { vendorId, amount, budgetLineId } = data;

      // Use a transaction to ensure atomicity and prevent race conditions
      return await prisma.$transaction(async (tx) => {
        // Verify project exists
        const project = await tx.project.findUnique({
          where: { id: projectId },
        });
        if (!project) {
          throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
        }

        const isAdmin = user.roles?.includes("Admin");

        if (
          !isAdmin &&
          project.ownerId !== user?.id &&
          !(await tx.projectUser.findFirst({
            where: { projectId, userId: user?.id },
          }))
        ) {
          throw new ApiError(
            StatusCodes.FORBIDDEN,
            "You do not have permission"
          );
        }

        // Verify vendor exists
        const vendor = await tx.vendor.findUnique({ where: { id: vendorId } });
        if (!vendor) {
          throw new ApiError(StatusCodes.NOT_FOUND, "Vendor not found");
        }

        // If budgetLineId provided, verify it exists
        if (budgetLineId) {
          const budgetLine = await tx.budgetLineItem.findUnique({
            where: { id: budgetLineId },
          });
          if (!budgetLine) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Budget line not found");
          }
        }

        // Generate PO number INSIDE TRANSACTION with timestamp to prevent duplicates
        const count = await tx.purchaseOrder.count({
          where: { projectId },
        });

        // Add timestamp suffix to ensure uniqueness (last 4 digits of current timestamp)
        const timestamp = Date.now().toString().slice(-4);
        const poNo = `PO-${project.title.substring(0, 3).toUpperCase()}-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}-${timestamp}`;

        // Create PO with ONLY the fields your schema has
        const purchaseOrder = await tx.purchaseOrder.create({
          data: {
            projectId,
            vendorId,
            poNo,
            amount,
            status: "Pending",
            approvedBy: null, // Will be set when PO is approved
            budgetLineId: budgetLineId || null,
          },
          include: {
            vendor: true,
            project: true,
            budgetLine: true,
          },
        });

        return purchaseOrder;
      });
    } catch (error) {
      // Retry on unique constraint violation (rare, but possible)
      if (
        error.code === "P2002" &&
        error.meta?.target?.includes("poNo") &&
        retryCount < maxRetries
      ) {
        console.log(
          `PO number collision detected. Retry ${retryCount + 1}/${maxRetries}`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, 50 * (retryCount + 1))
        );
        return this.createPurchaseOrder(projectId, data, user, retryCount + 1);
      }
      throw error;
    }
  }

  // Get all POs for a project
  async getPurchaseOrders(projectId, query = {}, user) {
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
        orderBy: { createdAt: "desc" },
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
  async getPurchaseOrder(projectId, id, user) {
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
      throw new ApiError(StatusCodes.NOT_FOUND, "Purchase Order not found");
    }

    return purchaseOrder;
  }

  // Approve/Reject PO
  // Approve/Reject PO
  async updatePOStatus(id, status, user) {
    if (!["Approved", "Rejected", "Pending"].includes(status)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid status");
    }

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
    });
    if (!purchaseOrder) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Purchase Order not found");
    }

    const projectId = purchaseOrder.projectId;

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

    // --- FIXED user shadowing and use correct fields ---
    let approverName = purchaseOrder.approvedBy; // fallback to existing

    if (status === "Approved" && user?.id) {
      const approverUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true },
      });
      approverName = approverUser?.name || approverName;
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status,
        approvedBy:
          status === "Approved" ? approverName : purchaseOrder.approvedBy,
        approvedAt:
          status === "Approved" ? new Date() : purchaseOrder.approvedAt,
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
  async deletePurchaseOrder(id, user) {
    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Purchase Order not found");
    }
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
    });
    if (!purchaseOrder) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Purchase Order not found");
    }

    const projectId = po.projectId;

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

    // Check if PO has associated invoices
    const invoiceCount = await prisma.invoice.count({ where: { poId: id } });
    if (invoiceCount > 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Cannot delete PO with associated invoices"
      );
    }

    await prisma.purchaseOrder.delete({ where: { id } });
    return { message: "Purchase Order deleted successfully" };
  }
}
