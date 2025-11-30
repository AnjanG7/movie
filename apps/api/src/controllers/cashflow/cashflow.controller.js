import asyncHandler from 'express-async-handler';
import { CashflowService } from '../../services/cashflow/cashflow.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { StatusCodes } from 'http-status-codes';

const cashflowService = new CashflowService();

export const getCashflowForecast = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const forecasts = await cashflowService.getCashflowForecast(projectId, req.query,req.user);
    res
        .status(StatusCodes.OK)
        .json(
            new ApiResponse(StatusCodes.OK, forecasts, 'Cashflow forecast fetched successfully')
        );
});

export const upsertCashflowEntry = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const forecast = await cashflowService.upsertCashflowEntry(projectId, req.body,req.user);
    res
        .status(StatusCodes.OK)
        .json(
            new ApiResponse(StatusCodes.OK, forecast, 'Cashflow entry saved successfully')
        );
});

export const autoComputeCashflow = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { weeks } = req.query;
    const forecasts = await cashflowService.autoComputeCashflow(
        projectId,
        req.user,
        parseInt(weeks) || 12
    );
    res
        .status(StatusCodes.OK)
        .json(
            new ApiResponse(
                StatusCodes.OK,
                forecasts,
                'Cashflow auto-computed successfully'
            )
        );
});

export const getCashflowSummary = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const summary = await cashflowService.getCashflowSummary(projectId,req.user);
    res
        .status(StatusCodes.OK)
        .json(
            new ApiResponse(StatusCodes.OK, summary, 'Cashflow summary fetched successfully')
        );
});

export const recalculateCumulatives = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const forecasts = await cashflowService.recalculateCumulatives(projectId,req.user);
    res
        .status(StatusCodes.OK)
        .json(
            new ApiResponse(StatusCodes.OK, forecasts, 'Cumulatives recalculated successfully')
        );
});

export const deleteCashflowEntry = asyncHandler(async (req, res) => {
    const result = await cashflowService.deleteCashflowEntry(req.params.id);
    res
        .status(StatusCodes.OK)
        .json(new ApiResponse(StatusCodes.OK, result, 'Cashflow entry deleted'));
});
