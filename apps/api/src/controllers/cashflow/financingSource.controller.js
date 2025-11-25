import asyncHandler from 'express-async-handler';
import { FinancingSourceService } from '../../services/cashflow/financingSource.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { StatusCodes } from 'http-status-codes';

const financingSourceService = new FinancingSourceService();

export const createFinancingSource = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const source = await financingSourceService.createFinancingSource(
        projectId,
        req.body
    );
    res
        .status(StatusCodes.CREATED)
        .json(
            new ApiResponse(
                StatusCodes.CREATED,
                source,
                'Financing source created successfully'
            )
        );
});

export const getFinancingSources = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const sources = await financingSourceService.getFinancingSources(projectId);
    res
        .status(StatusCodes.OK)
        .json(
            new ApiResponse(
                StatusCodes.OK,
                sources,
                'Financing sources fetched successfully'
            )
        );
});

export const updateFinancingSource = asyncHandler(async (req, res) => {
    const updated = await financingSourceService.updateFinancingSource(
        req.params.id,
        req.body
    );
    res
        .status(StatusCodes.OK)
        .json(
            new ApiResponse(StatusCodes.OK, updated, 'Financing source updated successfully')
        );
});

export const deleteFinancingSource = asyncHandler(async (req, res) => {
    const result = await financingSourceService.deleteFinancingSource(req.params.id);
    res
        .status(StatusCodes.OK)
        .json(new ApiResponse(StatusCodes.OK, result, 'Financing source deleted'));
});
