import prisma from '../../utils/prismaClient.js';
import { ApiError } from '../../utils/ApiError.js';  // ← Changed to named import
import { StatusCodes } from 'http-status-codes';

export class InvoiceService {
    // Create Invoice
    async createInvoice(data, userId) {
        const { vendorId, poId, date, amount, attachments, notes } = data;

        // Verify vendor exists
        const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
        if (!vendor) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Vendor not found');
        }

        // If PO is provided, verify it exists and is approved
        if (poId) {
            const po = await prisma.purchaseOrder.findUnique({ where: { id: poId } });
            if (!po) {
                throw new ApiError(StatusCodes.NOT_FOUND, 'Purchase Order not found');
            }
            if (po.status !== 'Approved') {
                throw new ApiError(StatusCodes.BAD_REQUEST, 'PO must be approved first');
            }
        }

        // Generate invoice number
        const count = await prisma.invoice.count({ where: { vendorId } });
        const docNo = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

        const invoice = await prisma.invoice.create({
            data: {
                vendorId,
                poId: poId || null,
                docNo,
                date: new Date(date),
                amount,
                status: 'Pending',
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

    // Get all invoices (optionally filter by vendor or PO)
    async getInvoices(query = {}) {
        const { page = 1, limit = 10, vendorId, poId, status } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const where = {};
        if (vendorId) where.vendorId = vendorId;
        if (poId) where.poId = poId;
        if (status) where.status = status;

        const [invoices, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                include: {
                    vendor: true,
                    po: {
                        include: {
                            project: true,
                        },
                    },
                    payments: true,
                },
                skip,
                take,
                orderBy: { createdAt: 'desc' },
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
            throw new ApiError(StatusCodes.NOT_FOUND, 'Invoice not found');
        }

        return invoice;
    }

    // Approve/Reject Invoice
    async updateInvoiceStatus(id, status, userId) {
        if (!['Approved', 'Rejected', 'Pending', 'Paid'].includes(status)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid status');
        }

        const invoice = await prisma.invoice.findUnique({ where: { id } });
        if (!invoice) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Invoice not found');
        }

        const updated = await prisma.invoice.update({
            where: { id },
            data: { status },
            include: {
                vendor: true,
                po: true,
                payments: true,
            },
        });

        return updated;
    }

    // Delete Invoice
    async deleteInvoice(id) {
        const invoice = await prisma.invoice.findUnique({ where: { id } });
        if (!invoice) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Invoice not found');
        }

        // Check if invoice has payments
        const paymentCount = await prisma.payment.count({ where: { invoiceId: id } });
        if (paymentCount > 0) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                'Cannot delete invoice with associated payments'
            );
        }

        await prisma.invoice.delete({ where: { id } });
        return { message: 'Invoice deleted successfully' };
    }
}
