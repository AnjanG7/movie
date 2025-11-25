import asyncHandler from 'express-async-handler';
import { PaymentService } from '../../services/vendor/payment.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { StatusCodes } from 'http-status-codes';

const paymentService = new PaymentService();

export const createPayment = asyncHandler(async (req, res) => {
    const payment = await paymentService.createPayment(req.body, req.user.id);
    res
        .status(StatusCodes.CREATED)
        .json(
            new ApiResponse(StatusCodes.CREATED, payment, 'Payment created successfully')
        );
});

export const createScheduledPayment = asyncHandler(async (req, res) => {
    const scheduledPayment = await paymentService.createScheduledPayment(
        req.body,
        req.user.id
    );
    res
        .status(StatusCodes.CREATED)
        .json(
            new ApiResponse(
                StatusCodes.CREATED,
                scheduledPayment,
                'Scheduled Payment created successfully'
            )
        );
});

export const getPayments = asyncHandler(async (req, res) => {
    const result = await paymentService.getPayments(req.query);
    res
        .status(StatusCodes.OK)
        .json(
            new ApiResponse(StatusCodes.OK, result, 'Payments fetched successfully')
        );
});

export const getPayment = asyncHandler(async (req, res) => {
    const payment = await paymentService.getPayment(req.params.id);
    res
        .status(StatusCodes.OK)
        .json(
            new ApiResponse(StatusCodes.OK, payment, 'Payment fetched successfully')
        );
});

export const getScheduledPayments = asyncHandler(async (req, res) => {
    const result = await paymentService.getScheduledPayments(req.query);
    res
        .status(StatusCodes.OK)
        .json(
            new ApiResponse(
                StatusCodes.OK,
                result,
                'Scheduled Payments fetched successfully'
            )
        );
});

export const markInstallmentPaid = asyncHandler(async (req, res) => {
    const { scheduledPaymentId, installmentId } = req.params;
    const updated = await paymentService.markInstallmentPaid(
        scheduledPaymentId,
        installmentId,
        req.body
    );
    res
        .status(StatusCodes.OK)
        .json(
            new ApiResponse(StatusCodes.OK, updated, 'Installment marked as paid')
        );
});

export const getUpcomingPayments = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const upcoming = await paymentService.getUpcomingPayments(projectId);
    res
        .status(StatusCodes.OK)
        .json(
            new ApiResponse(
                StatusCodes.OK,
                upcoming,
                'Upcoming payments fetched successfully'
            )
        );
});
