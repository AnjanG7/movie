import prisma from '../../utils/prismaClient.js';
import { ApiError } from '../../utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';

export class VendorService {
    // Get all vendors
    async getAllVendors(projectId,query = {}) {
          
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

        const { page = 1, limit = 100 } = query; // Default limit high for frontend dropdown
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const [vendors, total] = await Promise.all([
            prisma.vendor.findMany({
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.vendor.count(),
        ]);

        return {
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit),
            vendors,
        };
    }

    // Get single vendor
    async getVendor(projectId,id,user) {
          
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
        const vendor = await prisma.vendor.findUnique({
            where: { id },
            include: {
                purchaseOrders: true,
                invoices: true,
                scheduledPayments: {
                    include: {
                        installments: true,
                        allocations: true,
                    },
                },
            },
        });

        if (!vendor) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Vendor not found');
        }


        return vendor;
    }

    // Create vendor
    async createVendor(data,projectId,user) {

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
        const { name, currency, bankInfo, contactInfo} = data;

        // Check if vendor already exists
        const existingVendor = await prisma.vendor.findFirst({
            where: { name },
        });

        if (existingVendor) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Vendor with this name already exists');
        }

        return await prisma.vendor.create({
            data: {
                name,
                currency: currency || 'USD',
                bankInfo: bankInfo || null,
                contactInfo: contactInfo || null,
                projectId
            },
        });
    }

    // Update vendor
    async updateVendor(id, data,user) {
        const vendor = await prisma.vendor.findUnique({ where: { id } });
        if (!vendor) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Vendor not found');
        }
const projectId= vendor.projectId
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
        return await prisma.vendor.update({
            where: { id },
            data,
        });
    }

    // Delete vendor
    async deleteVendor(id,user) {
        const vendor = await prisma.vendor.findUnique({ where: { id } });
        if (!vendor) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Vendor not found');
        }
const projectId= vendor.projectId
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
        // Check if vendor has associated POs or invoices
        const poCount = await prisma.purchaseOrder.count({ where: { vendorId: id } });
        const invoiceCount = await prisma.invoice.count({ where: { vendorId: id } });

        if (poCount > 0 || invoiceCount > 0) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                'Cannot delete vendor with associated purchase orders or invoices'
            );
        }

        await prisma.vendor.delete({ where: { id } });
        return { message: 'Vendor deleted successfully' };
    }
}
