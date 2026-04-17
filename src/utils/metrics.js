export function calculateMetrics(periods) {
  // Calculate for all periods, then trim to 5 for display.
  // The 6th period exists only to provide prior-year data for the 5th.
  const all = periods.map((period, index) => {
    const prev = periods[index + 1] || null;

    // Internal calculations
    const taxRate =
      period.preTaxIncome && period.incomeTaxExpense !== null
        ? period.incomeTaxExpense / period.preTaxIncome
        : null;

    const nopat =
      period.operatingIncome !== null && taxRate !== null
        ? period.operatingIncome * (1 - taxRate)
        : null;

    const investedCapital =
      period.totalDebt !== null &&
      period.shareholdersEquity !== null &&
      period.cash !== null
        ? period.totalDebt + period.shareholdersEquity - period.cash
        : null;

    const prevInvestedCapital =
      prev &&
      prev.totalDebt !== null &&
      prev.shareholdersEquity !== null &&
      prev.cash !== null
        ? prev.totalDebt + prev.shareholdersEquity - prev.cash
        : null;

    // Prefer averaging with prior year; fall back to end-of-period
    // invested capital when prior-year data is unavailable.
    const avgInvestedCapital =
      investedCapital !== null && prevInvestedCapital !== null
        ? (investedCapital + prevInvestedCapital) / 2
        : investedCapital;

    // FCF = CFO + CFI (CFI is typically negative)
    const fcf =
      period.cfo !== null && period.cfi !== null
        ? period.cfo + period.cfi
        : null;

    // ROIC
    const roic =
      nopat !== null && avgInvestedCapital !== null && avgInvestedCapital !== 0
        ? nopat / avgInvestedCapital
        : null;

    // Earnings Quality: CFO / Net Income. Only meaningful when NI > 0;
    // loss years make the ratio a misleading negative, so mark N/A.
    const earningsQuality =
      period.cfo !== null && period.netIncome !== null && period.netIncome > 0
        ? period.cfo / period.netIncome
        : null;

    // Operating Margin: OperatingIncome / Revenue
    const operatingMargin =
      period.operatingIncome !== null && period.revenue !== null && period.revenue > 0
        ? period.operatingIncome / period.revenue
        : null;

    // FCF Margin: FCF / Revenue
    const fcfMargin =
      fcf !== null && period.revenue !== null && period.revenue > 0
        ? fcf / period.revenue
        : null;

    // Investment Intensity: |CFI| / |CFO|
    const investmentIntensity =
      period.cfo !== null && period.cfi !== null && period.cfo !== 0
        ? Math.abs(period.cfi) / Math.abs(period.cfo)
        : null;

    // Years to Pay Off Debt: LongTermDebt / EBITDA
    const ebitda =
      period.operatingIncome !== null
        ? period.operatingIncome + (period.depreciation ?? 0)
        : null;
    const debtToEbitda =
      period.longTermDebt !== null && ebitda !== null && ebitda > 0
        ? period.longTermDebt / ebitda
        : null;

    return {
      year: period.year,
      revenue: period.revenue,
      netIncome: period.netIncome,
      cfo: period.cfo,
      fcf,
      totalDebt: period.totalDebt,
      cash: period.cash,
      cfi: period.cfi,
      cff: period.cff,
      roic,
      operatingMargin,
      fcfMargin,
      earningsQuality,
      investmentIntensity,
      debtToEbitda,
    };
  });

  return all.slice(0, 5);
}

