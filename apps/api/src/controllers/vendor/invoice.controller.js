import asyncHandler from "express-async-handler";
import { InvoiceService } from "../../services/vendor/invoice.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import StatusCodes from "http-status-codes";

const invoiceService = new InvoiceService();

// Create Invoice
export const createInvoice = asyncHandler(async (req, res) => {
const projectId= req.params.projectId
  const invoice = await invoiceService.createInvoice(req.body, req.user,projectId);
  res
    .status(StatusCodes.CREATED)
    .json(
      new ApiResponse(
        StatusCodes.CREATED,
        invoice,
        "Invoice created successfully"
      )
    );
});

// Get all invoices
export const getInvoices = asyncHandler(async (req, res) => {
  const projectId= req.params.projectId
  const result = await invoiceService.getInvoices(req.query,req.user,projectId);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, result, "Invoices fetched successfully")
    );
});

// Get single invoice
export const getInvoice = asyncHandler(async (req, res) => {
  const projectId= req.params.projectId
  const invoice = await invoiceService.getInvoice(req.params.id,req.user,projectId);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, invoice, "Invoice fetched successfully")
    );
});

// Update invoice status
export const updateInvoiceStatus = asyncHandler(async (req, res) => {
  const projectId= req.params.projectId
  const { status } = req.body;
  const updated = await invoiceService.updateInvoiceStatus(
    req.params.id,
    status,
    req.user,
    projectId
  );
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        updated,
        "Invoice status updated successfully"
      )
    );
});

// Delete invoice
export const deleteInvoice = asyncHandler(async (req, res) => {
  const projectId= req.params.projectId
  const result = await invoiceService.deleteInvoice(req.params.id,req.user,projectId);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, result, "Invoice deleted successfully")
    );
});

// NEW: Get PO Balance
export const getPOBalance = asyncHandler(async (req, res) => {
  const projectId= req.params.projectId
  const balance = await invoiceService.getPOBalance(req.params.poId,req.user,projectId);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        balance,
        "PO balance fetched successfully"
      )
    );
});
