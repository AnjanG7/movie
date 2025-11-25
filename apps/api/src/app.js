import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/errormiddleware.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: (_, cb) => {
      cb(null, true);
    },
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Import all routes
import authRouter from "./routes/auth.routes.js";
import projectRouter from "./routes/project.routes.js";
import budgetRouter from "./routes/budgetversion.routes.js";
import quotationRouter from "./routes/quotation.routes.js";
import waterfallRouter from "./routes/waterfall.routes.js";
import purchaseOrderRouter from './routes/purchaseOrder.routes.js';
import invoiceRouter from './routes/invoice.routes.js';
import paymentRouter from './routes/payment.routes.js';
import vendorRouter from './routes/vendor.routes.js';
import cashflowRouter from './routes/cashflow.routes.js';
import financingSourceRouter from './routes/financingSource.routes.js';
import drawdownRouter from './routes/drawdown.routes.js';
import budgetLineRouter from './routes/budgetLine.routes.js';

// Register all routes
app.use("/api/auth", authRouter);
app.use("/api/projects", projectRouter);
app.use("/api/projects/:projectId/budget", budgetRouter);
app.use("/api/projects/:projectId/quotations", quotationRouter);
app.use("/api/projects/:projectId/waterfalls", waterfallRouter);
app.use('/api/vendors', vendorRouter);
app.use('/api/projects/:projectId/purchase-orders', purchaseOrderRouter);
app.use('/api/invoices', invoiceRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/projects/:projectId/cashflow', cashflowRouter);
app.use('/api/projects/:projectId/financing-sources', financingSourceRouter);
app.use('/api/projects/:projectId/drawdowns', drawdownRouter);
app.use('/api/projects/:projectId/budget-lines', budgetLineRouter);

// Error handler (should be last)
app.use(errorHandler);

export default app;
