import asyncHandler from 'express-async-handler';
import { VendorService } from '../../services/vendor/vendor.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { StatusCodes } from 'http-status-codes';

const vendorService = new VendorService();

// Create Vendor
export const createVendor = asyncHandler(async (req, res) => {
    const vendor = await vendorService.createVendor(req.body);
    res
        .status(StatusCodes.CREATED)
        .json(
            new ApiResponse(StatusCodes.CREATED, vendor, 'Vendor created successfully')
        );
});

// Get all Vendors
export const getVendors = asyncHandler(async (req, res) => {
    const result = await vendorService.getAllVendors(req.query);
    res
        .status(StatusCodes.OK)
        .json(
            new ApiResponse(StatusCodes.OK, result, 'Vendors fetched successfully')
        );
});

// Get single Vendor
export const getVendor = asyncHandler(async (req, res) => {
    const vendor = await vendorService.getVendor(req.params.id);
    res
        .status(StatusCodes.OK)
        .json(
            new ApiResponse(StatusCodes.OK, vendor, 'Vendor fetched successfully')
        );
});

// Update Vendor
export const updateVendor = asyncHandler(async (req, res) => {
    const updated = await vendorService.updateVendor(req.params.id, req.body);
    res
        .status(StatusCodes.OK)
        .json(new ApiResponse(StatusCodes.OK, updated, 'Vendor updated successfully'));
});

// Delete Vendor
export const deleteVendor = asyncHandler(async (req, res) => {
    const result = await vendorService.deleteVendor(req.params.id);
    res
        .status(StatusCodes.OK)
        .json(new ApiResponse(StatusCodes.OK, result, 'Vendor deleted successfully'));
});
