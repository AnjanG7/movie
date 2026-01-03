import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet"

import { errorHandler } from "./middlewares/errormiddleware.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: "https://film-finance-app.vercel.app"
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());

// Import all routes
import authRouter from "./routes/auth.routes.js";
import projectRouter from "./routes/project.routes.js";
import budgetRouter from "./routes/budgetversion.routes.js";
import quotationRouter from "./routes/quotation.routes.js";
import waterfallRouter from "./routes/waterfall.routes.js";
import purchaseOrderRouter from "./routes/purchaseOrder.routes.js";
import invoiceRouter from "./routes/invoice.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import vendorRouter from "./routes/vendor.routes.js";
import cashflowRouter from "./routes/cashflow.routes.js";
import financingSourceRouter from "./routes/financingSource.routes.js";
import drawdownRouter from "./routes/drawdown.routes.js";
import budgetLineRouter from "./routes/budgetLine.routes.js";
// Add this import with your other route imports
import postProductionRouter from "./routes/postProduction.routes.js";
// Import the publicity router
import publicityRouter from "./routes/publicity.routes.js";
import assignRouter from "./routes/assign.routes.js";
// Register all routes
app.use("/api/auth", authRouter);
app.use("/api/projects", projectRouter);
app.use("/api/projects/:projectId/budget", budgetRouter);
app.use("/api/projects/:projectId/quotations", quotationRouter);
app.use("/api/projects/:projectId/waterfalls", waterfallRouter);
app.use("/api/vendors/project/:projectId", vendorRouter);
app.use("/api/projects/:projectId/purchase-orders", purchaseOrderRouter);
app.use("/api/invoices/project/:projectId", invoiceRouter);
app.use("/api/payments/project/:projectId", paymentRouter);
app.use("/api/projects/:projectId/cashflow", cashflowRouter);
app.use("/api/projects/:projectId/financing-sources", financingSourceRouter);
app.use("/api/projects/:projectId/drawdowns", drawdownRouter);
app.use("/api/projects/:projectId/budget-lines", budgetLineRouter);

// Add this route registration with your other routes
app.use("/api/projects/:projectId/post-production", postProductionRouter);

// Register the route (add this with your other routes)
app.use("/api/projects/:projectId/publicity", publicityRouter);

// ProjectUser routes (assign, update role, list, remove)
app.use("/api/projects/:projectId/users", assignRouter);
import roiRouter from "./routes/roi.routes.js";
app.use("/api/projects/:projectId/quotations", roiRouter);

import exportRouter from "./routes/export.routes.js";
// Register export routes (add with other routes)
app.use("/api/projects/:projectId/quotations", exportRouter);
app.use("/api/projects", exportRouter);
app.use("/api", exportRouter);

// Serve static exports folder
app.use("/exports", express.static("exports"));

// Error handler (should be last)
app.use(errorHandler);

export default app;
