import prisma from "../../utils/prismaClient.js";
import { ApiError } from "../../utils/ApiError.js";
import StatusCodes from "http-status-codes";

export class InvoiceService {
  // Create Invoice with PO balance validation
  async createInvoice(data,user) {
    const { vendorId, poId, date, amount, attachments } = data;

    // Verify vendor exists
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Vendor not found");
    }

    // PO is now REQUIRED
    if (!poId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Purchase Order is required for creating an invoice");
    }

    // Fetch PO with existing invoices
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        invoices: {
          where: {
            status: {
              not: "Rejected", // Exclude rejected invoices
            },
          },
          select: {
            id: true,
            docNo: true,
            amount: true,
            status: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
          const project = await prisma.project.findUnique({
      where: { id:po.projectId },
    });
    if (!project) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
    }

    const isAdmin = user.roles?.includes("Admin");
const projectId= po.projectId
    if (
      !isAdmin &&
      project.ownerId !== user?.id &&
      !(await prisma.projectUser.findFirst({
        where: { projectId, userId: user?.id },
      }))
    ) {
      throw new ApiError(StatusCodes.FORBIDDEN, "You do not have permission");
    }

    if (!po) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Purchase Order not found");
    }

    if (po.status !== "Approved") {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Purchase Order must be approved before creating an invoice"
      );
    }

    // Calculate total already invoiced for this PO (excluding rejected)
    const totalInvoiced = po.invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const remaining = po.amount - totalInvoiced;

    // Validate: Check if the new invoice amount exceeds remaining PO balance
    if (amount > remaining) {
      const existingInvoicesList = po.invoices
        .map((inv) => `${inv.docNo} (${inv.status}): ${inv.amount.toLocaleString()}`)
        .join(", ");

      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Invoice amount exceeds remaining PO balance.\n\n` +
        `PO Amount: ${po.amount.toLocaleString()}\n` +
        `Already Invoiced: ${totalInvoiced.toLocaleString()}\n` +
        `Remaining Balance: ${remaining.toLocaleString()}\n` +
        `Your Invoice Amount: ${amount.toLocaleString()}\n\n` +
        `Existing Invoices: ${existingInvoicesList || "None"}`
      );
    }

    // Generate invoice number
    const count = await prisma.invoice.count({ where: { vendorId } });
    const docNo = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    // Create the invoice
    const invoice = await prisma.invoice.create({
      data: {
        vendorId,
        poId,
        docNo,
        date: new Date(date),
        amount,
        status: "Pending",
        attachments: attachments || null,

      },
      include: {
        vendor: true,
        po: {
          include: {
            project: true,
          },
        },
      },
    });

    return invoice;
  }

  // Get all invoices (optionally filter by vendor, PO, or project)
  async getInvoices(query) {
    const { page = 1, limit = 10, vendorId, poId, status, projectId } = query;
    const skip = Number(page - 1) * Number(limit);
    const take = Number(limit);

    const where = {};
    if (vendorId) where.vendorId = vendorId;
    if (poId) where.poId = poId;
    if (status) where.status = status;
    
    // Filter by project through PO relation
    if (projectId) {
      where.po = {
        projectId: projectId,
      };
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          vendor: true,
          po: {
            include: {
              project: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
          payments: true,
        },
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      invoices,
    };
  }

  // Get single invoice
  async getInvoice(id) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        vendor: true,
        po: {
          include: {
            project: true,
          },
        },
        payments: true,
      },
    });

    if (!invoice) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Invoice not found");
    }
    return invoice;
  }

  // Update Invoice Status
  async updateInvoiceStatus(id, status) {
    if (!["Approved", "Rejected", "Pending", "Paid"].includes(status)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid status");
    }

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Invoice not found");
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status },
      include: {
        vendor: true,
        po: {
          include: {
            project: true,
          },
        },
        payments: true,
      },
    });

    return updated;
  }

  // Delete Invoice
  async deleteInvoice(id) {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Invoice not found");
    }

    // Check if invoice has payments
    const paymentCount = await prisma.payment.count({ where: { invoiceId: id } });
    if (paymentCount > 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Cannot delete invoice with associated payments"
      );
    }

    await prisma.invoice.delete({ where: { id } });
    return { message: "Invoice deleted successfully" };
  }

  // NEW: Get PO Balance Information
  async getPOBalance(poId) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        invoices: {
          where: {
            status: {
              not: "Rejected", // Exclude rejected invoices
            },
          },
          select: {
            id: true,
            docNo: true,
            amount: true,
            status: true,
            date: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
      },
    });

    if (!po) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Purchase Order not found");
    }

    const totalInvoiced = po.invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const remaining = po.amount - totalInvoiced;

    return {
      poNo: po.poNo,
      poAmount: po.amount,
      totalInvoiced,
      remaining,
      project: po.project,
      vendor: po.vendor,
      invoices: po.invoices,
    };
  }
}
