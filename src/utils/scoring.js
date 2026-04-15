// Linear regression slope — fits a trend line through all data points
// Returns the slope normalized as a percentage of the mean value
function trendSlope(values) {
  if (!values || values.length < 2) return 0;
  const n = values.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return 0;
  const slope = (n * sumXY - sumX * sumY) / denom;
  if (isNaN(slope)) return 0;
  const mean = sumY / n;
  if (mean === 0) return 0;
  return slope / Math.abs(mean);
}

// Direction: 'up', 'flat', or 'down'
function getDirection(values) {
  if (!values || values.length < 2) return 'down';
  const slope = trendSlope(values);
  if (slope > 0.01) return 'up';
  if (slope < -0.01) return 'down';
  return 'flat';
}

// Two-factor scoring: level (is the value good?) + direction (is it improving?)
// Good level + up/flat = pass | Good level + down = neutral | Bad level + up = neutral | Bad level + flat/down = fail
function twoFactor(values, levelCheck) {
  const dir = getDirection(values);
  const goodLevel = levelCheck(values);

  if (goodLevel && (dir === 'up' || dir === 'flat')) return 'pass';
  if (goodLevel && dir === 'down') return 'neutral';
  if (!goodLevel && dir === 'up') return 'neutral';
  return 'fail';
}

// Inverted two-factor for debt: lower is better
function twoFactorInverted(values, levelCheck) {
  const dir = getDirection(values);
  const goodLevel = levelCheck(values);

  if (goodLevel && (dir === 'down' || dir === 'flat')) return 'pass';
  if (goodLevel && dir === 'up') return 'neutral';
  if (!goodLevel && dir === 'down') return 'neutral';
  return 'fail';
}

// Level checks — evaluate the 5-year average
function avgAbove(threshold) {
  return (values) => {
    if (!values || values.length === 0) return false;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return avg > threshold;
  };
}

function avgBelow(threshold) {
  return (values) => {
    if (!values || values.length === 0) return false;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return avg < threshold;
  };
}

export function calculateHealthScore(financials) {
  const {
    revenue,
    netIncome,
    freeCashFlow,
  } = financials;

  const checks = {
    // Growth (3 points) — level: average value positive
    revenueGrowth: twoFactor(revenue, avgAbove(0)),
    netIncomeGrowth: twoFactor(netIncome, avgAbove(0)),
    fcfGrowth: twoFactor(freeCashFlow, avgAbove(0)),

    // Profitability (2 points) — level: avg margin > 10%, avg ROIC > 10%
    profitMarginAbove10: twoFactor(financials.profitMarginHistory, avgAbove(0.10)),
    roicTrend: twoFactor(financials.roicHistory, avgAbove(0.10)),

    // Safety (1 point) — level: avg net debt/capital < 50%, inverted (lower is better)
    // If avg is negative (net cash position), always pass
    netDebtCapital: (() => {
      const arr = financials.netDebtCapitalHistory;
      if (arr && arr.length >= 2) {
        const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
        if (avg < 0) return 'pass'; // net cash = always healthy
      }
      return twoFactorInverted(arr, avgBelow(0.50));
    })(),
  };

  function smartRound(num) {
    return num % 1 >= 0.5 || num % 1 <= -0.5 ? Math.round(num) : num.toFixed(1);
  }

  function fmtTrend(arr) {
    if (!arr || arr.length < 2) return null;
    const slope = trendSlope(arr) * 100;
    return (slope >= 0 ? '+' : '') + slope.toFixed(1) + '% avg annual trend';
  }

  const values = {
    revenueGrowth: fmtTrend(revenue),
    netIncomeGrowth: fmtTrend(netIncome),
    fcfGrowth: fmtTrend(freeCashFlow),
    profitMarginAbove10: fmtTrend(financials.profitMarginHistory),
    roicTrend: fmtTrend(financials.roicHistory),
    netDebtCapital: fmtTrend(financials.netDebtCapitalHistory),
  };

  // Check how many metrics have actual data (>= 2 data points)
  const dataArrays = [revenue, netIncome, freeCashFlow, financials.profitMarginHistory, financials.roicHistory, financials.netDebtCapitalHistory];
  const hasData = dataArrays.filter(arr => arr && arr.length >= 2).length;

  // If fewer than 3 out of 6 metrics have data, mark as insufficient
  if (hasData < 3) {
    return { score: null, checks, values: {}, sparklines: {}, verdict: 'Insufficient Data' };
  }

  const weights = {
    revenueGrowth: 2,
    netIncomeGrowth: 2,
    fcfGrowth: 1,
    profitMarginAbove10: 1.5,
    roicTrend: 1.5,
    netDebtCapital: 2,
  };

  const score = Object.entries(checks).reduce((total, [key, v]) => {
    const w = weights[key] || 1;
    if (v === 'pass') return total + w;
    if (v === 'neutral') return total + w * 0.5;
    return total;
  }, 0);

  // Round to nearest 0.5
  const roundedScore = Math.round(score * 2) / 2;

  let verdict;
  if (roundedScore >= 8) verdict = 'Healthy';
  else if (roundedScore >= 5) verdict = 'Watch';
  else verdict = 'Unhealthy';

  const sparklines = {
    revenueGrowth: revenue,
    netIncomeGrowth: netIncome,
    fcfGrowth: freeCashFlow,
    profitMarginAbove10: financials.profitMarginHistory,
    roicTrend: financials.roicHistory,
    netDebtCapital: financials.netDebtCapitalHistory,
  };

  return { score: roundedScore, checks, values, sparklines, verdict };
}

