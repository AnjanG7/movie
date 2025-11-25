import asyncHandler from 'express-async-handler';
import { PurchaseOrderService } from '../../services/vendor/purchaseOrder.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { StatusCodes } from 'http-status-codes';

const poService = new PurchaseOrderService();

export const createPurchaseOrder = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const purchaseOrder = await poService.createPurchaseOrder(
        projectId,
        req.body,
        req.user.id
    );
    res
        .status(StatusCodes.CREATED)
        .json(
            new ApiResponse(
                StatusCodes.CREATED,
                purchaseOrder,
                'Purchase Order created successfully'
            )
        );
});

export const getPurchaseOrders = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await poService.getPurchaseOrders(projectId, req.query);
    res
        .status(StatusCodes.OK)
        .json(
            new ApiResponse(
                StatusCodes.OK,
                result,
                'Purchase Orders fetched successfully'
            )
        );
});

export const getPurchaseOrder = asyncHandler(async (req, res) => {
    const purchaseOrder = await poService.getPurchaseOrder(req.params.id);
    res
        .status(StatusCodes.OK)
        .json(
            new ApiResponse(
                StatusCodes.OK,
                purchaseOrder,
                'Purchase Order fetched successfully'
            )
        );
});

export const updatePOStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const updated = await poService.updatePOStatus(req.params.id, status, req.user.id);
    res
        .status(StatusCodes.OK)
        .json(
            new ApiResponse(StatusCodes.OK, updated, 'Purchase Order status updated')
        );
});

export const deletePurchaseOrder = asyncHandler(async (req, res) => {
    const result = await poService.deletePurchaseOrder(req.params.id);
    res
        .status(StatusCodes.OK)
        .json(new ApiResponse(StatusCodes.OK, result, 'Purchase Order deleted'));
});
