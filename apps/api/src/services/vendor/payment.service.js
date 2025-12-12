import prisma from '../../utils/prismaClient.js';
import { ApiError } from '../../utils/ApiError.js';  // ← Changed to named import
import { StatusCodes } from 'http-status-codes';

export class PaymentService {
    // Create Payment (single or installment schedule)
    async createPayment(projectId,data,user) {
        const { invoiceId, amount, paidOn, method, status } = data;
          // Verify project exists
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
        // Verify invoice exists
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { payments: true },
        });

        if (!invoice) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Invoice not found');
        }



        // Calculate total paid so far
        const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
        const remaining = invoice.amount - totalPaid;

        if (amount > remaining) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                `Payment amount exceeds remaining balance of ${remaining}`
            );
        }

        const payment = await prisma.payment.create({
            data: {
                invoiceId,
                amount,
                paidOn: paidOn ? new Date(paidOn) : null,
                method: method || null,
                status: status || 'Paid',
            },
            include: {
                invoice: {
                    include: {
                        vendor: true,
                        po: true,
                    },
                },
            },
        });

        // Update invoice status to 'Paid' if fully paid
        const newTotalPaid = totalPaid + amount;
        if (newTotalPaid >= invoice.amount) {
            await prisma.invoice.update({
                where: { id: invoiceId },
                data: { status: 'Paid' },
            });
        }

        return payment;
    }

    // Create Scheduled Payment (with installments)
    async createScheduledPayment(data,user,projectId) {
                  // Verify project exists
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
        const { payeeId, total, installments, allocations } = data;

        // Verify vendor exists
        const vendor = await prisma.vendor.findUnique({ where: { id: payeeId } });
        if (!vendor) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Vendor not found');
        }

        // Validate installments sum to total
        const installmentTotal = installments.reduce((sum, inst) => sum + inst.amount, 0);
        if (Math.abs(installmentTotal - total) > 0.01) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                'Installments must sum to total amount'
            );
        }

        const scheduledPayment = await prisma.scheduledPayment.create({
            data: {
                payeeId,
                total,
                status: 'Scheduled',
                installments: {
                    create: installments.map((inst) => ({
                        dueDate: new Date(inst.dueDate),
                        amount: inst.amount,
                        status: inst.status || 'Pending',
                    })),
                },
                allocations: allocations
                    ? {
                        create: allocations.map((alloc) => ({
                            phase: alloc.phase,
                            lineRefId: alloc.lineRefId || null,
                            amount: alloc.amount,
                        })),
                    }
                    : undefined,
            },
            include: {
                payee: true,
                installments: true,
                allocations: true,
            },
        });

        return scheduledPayment;
    }

    // Get all payments
    async getPayments(query = {},user,projectId) {
                  // Verify project exists
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
        const { page = 1, limit = 10, invoiceId, status } = query;



        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const where = {};
        if (invoiceId) where.invoiceId = invoiceId;
        if (status) where.status = status;

        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                include: {
                    invoice: {
                        include: {
                            vendor: true,
                            po: {
                                include: {
                                    project: true,
                                },
                            },
                        },
                    },
                },
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.payment.count({ where }),
        ]);

        return {
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit),
            payments,
        };
    }

    // Get single payment
async getPayment(id, user,projectId) {
              // Verify project exists
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
    const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
            invoice: {
                include: {
                    vendor: true,
                    po: {
                        include: {
                            project: true,
                        },
                    },
                },
            },
        },
    });

    if (!payment) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Payment not found");
    }

    const invoice = payment.invoice;
    if (!invoice) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Invoice not found for this payment");
    }



    return payment;
}

    // Get scheduled payments
    async getScheduledPayments(query = {},user,projectId) {
                  // Verify project exists
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
        const { page = 1, limit = 10, payeeId, status } = query;


        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const where = {};
        if (payeeId) where.payeeId = payeeId;
        if (status) where.status = status;

        const [scheduledPayments, total] = await Promise.all([
            prisma.scheduledPayment.findMany({
                where,
                include: {
                    payee: true,
                    installments: true,
                    allocations: true,
                },
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.scheduledPayment.count({ where }),
        ]);

        return {
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit),
            scheduledPayments,
        };
    }

    // Mark installment as paid
    async markInstallmentPaid(scheduledPaymentId, installmentId, data,projectId) {
                  // Verify project exists
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
        const { paidAmount, method } = data;

        const installment = await prisma.installment.findUnique({
            where: { id: installmentId },
        });

        if (!installment) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Installment not found');
        }

        if (installment.scheduledPaymentId !== scheduledPaymentId) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                'Installment does not belong to this scheduled payment'
            );
        }

        const updated = await prisma.installment.update({
            where: { id: installmentId },
            data: {
                status: 'Paid',
            },
        });

        // Check if all installments are paid, update scheduled payment status
        const allInstallments = await prisma.installment.findMany({
            where: { scheduledPaymentId },
        });

        const allPaid = allInstallments.every((inst) => inst.status === 'Paid');
        if (allPaid) {
            await prisma.scheduledPayment.update({
                where: { id: scheduledPaymentId },
                data: { status: 'Completed' },
            });
        }

        return updated;
    }

    // Get upcoming payments (next 30 days)
    async getUpcomingPayments(projectId,user) {
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
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const installments = await prisma.installment.findMany({
            where: {
                status: 'Pending',
                dueDate: {
                    lte: thirtyDaysFromNow,
                },
            },
            include: {
                scheduledPayment: {
                    include: {
                        payee: true,
                    },
                },
            },
            orderBy: { dueDate: 'asc' },
        });

        return installments;
    }
}