export function calculateValuation(financials) {
  const { eps, epsHistory, currentPrice, peHistory, trailingPE } = financials;

  if (!eps || !currentPrice || eps <= 0) {
    return { fairPE: null, fairValue: null, verdict: 'N/A', ratio: null };
  }

  // Primary method: use 5-year average historical P/E if available
  // This reflects what the market has historically been willing to pay
  let fairPE = null;
  let method = null;

  if (peHistory && peHistory.length > 0) {
    const validPEs = peHistory.filter(pe => pe != null && pe > 0 && pe < 200);
    if (validPEs.length >= 3) {
      const avg = validPEs.reduce((a, b) => a + b, 0) / validPEs.length;
      fairPE = avg;
      method = 'historical';
    }
  }

  // Fallback: growth-based P/E (EPS growth rate * 2)
  if (!fairPE && epsHistory && epsHistory.length >= 2) {
    const growthRates = [];
    for (let i = 1; i < epsHistory.length; i++) {
      if (epsHistory[i - 1] > 0 && epsHistory[i] > 0) {
        growthRates.push((epsHistory[i] - epsHistory[i - 1]) / epsHistory[i - 1]);
      }
    }
    if (growthRates.length > 0) {
      const avgGrowthRate = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
      const growthPct = avgGrowthRate * 100;
      fairPE = Math.max(growthPct * 2, 8);
      method = 'growth';
    }
  }

  // Third fallback: use current trailing P/E
  if (!fairPE && trailingPE && trailingPE > 0 && trailingPE < 200) {
    fairPE = trailingPE;
    method = 'trailing';
  }

  if (!fairPE) {
    return { fairPE: null, fairValue: null, verdict: 'N/A', ratio: null };
  }

  const fairValue = eps * fairPE;
  const ratio = currentPrice / fairValue;

  // Calculate growth rate for display (even when using historical P/E)
  let growthRate = null;
  if (epsHistory && epsHistory.length >= 2) {
    const rates = [];
    for (let i = 1; i < epsHistory.length; i++) {
      if (epsHistory[i - 1] > 0 && epsHistory[i] > 0) {
        rates.push((epsHistory[i] - epsHistory[i - 1]) / epsHistory[i - 1]);
      }
    }
    if (rates.length > 0) {
      growthRate = (rates.reduce((a, b) => a + b, 0) / rates.length) * 100;
    }
  }

  let verdict;
  if (ratio < 0.75) verdict = 'Undervalued';
  else if (ratio <= 1.25) verdict = 'Fair';
  else verdict = 'Overvalued';

  return { fairPE, fairValue, verdict, ratio, growthRate, method };
}

export function getFinalSignal(healthVerdict, valuationVerdict) {
  if (healthVerdict === 'Insufficient Data') {
    return { signal: 'NO DATA', type: 'hold' };
  }

  if (healthVerdict === 'Unhealthy') {
    return { signal: 'AVOID', type: 'sell' };
  }

  if (healthVerdict === 'Healthy') {
    if (valuationVerdict === 'Undervalued') return { signal: 'STRONG BUY', type: 'buy' };
    if (valuationVerdict === 'Fair') return { signal: 'BUY', type: 'buy' };
    return { signal: 'HOLD', type: 'hold' };
  }

  // Watch
  if (valuationVerdict === 'Undervalued') return { signal: 'HOLD', type: 'hold' };
  return { signal: 'WATCH', type: 'hold' };
}
