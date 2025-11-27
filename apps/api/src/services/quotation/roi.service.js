export class ROIService {
  /**
   * Calculate IRR (Internal Rate of Return) using Newton-Raphson method
   * @param {Array} cashflows - Array of {period: number, amount: number}
   * @param {number} initialGuess - Starting guess for IRR (default 0.1 = 10%)
   * @returns {number} IRR as decimal (e.g., 0.15 = 15%)
   */
  calculateIRR(cashflows, initialGuess = 0.1) {
    const maxIterations = 100;
    const tolerance = 0.00001;
    let irr = initialGuess;

    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let dnpv = 0;

      cashflows.forEach(cf => {
        const period = cf.period;
        const amount = cf.amount;
        npv += amount / Math.pow(1 + irr, period);
        dnpv -= (period * amount) / Math.pow(1 + irr, period + 1);
      });

      const newIrr = irr - npv / dnpv;

      if (Math.abs(newIrr - irr) < tolerance) {
        return newIrr;
      }

      irr = newIrr;
    }

    return irr;
  }

  /**
   * Calculate NPV (Net Present Value)
   * @param {Array} cashflows - Array of {period: number, amount: number}
   * @param {number} discountRate - Discount rate as decimal (e.g., 0.1 = 10%)
   * @returns {number} NPV
   */
  calculateNPV(cashflows, discountRate) {
    return cashflows.reduce((npv, cf) => {
      return npv + cf.amount / Math.pow(1 + discountRate, cf.period);
    }, 0);
  }

  /**
   * Calculate ROI (Return on Investment)
   * @param {number} totalInvestment
   * @param {number} totalReturn
   * @returns {number} ROI as percentage
   */
  calculateROI(totalInvestment, totalReturn) {
    if (totalInvestment === 0) return 0;
    return ((totalReturn - totalInvestment) / totalInvestment) * 100;
  }

  /**
   * Calculate Payback Period
   * @param {Array} cashflows - Array of {period: number, amount: number}
   * @returns {number} Payback period in years (fractional)
   */
  calculatePaybackPeriod(cashflows) {
    let cumulativeCashflow = 0;
    let previousCumulative = 0;

    for (let i = 0; i < cashflows.length; i++) {
      previousCumulative = cumulativeCashflow;
      cumulativeCashflow += cashflows[i].amount;

      if (cumulativeCashflow >= 0) {
        // Interpolate within the period
        const periodFraction = Math.abs(previousCumulative) / Math.abs(cashflows[i].amount);
        return cashflows[i].period - 1 + periodFraction;
      }
    }

    return null; // Never pays back
  }

  /**
   * Calculate Break-even Revenue
   * @param {number} totalCost - Total production cost
   * @param {number} distributionFeePercent - Distribution fee as percentage
   * @returns {number} Revenue needed to break even
   */
  calculateBreakEven(totalCost, distributionFeePercent = 20) {
    // Revenue - (Revenue * DistFee%) = TotalCost
    // Revenue * (1 - DistFee%) = TotalCost
    // Revenue = TotalCost / (1 - DistFee%)
    return totalCost / (1 - distributionFeePercent / 100);
  }

  /**
   * Generate comprehensive ROI metrics for a quotation
   * @param {Object} params - Calculation parameters
   * @returns {Object} Complete metrics
   */
  calculateComprehensiveMetrics(params) {
    const {
      totalCost,
      projectedRevenue,
      distributionFeePercent = 20,
      productionPeriodMonths = 12,
      revenuePeriodYears = 3,
      discountRate = 0.10,
    } = params;

    // Calculate distribution fees and net revenue
    const distributionFees = projectedRevenue * (distributionFeePercent / 100);
    const netRevenue = projectedRevenue - distributionFees;
    const profit = netRevenue - totalCost;

    // Calculate ROI
    const roi = this.calculateROI(totalCost, netRevenue);

    // Build cashflow array for IRR/NPV
    // Period 0: Initial investment (negative)
    // Period 1-N: Revenue inflows
    const cashflows = [
      { period: 0, amount: -totalCost }
    ];

    // Distribute revenue across years
    const revenuePerYear = projectedRevenue / revenuePeriodYears;
    for (let year = 1; year <= revenuePeriodYears; year++) {
      cashflows.push({
        period: year,
        amount: revenuePerYear * (1 - distributionFeePercent / 100)
      });
    }

    // Calculate IRR and NPV
    const irr = this.calculateIRR(cashflows) * 100; // Convert to percentage
    const npv = this.calculateNPV(cashflows, discountRate);

    // Calculate payback period
    const paybackPeriod = this.calculatePaybackPeriod(cashflows);

    // Calculate break-even
    const breakEvenRevenue = this.calculateBreakEven(totalCost, distributionFeePercent);

    return {
      totalCost,
      projectedRevenue,
      distributionFeePercent,
      distributionFees: parseFloat(distributionFees.toFixed(2)),
      netRevenue: parseFloat(netRevenue.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      roi: parseFloat(roi.toFixed(2)),
      irr: parseFloat(irr.toFixed(2)),
      npv: parseFloat(npv.toFixed(2)),
      paybackPeriod: paybackPeriod ? parseFloat(paybackPeriod.toFixed(2)) : null,
      breakEvenRevenue: parseFloat(breakEvenRevenue.toFixed(2)),
      profitMargin: totalCost > 0 ? parseFloat(((profit / totalCost) * 100).toFixed(2)) : 0,
    };
  }

  /**
   * Generate scenario analysis (Optimistic, Base, Pessimistic)
   * @param {Object} baseParams - Base case parameters
   * @returns {Object} Three scenarios
   */
  generateScenarios(baseParams) {
    const scenarios = {
      pessimistic: {
        ...baseParams,
        projectedRevenue: baseParams.projectedRevenue * 0.7, // 70% of base
        totalCost: baseParams.totalCost * 1.15, // 15% cost overrun
      },
      base: baseParams,
      optimistic: {
        ...baseParams,
        projectedRevenue: baseParams.projectedRevenue * 1.3, // 130% of base
        totalCost: baseParams.totalCost * 0.95, // 5% cost savings
      },
    };

    return {
      pessimistic: this.calculateComprehensiveMetrics(scenarios.pessimistic),
      base: this.calculateComprehensiveMetrics(scenarios.base),
      optimistic: this.calculateComprehensiveMetrics(scenarios.optimistic),
    };
  }
}
