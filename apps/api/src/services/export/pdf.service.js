import PDFDocument from 'pdfkit';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PDFService {
  constructor() {
    this.outputDir = path.join(__dirname, '../../../exports');
    this.colors = {
      primary: '#0066cc',
      success: '#28a745',
      danger: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8',
      light: '#f8f9fa',
      dark: '#343a40',
    };
  }

  // ============================================
  // 1. QUOTATION PDF
  // ============================================
  async generateQuotationPDF(quotation, options = {}) {
    const doc = this.createDocument('Quotation', quotation.version);
    const { filepath, stream } = await this.setupOutput(doc, 'quotation', quotation.id);

    this.addHeader(doc, 'INVESTOR QUOTATION', quotation.version);
    this.addProjectInfo(doc, quotation);
    this.addFinancialSummary(doc, quotation);

    if (quotation.assumptions) this.addAssumptions(doc, quotation.assumptions);
    if (quotation.lines) this.addBudgetLines(doc, quotation.lines, quotation.assumptions?.currency);
    if (quotation.financingPlan) this.addFinancingPlan(doc, quotation.financingPlan);
    if (quotation.revenueModel) this.addRevenueModel(doc, quotation.revenueModel);
    if (quotation.metrics) this.addROIMetrics(doc, quotation.metrics);

    this.addFooter(doc, 'This quotation is for informational purposes only and does not constitute financial advice.');

    return await this.finalizeDocument(doc, filepath, stream, 'quotation');
  }

  // ============================================
  // 2. COST REPORT PDF
  // ============================================
  async generateCostReportPDF(reportData) {
    const doc = this.createDocument('Cost Report', reportData.project.title);
    const { filepath, stream } = await this.setupOutput(doc, 'cost-report', reportData.project.id);

    this.addHeader(doc, 'COST REPORT', 'Budget vs Actuals vs EFC');

    doc.fontSize(11).font('Helvetica')
      .text(`Project: ${reportData.project.title}`)
      .text(`Report Date: ${new Date().toLocaleDateString()}`)
      .text(`Currency: ${reportData.project.baseCurrency}`)
      .moveDown(1);

    this.addCostSummaryTable(doc, reportData.summary, reportData.project.baseCurrency);

    if (reportData.byPhase) {
      doc.addPage();
      this.addHeader(doc, 'BREAKDOWN BY PHASE');
      this.addPhaseBreakdown(doc, reportData.byPhase, reportData.project.baseCurrency);
    }

    if (reportData.variances && reportData.variances.length > 0) {
      doc.addPage();
      this.addHeader(doc, 'SIGNIFICANT VARIANCES');
      this.addVarianceDetails(doc, reportData.variances, reportData.project.baseCurrency);
    }

    this.addFooter(doc);
    return await this.finalizeDocument(doc, filepath, stream, 'cost-report');
  }

  // ============================================
  // 3. CASHFLOW REPORT PDF
  // ============================================
  async generateCashflowReportPDF(cashflowData) {
    const doc = this.createDocument('Cashflow Report', cashflowData.project.title);
    const { filepath, stream } = await this.setupOutput(doc, 'cashflow-report', cashflowData.project.id);

    this.addHeader(doc, 'CASHFLOW FORECAST', 'Weekly Analysis');

    doc.fontSize(11).font('Helvetica')
      .text(`Project: ${cashflowData.project.title}`)
      .text(`Period: ${cashflowData.periodStart} to ${cashflowData.periodEnd}`)
      .text(`Currency: ${cashflowData.project.baseCurrency}`)
      .moveDown(1);

    this.addCashflowSummary(doc, cashflowData.summary, cashflowData.project.baseCurrency);
    this.addWeeklyCashflow(doc, cashflowData.weeks, cashflowData.project.baseCurrency);

    if (cashflowData.alerts && cashflowData.alerts.length > 0) {
      doc.addPage();
      this.addHeader(doc, 'CASHFLOW ALERTS');
      this.addCashflowAlerts(doc, cashflowData.alerts);
    }

    this.addFooter(doc);
    return await this.finalizeDocument(doc, filepath, stream, 'cashflow-report');
  }

  // ============================================
  // 4. WATERFALL STATEMENT PDF
  // ============================================
  async generateWaterfallStatementPDF(waterfallData) {
    const doc = this.createDocument('Waterfall Statement', waterfallData.project.title);
    const { filepath, stream } = await this.setupOutput(doc, 'waterfall-statement', waterfallData.project.id);

    this.addHeader(doc, 'INVESTOR DISTRIBUTION STATEMENT', waterfallData.periodLabel);

    doc.fontSize(11).font('Helvetica')
      .text(`Project: ${waterfallData.project.title}`)
      .text(`Period: ${waterfallData.periodStart} to ${waterfallData.periodEnd}`)
      .text(`Currency: ${waterfallData.project.baseCurrency}`)
      .moveDown(1);

    this.addRevenueSummary(doc, waterfallData.revenue, waterfallData.project.baseCurrency);
    this.addWaterfallTiers(doc, waterfallData.tiers, waterfallData.project.baseCurrency);
    this.addParticipantPayouts(doc, waterfallData.payouts, waterfallData.project.baseCurrency);

    if (waterfallData.cumulative) {
      doc.addPage();
      this.addHeader(doc, 'CUMULATIVE SUMMARY');
      this.addCumulativeSummary(doc, waterfallData.cumulative, waterfallData.project.baseCurrency);
    }

    this.addFooter(doc, 'This statement is subject to audit and verification.');
    return await this.finalizeDocument(doc, filepath, stream, 'waterfall-statement');
  }

  // ============================================
  // 5. PURCHASE ORDER PDF
  // ============================================
  async generatePurchaseOrderPDF(poData) {
    const doc = this.createDocument('Purchase Order', poData.poNo);
    const { filepath, stream } = await this.setupOutput(doc, 'purchase-order', poData.id);

    this.addHeader(doc, 'PURCHASE ORDER', poData.poNo);

    const startY = doc.y;
    doc.fontSize(10).font('Helvetica-Bold')
      .text('VENDOR INFORMATION:', 50, startY);

    doc.font('Helvetica').fontSize(9)
      .text(poData.vendor.name, 50, doc.y + 5)
      .text(poData.vendor.contactInfo?.address || '', 50, doc.y)
      .text(poData.vendor.contactInfo?.email || '', 50, doc.y)
      .text(poData.vendor.contactInfo?.phone || '', 50, doc.y);

    doc.fontSize(10).font('Helvetica-Bold')
      .text('PROJECT INFORMATION:', 320, startY);

    doc.font('Helvetica').fontSize(9)
      .text(poData.project.title, 320, startY + 20)
      .text(`PO Date: ${new Date(poData.createdAt).toLocaleDateString()}`, 320, doc.y)
      .text(`Status: ${poData.status}`, 320, doc.y);

    doc.moveDown(2);

    this.addPOItemsTable(doc, poData);

    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica-Bold')
      .text('PAYMENT TERMS:')
      .font('Helvetica')
      .text(poData.paymentTerms || 'Net 30 days', { indent: 20 });

    if (poData.approvedBy) {
      doc.moveDown(2);
      doc.text(`Approved by: ${poData.approver?.name || poData.approvedBy}`)
        .text(`Date: ${new Date(poData.approvedAt).toLocaleDateString()}`);
    }

    this.addFooter(doc, 'This is a legally binding purchase order.');
    return await this.finalizeDocument(doc, filepath, stream, 'purchase-order');
  }

  // ============================================
  // 6. INVOICE PDF
  // ============================================
  async generateInvoicePDF(invoiceData) {
    const doc = this.createDocument('Invoice', invoiceData.docNo);
    const { filepath, stream } = await this.setupOutput(doc, 'invoice', invoiceData.id);

    this.addHeader(doc, 'INVOICE', invoiceData.docNo);

    const startY = doc.y;
    doc.fontSize(10).font('Helvetica-Bold')
      .text('FROM:', 50, startY);

    doc.font('Helvetica').fontSize(9)
      .text(invoiceData.vendor.name, 50, doc.y + 5)
      .text(invoiceData.vendor.contactInfo?.address || '', 50, doc.y);

    doc.fontSize(10).font('Helvetica-Bold')
      .text('BILL TO:', 320, startY);

    doc.font('Helvetica').fontSize(9)
      .text('Production Company', 320, startY + 20)
      .text(`Invoice Date: ${new Date(invoiceData.date).toLocaleDateString()}`, 320, doc.y)
      .text(`Due Date: ${this.calculateDueDate(invoiceData.date)}`, 320, doc.y)
      .text(`Status: ${invoiceData.status}`, 320, doc.y);

    doc.moveDown(2);

    this.addInvoiceItemsTable(doc, invoiceData);

    if (invoiceData.payments && invoiceData.payments.length > 0) {
      doc.moveDown(1);
      this.addPaymentHistory(doc, invoiceData.payments);
    }

    this.addFooter(doc, 'Please remit payment to the account details provided.');
    return await this.finalizeDocument(doc, filepath, stream, 'invoice');
  }

  // ============================================
  // 7. BUDGET SUMMARY PDF
  // ============================================
  async generateBudgetSummaryPDF(budgetData) {
    const doc = this.createDocument('Budget Summary', budgetData.version);
    const { filepath, stream } = await this.setupOutput(doc, 'budget-summary', budgetData.id);

    this.addHeader(doc, 'BUDGET SUMMARY', `Version: ${budgetData.version}`);

    doc.fontSize(11).font('Helvetica')
      .text(`Project: ${budgetData.project.title}`)
      .text(`Type: ${budgetData.type}`)
      .text(`Currency: ${budgetData.project.baseCurrency}`)
      .text(`Created: ${new Date(budgetData.createdAt).toLocaleDateString()}`)
      .moveDown(1);

    doc.rect(50, doc.y, 495, 40).fillAndStroke('#f0f8ff', this.colors.primary);
    doc.fillColor('#000000');
    const textY = doc.y + 10;
    doc.fontSize(16).font('Helvetica-Bold')
      .text(
        `Total Budget: ${this.formatCurrency(budgetData.grandTotal, budgetData.project.baseCurrency)}`,
        50,
        textY,
        { width: 495, align: 'center' }
      );
    doc.y += 40;
    doc.moveDown(1);

    this.addBudgetByPhase(doc, budgetData.lines, budgetData.project.baseCurrency);

    this.addFooter(doc);
    return await this.finalizeDocument(doc, filepath, stream, 'budget-summary');
  }

  // ============================================
  // 8. PROJECT OVERVIEW PDF
  // ============================================
  async generateProjectOverviewPDF(projectData) {
    const doc = this.createDocument('Project Overview', projectData.title);
    const { filepath, stream } = await this.setupOutput(doc, 'project-overview', projectData.id);

    this.addHeader(doc, 'PROJECT OVERVIEW', projectData.title);

    doc.fontSize(11).font('Helvetica')
      .text(`Status: ${projectData.status}`)
      .text(`Currency: ${projectData.baseCurrency}`)
      .text(`Created: ${new Date(projectData.createdAt).toLocaleDateString()}`)
      .moveDown(1);

    if (projectData.financialSummary) {
      this.addProjectFinancialSummary(doc, projectData.financialSummary, projectData.baseCurrency);
    }

    if (projectData.metrics) {
      doc.addPage();
      this.addHeader(doc, 'KEY METRICS');
      this.addProjectMetrics(doc, projectData.metrics);
    }

    if (projectData.team) {
      doc.addPage();
      this.addHeader(doc, 'PROJECT TEAM');
      this.addProjectTeam(doc, projectData.team);
    }

    this.addFooter(doc);
    return await this.finalizeDocument(doc, filepath, stream, 'project-overview');
  }

  // ============================================
  // DOCUMENT SETUP / FINALIZE
  // ============================================
  createDocument(title, subtitle) {
    return new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `${title} - ${subtitle}`,
        Author: 'Film Finance App',
        Subject: title,
        CreationDate: new Date(),
      },
    });
  }

  async setupOutput(doc, type, id) {
    await fs.ensureDir(this.outputDir);
    const filename = `${type}-${id}-${Date.now()}.pdf`;
    const filepath = path.join(this.outputDir, filename);
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);
    return { filepath, stream };
  }

  async finalizeDocument(doc, filepath, stream, type) {
    doc.end();

    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    const filename = path.basename(filepath);
    return {
      filename,
      filepath,
      url: `/exports/${filename}`,
      type,
      createdAt: new Date().toISOString(),
    };
  }

  // ============================================
  // HEADER & FOOTER
  // ============================================
  addHeader(doc, title, subtitle = '') {
    doc.fontSize(24).font('Helvetica-Bold')
      .text(title, { align: 'center' })
      .moveDown(0.3);

    if (subtitle) {
      doc.fontSize(12).font('Helvetica')
        .text(subtitle, { align: 'center' })
        .moveDown(0.5);
    }

    doc.strokeColor(this.colors.primary).lineWidth(2)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke()
      .moveDown(1);

    doc.fillColor('#000000');
  }

  addFooter(doc, disclaimer = '') {
    const pageHeight = doc.page.height;

    if (disclaimer) {
      doc.fontSize(8).font('Helvetica')
        .text(disclaimer, 50, pageHeight - 80, {
          align: 'justify',
          width: 495,
        });
    }

    doc.fontSize(8).font('Helvetica')
      .text(
        `Generated: ${new Date().toLocaleString()}`,
        50,
        pageHeight - 35,
        { align: 'center' }
      );
  }

  // ============================================
  // QUOTATION HELPERS
  // ============================================
  addProjectInfo(doc, quotation) {
    doc.fontSize(16).font('Helvetica-Bold')
      .text('Project Information')
      .moveDown(0.5);

    doc.fontSize(11).font('Helvetica');

    const info = [
      ['Project Title:', quotation.project?.title || 'N/A'],
      ['Currency:', quotation.project?.baseCurrency || 'USD'],
      ['Template:', quotation.template || 'FEATURE'],
      ['Type:', quotation.type],
    ];

    info.forEach(([label, value]) => {
      doc
        .text(label, 50, doc.y, { continued: true, width: 150 })
        .font('Helvetica-Bold')
        .text(value)
        .font('Helvetica')
        .moveDown(0.3);
    });

    doc.moveDown(1);
  }

  addFinancialSummary(doc, quotation) {
    doc.fontSize(16).font('Helvetica-Bold')
      .text('Financial Summary')
      .moveDown(0.5);

    doc.rect(50, doc.y, 495, 80).fillAndStroke('#f0f8ff', this.colors.primary);

    doc.fillColor('#000000');

    const startY = doc.y + 15;
    doc.y = startY;

    doc.fontSize(12).font('Helvetica');

    const currency = quotation.assumptions?.currency || 'USD';
    const grandTotal = quotation.grandTotal || 0;

    doc.text(`Total Budget: ${this.formatCurrency(grandTotal, currency)}`, 70, doc.y, { width: 200 });

    if (quotation.metrics) {
      doc.text(
        `Projected Revenue: ${this.formatCurrency(quotation.metrics.projectedRevenue, currency)}`,
        300,
        startY,
        { width: 200 }
      );
      doc.text(
        `Net Revenue: ${this.formatCurrency(quotation.metrics.netRevenue, currency)}`,
        70,
        startY + 25,
        { width: 200 }
      );
      doc.text(
        `Projected Profit: ${this.formatCurrency(quotation.metrics.profit, currency)}`,
        300,
        startY + 25,
        { width: 200 }
      );
      doc.text(`ROI: ${quotation.metrics.roi.toFixed(2)}%`, 70, startY + 50, { width: 200 });
      doc.text(`IRR: ${quotation.metrics.irr.toFixed(2)}%`, 300, startY + 50, { width: 200 });
    }

    doc.y = startY + 80;
    doc.moveDown(2);
  }

  addAssumptions(doc, assumptions) {
    doc.fontSize(16).font('Helvetica-Bold')
      .text('Financial Assumptions')
      .moveDown(0.5);

    doc.fontSize(11).font('Helvetica');

    const assumptionsList = [
      ['Currency:', assumptions.currency],
      ['Tax Rate:', `${assumptions.taxPercent}%`],
      ['Contingency:', `${assumptions.contingencyPercent}%`],
      ['Insurance:', `${assumptions.insurancePercent}%`],
      ['Completion Bond:', `${assumptions.bondPercent}%`],
    ];

    assumptionsList.forEach(([label, value]) => {
      doc
        .text(label, 50, doc.y, { continued: true, width: 150 })
        .font('Helvetica-Bold')
        .text(value || 'N/A')
        .font('Helvetica')
        .moveDown(0.3);
    });

    doc.moveDown(1);
  }

  addBudgetLines(doc, lines, currency = 'USD') {
    if (doc.y > 650) {
      doc.addPage();
    }

    doc.fontSize(16).font('Helvetica-Bold')
      .text('Budget Breakdown by Phase')
      .moveDown(0.5);

    const byPhase = lines.reduce((acc, line) => {
      if (!acc[line.phase]) acc[line.phase] = [];
      acc[line.phase].push(line);
      return acc;
    }, {});

    Object.entries(byPhase).forEach(([phase, phaseLines]) => {
      if (doc.y > 700) {
        doc.addPage();
      }

      doc.fontSize(14).font('Helvetica-Bold')
        .fillColor(this.colors.primary)
        .text(phase)
        .fillColor('#000000')
        .moveDown(0.3);

      doc.fontSize(10).font('Helvetica-Bold');

      const tableTop = doc.y;
      doc.text('Item', 50, tableTop, { width: 180 });
      doc.text('Qty', 230, tableTop, { width: 40, align: 'right' });
      doc.text('Rate', 275, tableTop, { width: 70, align: 'right' });
      doc.text('Tax %', 350, tableTop, { width: 50, align: 'right' });
      doc.text('Total', 405, tableTop, { width: 90, align: 'right' });

      doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
      doc.moveDown(0.5);

      doc.font('Helvetica').fontSize(9);

      let phaseTotal = 0;

      phaseLines.forEach((line) => {
        if (doc.y > 750) {
          doc.addPage();
          doc.y = 50;
        }

        const subtotal = line.qty * line.rate;
        const tax = subtotal * (line.taxPercent || 0) / 100;
        const total = subtotal + tax;
        phaseTotal += total;

        const rowY = doc.y;
        doc.text(line.name, 50, rowY, { width: 175 });
        doc.text(line.qty.toString(), 230, rowY, { width: 40, align: 'right' });
        doc.text(this.formatCurrency(line.rate, currency), 275, rowY, { width: 70, align: 'right' });
        doc.text(`${line.taxPercent || 0}%`, 350, rowY, { width: 50, align: 'right' });
        doc.text(this.formatCurrency(total, currency), 405, rowY, { width: 90, align: 'right' });

        doc.moveDown(0.8);
      });

      doc.font('Helvetica-Bold').fontSize(10);
      doc.text(`${phase} Subtotal:`, 350, doc.y, { width: 100, align: 'right', continued: true })
        .text(this.formatCurrency(phaseTotal, currency), { width: 90, align: 'right' });

      doc.moveDown(1.5);
      doc.font('Helvetica');
    });
  }

  addFinancingPlan(doc, financingPlan) {
    if (doc.y > 650) {
      doc.addPage();
    }

    doc.fontSize(16).font('Helvetica-Bold')
      .text('Financing Plan')
      .moveDown(0.5);

    if (!financingPlan.sources || financingPlan.sources.length === 0) {
      doc.fontSize(11).font('Helvetica').text('No financing sources specified.').moveDown(1);
      return;
    }

    doc.fontSize(10).font('Helvetica-Bold');
    const tableTop = doc.y;
    doc.text('Type', 50, tableTop, { width: 100 });
    doc.text('Amount', 200, tableTop, { width: 100, align: 'right' });
    doc.text('Rate', 320, tableTop, { width: 80, align: 'right' });
    doc.text('Description', 410, tableTop, { width: 135 });

    doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(9);

    financingPlan.sources.forEach((source) => {
      const rowY = doc.y;
      doc.text(source.type, 50, rowY, { width: 100 });
      doc.text(this.formatCurrency(source.amount, 'USD'), 200, rowY, { width: 100, align: 'right' });
      doc.text(source.rate ? `${source.rate}%` : '-', 320, rowY, { width: 80, align: 'right' });
      doc.text(source.description || '-', 410, rowY, { width: 135 });
      doc.moveDown(0.8);
    });

    doc.moveDown(1);
  }

  addRevenueModel(doc, revenueModel) {
    if (doc.y > 650) {
      doc.addPage();
    }

    doc.fontSize(16).font('Helvetica-Bold')
      .text('Revenue Model')
      .moveDown(0.5);

    doc.fontSize(11).font('Helvetica');

    const distFees = revenueModel.grossRevenue * revenueModel.distributionFeePercent / 100;
    const netRevenue = revenueModel.grossRevenue - distFees;

    const info = [
      ['Gross Revenue:', this.formatCurrency(revenueModel.grossRevenue, 'USD')],
      ['Distribution Fee:', `${revenueModel.distributionFeePercent}%`],
      ['Distribution Fees Amount:', this.formatCurrency(distFees, 'USD')],
      ['Net Revenue:', this.formatCurrency(netRevenue, 'USD')],
    ];

    info.forEach(([label, value]) => {
      doc.text(label, 50, doc.y, { continued: true, width: 200 })
        .font('Helvetica-Bold')
        .text(value)
        .font('Helvetica')
        .moveDown(0.3);
    });

    doc.moveDown(1);
  }

  addROIMetrics(doc, metrics) {
    if (doc.y > 600) {
      doc.addPage();
    }

    doc.fontSize(16).font('Helvetica-Bold')
      .text('Return on Investment Analysis')
      .moveDown(0.5);

    doc.rect(50, doc.y, 495, 120).fillAndStroke('#fff8dc', '#ff8c00');
    doc.fillColor('#000000');

    const startY = doc.y + 15;
    doc.y = startY;

    doc.fontSize(11).font('Helvetica');

    const metricsData = [
      ['ROI:', `${metrics.roi.toFixed(2)}%`],
      ['IRR:', `${metrics.irr.toFixed(2)}%`],
      ['NPV:', this.formatCurrency(metrics.npv, 'USD')],
      ['Payback Period:', metrics.paybackPeriod ? `${metrics.paybackPeriod.toFixed(2)} years` : 'N/A'],
      ['Break-even Revenue:', this.formatCurrency(metrics.breakEvenRevenue, 'USD')],
      ['Profit Margin:', `${metrics.profitMargin.toFixed(2)}%`],
    ];

    let row = 0;
    metricsData.forEach(([label, value], index) => {
      const col = index % 2;
      const x = col === 0 ? 70 : 320;
      const y = startY + (row * 20);

      doc.text(label, x, y, { continued: true, width: 150 })
        .font('Helvetica-Bold')
        .text(value)
        .font('Helvetica');

      if (col === 1) row++;
    });

    doc.y = startY + 120;
    doc.moveDown(2);
  }

  // ============================================
  // COST REPORT HELPERS
  // ============================================
  addCostSummaryTable(doc, summary, currency) {
    doc.fontSize(14).font('Helvetica-Bold')
      .text('Cost Summary')
      .moveDown(0.5);

    const tableData = [
      ['Total Budget:', this.formatCurrency(summary.totalBudget, currency)],
      ['Total Committed:', this.formatCurrency(summary.totalCommitted, currency)],
      ['Total Spent:', this.formatCurrency(summary.totalSpent, currency)],
      ['Estimate Final Cost (EFC):', this.formatCurrency(summary.efc, currency)],
      ['Variance:', this.formatCurrency(summary.variance, currency), summary.variance < 0 ? 'danger' : 'success'],
      ['Variance %:', `${summary.variancePercent?.toFixed(2)}%`, summary.variancePercent < 0 ? 'danger' : 'success'],
    ];

    doc.fontSize(11).font('Helvetica');

    tableData.forEach(([label, value, colorType]) => {
      const color =
        colorType === 'danger'
          ? this.colors.danger
          : colorType === 'success'
          ? this.colors.success
          : '#000000';

      doc
        .fillColor('#000000')
        .text(label, 50, doc.y, { continued: true, width: 250 })
        .fillColor(color)
        .font('Helvetica-Bold')
        .text(value)
        .fillColor('#000000')
        .font('Helvetica')
        .moveDown(0.4);
    });

    doc.moveDown(1);
  }

  addPhaseBreakdown(doc, byPhase, currency) {
    Object.entries(byPhase).forEach(([phase, data]) => {
      if (doc.y > 700) doc.addPage();

      doc.fontSize(12).font('Helvetica-Bold')
        .fillColor(this.colors.primary)
        .text(phase)
        .fillColor('#000000')
        .moveDown(0.3);

      doc.fontSize(10).font('Helvetica-Bold');
      const tableTop = doc.y;
      doc.text('', 50, tableTop, { width: 150 });
      doc.text('Budget', 200, tableTop, { width: 80, align: 'right' });
      doc.text('Committed', 285, tableTop, { width: 80, align: 'right' });
      doc.text('Spent', 370, tableTop, { width: 80, align: 'right' });
      doc.text('Variance', 455, tableTop, { width: 80, align: 'right' });

      doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
      doc.moveDown(0.5);

      doc.font('Helvetica').fontSize(9);
      const rowY = doc.y;
      doc.text(phase, 50, rowY, { width: 150 });
      doc.text(this.formatCurrency(data.budgeted, currency), 200, rowY, { width: 80, align: 'right' });
      doc.text(this.formatCurrency(data.committed, currency), 285, rowY, { width: 80, align: 'right' });
      doc.text(this.formatCurrency(data.spent, currency), 370, rowY, { width: 80, align: 'right' });

      const varianceColor = data.variance < 0 ? this.colors.danger : this.colors.success;
      doc
        .fillColor(varianceColor)
        .text(this.formatCurrency(data.variance, currency), 455, rowY, { width: 80, align: 'right' })
        .fillColor('#000000');

      doc.moveDown(1.5);
    });
  }

  addVarianceDetails(doc, variances, currency) {
    doc.fontSize(10).font('Helvetica-Bold');
    const tableTop = doc.y;
    doc.text('Line Item', 50, tableTop, { width: 180 });
    doc.text('Budget', 235, tableTop, { width: 70, align: 'right' });
    doc.text('Spent', 310, tableTop, { width: 70, align: 'right' });
    doc.text('Variance', 385, tableTop, { width: 70, align: 'right' });
    doc.text('Variance %', 460, tableTop, { width: 75, align: 'right' });

    doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(9);

    variances.forEach((item) => {
      if (doc.y > 750) {
        doc.addPage();
        doc.y = 50;
      }

      const rowY = doc.y;
      doc.text(item.name, 50, rowY, { width: 175 });
      doc.text(this.formatCurrency(item.budgeted, currency), 235, rowY, { width: 70, align: 'right' });
      doc.text(this.formatCurrency(item.spent, currency), 310, rowY, { width: 70, align: 'right' });

      const varianceColor = item.variance < 0 ? this.colors.danger : this.colors.success;
      doc
        .fillColor(varianceColor)
        .text(this.formatCurrency(item.variance, currency), 385, rowY, { width: 70, align: 'right' })
        .text(`${item.variancePercent.toFixed(1)}%`, 460, rowY, { width: 75, align: 'right' })
        .fillColor('#000000');

      doc.moveDown(0.8);
    });
  }

  // ============================================
  // CASHFLOW HELPERS
  // ============================================
  addCashflowSummary(doc, summary, currency) {
    doc.fontSize(14).font('Helvetica-Bold')
      .text('Summary')
      .moveDown(0.5);

    doc.rect(50, doc.y, 495, 60).fillAndStroke('#e8f4f8', this.colors.info);
    doc.fillColor('#000000');

    const startY = doc.y + 10;
    doc.fontSize(11).font('Helvetica');

    doc.text(`Total Inflows: ${this.formatCurrency(summary.totalInflows, currency)}`, 70, startY);
    doc.text(`Total Outflows: ${this.formatCurrency(summary.totalOutflows, currency)}`, 320, startY);
    doc.text(`Net Position: ${this.formatCurrency(summary.netPosition, currency)}`, 70, startY + 25);
    doc.text(`Final Cumulative: ${this.formatCurrency(summary.finalCumulative, currency)}`, 320, startY + 25);

    doc.y = startY + 60;
    doc.moveDown(2);
  }

  addWeeklyCashflow(doc, weeks, currency) {
    doc.fontSize(14).font('Helvetica-Bold')
      .text('Weekly Cashflow')
      .moveDown(0.5);

    doc.fontSize(9).font('Helvetica-Bold');
    const tableTop = doc.y;
    doc.text('Week Starting', 50, tableTop, { width: 85 });
    doc.text('Inflows', 140, tableTop, { width: 75, align: 'right' });
    doc.text('Outflows', 220, tableTop, { width: 75, align: 'right' });
    doc.text('Net', 300, tableTop, { width: 75, align: 'right' });
    doc.text('Cumulative', 380, tableTop, { width: 85, align: 'right' });
    doc.text('Status', 470, tableTop, { width: 65, align: 'center' });

    doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(8);

    weeks.forEach((week) => {
      if (doc.y > 750) {
        doc.addPage();
        doc.y = 50;
      }

            const rowY = doc.y;
      doc.text(new Date(week.weekStart).toLocaleDateString(), 50, rowY, { width: 85 });
      doc.text(this.formatCurrency(week.inflows, currency), 140, rowY, { width: 75, align: 'right' });
      doc.text(this.formatCurrency(week.outflows, currency), 220, rowY, { width: 75, align: 'right' });

      const net = week.inflows - week.outflows;
      const netColor = net < 0 ? this.colors.danger : this.colors.success;
      doc
        .fillColor(netColor)
        .text(this.formatCurrency(net, currency), 300, rowY, { width: 75, align: 'right' })
        .fillColor('#000000');

      const cumulativeColor = week.cumulative < 0 ? this.colors.danger : this.colors.success;
      doc
        .fillColor(cumulativeColor)
        .text(this.formatCurrency(week.cumulative, currency), 380, rowY, { width: 85, align: 'right' })
        .fillColor('#000000');

      const status = week.cumulative < 0 ? '⚠️ Alert' : '✓ OK';
      doc.text(status, 470, rowY, { width: 65, align: 'center' });

      doc.moveDown(0.7);
    });
  }

  addCashflowAlerts(doc, alerts) {
    doc.fontSize(11).font('Helvetica');

    alerts.forEach((alert, index) => {
      doc
        .fillColor(this.colors.warning)
        .text(`⚠️ Week ${index + 1}: ${alert.message}`, { indent: 20 })
        .fillColor('#000000')
        .moveDown(0.5);
    });
  }

  // ============================================
  // WATERFALL / PO / INVOICE HELPERS
  // ============================================
  addRevenueSummary(doc, revenue, currency) {
    doc.fontSize(14).font('Helvetica-Bold')
      .text('Revenue Summary')
      .moveDown(0.5);

    doc.fontSize(11).font('Helvetica');
    const data = [
      ['Gross Revenue:', this.formatCurrency(revenue.gross, currency)],
      ['Distribution Fees:', this.formatCurrency(revenue.fees, currency)],
      ['Expenses:', this.formatCurrency(revenue.expenses, currency)],
      ['Net Receipts:', this.formatCurrency(revenue.net, currency)],
    ];

    data.forEach(([label, value]) => {
      doc
        .text(label, 50, doc.y, { continued: true, width: 200 })
        .font('Helvetica-Bold')
        .text(value)
        .font('Helvetica')
        .moveDown(0.3);
    });

    doc.moveDown(1);
  }

  addWaterfallTiers(doc, tiers, currency) {
    doc.fontSize(14).font('Helvetica-Bold')
      .text('Waterfall Tiers')
      .moveDown(0.5);

    doc.fontSize(10).font('Helvetica-Bold');
    const tableTop = doc.y;
    doc.text('Tier', 50, tableTop, { width: 40 });
    doc.text('Description', 95, tableTop, { width: 200 });
    doc.text('Split %', 300, tableTop, { width: 70, align: 'right' });
    doc.text('Amount', 375, tableTop, { width: 90, align: 'right' });

    doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(9);

    tiers.forEach((tier) => {
      const rowY = doc.y;
      doc.text(tier.order.toString(), 50, rowY, { width: 40 });
      doc.text(tier.description, 95, rowY, { width: 200 });
      doc.text(`${tier.pctSplit}%`, 300, rowY, { width: 70, align: 'right' });
      doc.text(this.formatCurrency(tier.amount, currency), 375, rowY, { width: 90, align: 'right' });
      doc.moveDown(0.8);
    });

    doc.moveDown(1);
  }

  addParticipantPayouts(doc, payouts, currency) {
    doc.fontSize(14).font('Helvetica-Bold')
      .text('Participant Distributions')
      .moveDown(0.5);

    doc.fontSize(10).font('Helvetica-Bold');
    const tableTop = doc.y;
    doc.text('Participant', 50, tableTop, { width: 150 });
    doc.text('Role', 205, tableTop, { width: 100 });
    doc.text('Share %', 310, tableTop, { width: 70, align: 'right' });
    doc.text('Amount', 385, tableTop, { width: 90, align: 'right' });

    doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(9);

    payouts.forEach((payout) => {
      const rowY = doc.y;
      doc.text(payout.name, 50, rowY, { width: 150 });
      doc.text(payout.role, 205, rowY, { width: 100 });
      doc.text(`${payout.pctShare}%`, 310, rowY, { width: 70, align: 'right' });
      doc.text(this.formatCurrency(payout.amount, currency), 385, rowY, { width: 90, align: 'right' });
      doc.moveDown(0.8);
    });
  }

  addCumulativeSummary(doc, cumulative, currency) {
    doc.fontSize(14).font('Helvetica-Bold')
      .text('Cumulative Summary (Project to Date)')
      .moveDown(0.5);

    doc.fontSize(11).font('Helvetica');
    const data = [
      ['Total Revenue Received:', this.formatCurrency(cumulative.totalRevenue, currency)],
      ['Total Distributions:', this.formatCurrency(cumulative.totalDistributed, currency)],
      ['Remaining Pool:', this.formatCurrency(cumulative.remaining, currency)],
    ];

    data.forEach(([label, value]) => {
      doc
        .text(label, 50, doc.y, { continued: true, width: 250 })
        .font('Helvetica-Bold')
        .text(value)
        .font('Helvetica')
        .moveDown(0.3);
    });
  }

  addPOItemsTable(doc, poData) {
    doc.fontSize(12).font('Helvetica-Bold')
      .text('ORDER DETAILS')
      .moveDown(0.5);

    doc.fontSize(10).font('Helvetica-Bold');
    const tableTop = doc.y;
    doc.text('Description', 50, tableTop, { width: 250 });
    doc.text('Phase', 305, tableTop, { width: 80 });
    doc.text('Amount', 390, tableTop, { width: 100, align: 'right' });

    doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(9);

    const rowY = doc.y;
    doc.text(poData.description || 'Purchase Order', 50, rowY, { width: 250 });
    doc.text(poData.budgetLine?.phase || 'N/A', 305, rowY, { width: 80 });
    doc.text(this.formatCurrency(poData.amount, poData.vendor.currency), 390, rowY, { width: 100, align: 'right' });

    doc.moveDown(1.5);

    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('TOTAL:', 305, doc.y, { width: 80, align: 'right', continued: true })
      .text(this.formatCurrency(poData.amount, poData.vendor.currency), { width: 100, align: 'right' });
  }

  addInvoiceItemsTable(doc, invoiceData) {
    doc.fontSize(12).font('Helvetica-Bold')
      .text('INVOICE DETAILS')
      .moveDown(0.5);

    doc.fontSize(10).font('Helvetica-Bold');
    const tableTop = doc.y;
    doc.text('Description', 50, tableTop, { width: 300 });
    doc.text('Amount', 355, tableTop, { width: 135, align: 'right' });

    doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(9);

    const rowY = doc.y;
    doc.text(invoiceData.description || `Invoice ${invoiceData.docNo}`, 50, rowY, { width: 300 });
    doc.text(this.formatCurrency(invoiceData.amount, invoiceData.vendor.currency), 355, rowY, { width: 135, align: 'right' });

    doc.moveDown(1.5);

    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('TOTAL AMOUNT DUE:', 305, doc.y, { width: 100, align: 'right', continued: true })
      .text(this.formatCurrency(invoiceData.amount, invoiceData.vendor.currency), { width: 135, align: 'right' });
  }

  addPaymentHistory(doc, payments) {
    doc.fontSize(12).font('Helvetica-Bold')
      .text('Payment History')
      .moveDown(0.5);

    doc.fontSize(9).font('Helvetica-Bold');
    const tableTop = doc.y;
    doc.text('Date', 50, tableTop, { width: 100 });
    doc.text('Amount', 155, tableTop, { width: 100, align: 'right' });
    doc.text('Method', 260, tableTop, { width: 100 });
    doc.text('Status', 365, tableTop, { width: 80 });

    doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(8);

    payments.forEach((payment) => {
      const rowY = doc.y;
      doc.text(new Date(payment.paidOn || payment.createdAt).toLocaleDateString(), 50, rowY, { width: 100 });
      doc.text(this.formatCurrency(payment.amount, 'USD'), 155, rowY, { width: 100, align: 'right' });
      doc.text(payment.method || 'N/A', 260, rowY, { width: 100 });
      doc.text(payment.status, 365, rowY, { width: 80 });
      doc.moveDown(0.7);
    });
  }

  addBudgetByPhase(doc, lines, currency) {
    const byPhase = lines.reduce((acc, line) => {
      if (!acc[line.phase]) acc[line.phase] = { total: 0, count: 0 };
      const lineTotal = line.qty * line.rate * (1 + (line.taxPercent || 0) / 100);
      acc[line.phase].total += lineTotal;
      acc[line.phase].count += 1;
      return acc;
    }, {});

    doc.fontSize(14).font('Helvetica-Bold')
      .text('Breakdown by Phase')
      .moveDown(0.5);

    doc.fontSize(10).font('Helvetica-Bold');
    const tableTop = doc.y;
    doc.text('Phase', 50, tableTop, { width: 150 });
    doc.text('Items', 205, tableTop, { width: 60, align: 'right' });
    doc.text('Total', 270, tableTop, { width: 120, align: 'right' });

    doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(9);

    Object.entries(byPhase).forEach(([phase, data]) => {
      const rowY = doc.y;
      doc.text(phase, 50, rowY, { width: 150 });
      doc.text(data.count.toString(), 205, rowY, { width: 60, align: 'right' });
      doc.text(this.formatCurrency(data.total, currency), 270, rowY, { width: 120, align: 'right' });
      doc.moveDown(0.8);
    });
  }

  addProjectFinancialSummary(doc, summary, currency) {
    doc.fontSize(14).font('Helvetica-Bold')
      .text('Financial Summary')
      .moveDown(0.5);

    doc.rect(50, doc.y, 495, 100).fillAndStroke('#f0f8ff', this.colors.primary);
    doc.fillColor('#000000');

    const startY = doc.y + 15;
    doc.fontSize(11).font('Helvetica');

    const data = [
      ['Total Budget:', this.formatCurrency(summary.budget, currency)],
      ['Total Spent:', this.formatCurrency(summary.spent, currency)],
      ['Committed:', this.formatCurrency(summary.committed, currency)],
      ['Remaining:', this.formatCurrency(summary.remaining, currency)],
      ['Completion %:', `${summary.completionPercent.toFixed(1)}%`],
    ];

    let row = 0;
    data.forEach(([label, value], index) => {
      const col = index % 2;
      const x = col === 0 ? 70 : 320;
      const y = startY + row * 18;

      doc.text(label, x, y, { continued: true, width: 130 })
        .font('Helvetica-Bold')
        .text(value)
        .font('Helvetica');

      if (col === 1) row++;
    });

    doc.y = startY + 100;
    doc.moveDown(2);
  }

  addProjectMetrics(doc, metrics) {
    doc.fontSize(14).font('Helvetica-Bold')
      .text('Key Performance Indicators')
      .moveDown(0.5);

    doc.fontSize(11).font('Helvetica');

    const data = [
      ['Days in Production:', metrics.daysInProduction || 'N/A'],
      ['Budget Utilization:', `${metrics.budgetUtilization?.toFixed(1)}%`],
      ['Schedule Status:', metrics.scheduleStatus || 'On Track'],
      ['Active Purchase Orders:', metrics.activePOs || 0],
      ['Pending Approvals:', metrics.pendingApprovals || 0],
    ];

    data.forEach(([label, value]) => {
      doc.text(label, 50, doc.y, { continued: true, width: 200 })
        .font('Helvetica-Bold')
        .text(value.toString())
        .font('Helvetica')
        .moveDown(0.4);
    });
  }

  addProjectTeam(doc, team) {
    doc.fontSize(14).font('Helvetica-Bold')
      .text('Project Team')
      .moveDown(0.5);

    doc.fontSize(10).font('Helvetica-Bold');
    const tableTop = doc.y;
    doc.text('Name', 50, tableTop, { width: 150 });
    doc.text('Role', 205, tableTop, { width: 150 });
    doc.text('Email', 360, tableTop, { width: 180 });

    doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(9);

    team.forEach((member) => {
      const rowY = doc.y;
      doc.text(member.name, 50, rowY, { width: 150 });
      doc.text(member.role, 205, rowY, { width: 150 });
      doc.text(member.email, 360, rowY, { width: 180 });
      doc.moveDown(0.8);
    });
  }

  // ============================================
  // UTILS
  // ============================================
  formatCurrency(amount, currency = 'USD') {
    const symbols = { USD: '$', EUR: '€', GBP: '£', NPR: 'Rs.' };
    const symbol = symbols[currency] || currency;
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
    return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
  }

  calculateDueDate(invoiceDate, terms = 30) {
    const due = new Date(invoiceDate);
    due.setDate(due.getDate() + terms);
    return due.toLocaleDateString();
  }
}
