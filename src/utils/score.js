function cagr(newest, oldest, years) {
  if (newest === null || oldest === null || oldest <= 0 || years <= 0) return null;
  return Math.pow(newest / oldest, 1 / years) - 1;
}

function seriesCAGR(values, years) {
  const pairs = values
    .map((v, i) => ({ value: v, year: years[i] }))
    .filter((p) => p.value !== null && p.value > 0);
  if (pairs.length < 2) return null;
  const newest = pairs[0];
  const oldest = pairs[pairs.length - 1];
  return cagr(newest.value, oldest.value, newest.year - oldest.year);
}

function mean(values) {
  const valid = values.filter((v) => v !== null && !Number.isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function stdev(values) {
  const valid = values.filter((v) => v !== null && !Number.isNaN(v));
  if (valid.length < 2) return null;
  const m = mean(valid);
  const variance = valid.reduce((acc, v) => acc + (v - m) ** 2, 0) / valid.length;
  return Math.sqrt(variance);
}

// Scoring helpers: map a value through {high, mid} thresholds to {1, 0.5, 0}.
// When higherIsBetter=false, the logic flips.
function band(value, high, mid, higherIsBetter = true) {
  if (value === null || value === undefined || Number.isNaN(value)) return 0;
  if (higherIsBetter) {
    if (value >= high) return 1;
    if (value >= mid) return 0.5;
    return 0;
  }
  if (value <= high) return 1;
  if (value <= mid) return 0.5;
  return 0;
}

function firstNonNull(values) {
  for (const v of values) if (v !== null && v !== undefined) return v;
  return null;
}

export function calculateQualityScore(metrics) {
  const years = metrics.map((m) => m.year);
  const roicSeries = metrics.map((m) => m.roic);
  const revenueSeries = metrics.map((m) => m.revenue);
  const fcfSeries = metrics.map((m) => m.fcf);
  const eqSeries = metrics.map((m) => m.earningsQuality);

  // Pillar 1: Returns on Capital
  const latestRoic = firstNonNull(roicSeries);
  const avgRoic = mean(roicSeries);
  const p1Latest = band(latestRoic, 0.2, 0.1);
  const p1Avg = band(avgRoic, 0.15, 0.08);

  // Pillar 2: Growth
  const revCagr = seriesCAGR(revenueSeries, years);
  const fcfCagr = seriesCAGR(fcfSeries, years);
  const p2Rev = band(revCagr, 0.1, 0.03);
  const p2Fcf = band(fcfCagr, 0.1, 0.03);

  // Pillar 3: Earnings Quality
  const avgEq = mean(eqSeries);
  const validEq = eqSeries.filter((v) => v !== null);
  const worstEq = validEq.length > 0 ? Math.min(...validEq) : null;
  const p3Avg = band(avgEq, 1.0, 0.8);
  const p3Worst = band(worstEq, 0.7, 0.5);

  // Pillar 4: Balance Sheet Health
  const latest = metrics[0] || {};
  const latestDebtToEbitda = firstNonNull(metrics.map((m) => m.debtToEbitda));
  const p4Debt = band(latestDebtToEbitda, 2, 4, false);
  let p4Cash = 0;
  if (latest.totalDebt !== null && latest.cash !== null) {
    if (latest.totalDebt === 0 || latest.cash >= latest.totalDebt) p4Cash = 1;
    else {
      const ratio = latest.cash / latest.totalDebt;
      p4Cash = band(ratio, 0.3, 0.1);
    }
  }

  // Pillar 5: Consistency
  const roicStd = stdev(roicSeries);
  const roicCov =
    avgRoic !== null && avgRoic > 0 && roicStd !== null ? roicStd / avgRoic : null;
  const p5Stable = band(roicCov, 0.2, 0.5, false);
  const negativeFcfYears = fcfSeries.filter((v) => v !== null && v < 0).length;
  const p5FcfPositive = negativeFcfYears === 0 ? 1 : negativeFcfYears === 1 ? 0.5 : 0;

  const pillars = [
    {
      name: 'Does it earn well on what\u2019s invested?',
      score: p1Latest + p1Avg,
      detail: `Latest ROIC ${fmtPct(latestRoic)} · 5yr avg ${fmtPct(avgRoic)}`,
    },
    {
      name: 'Is the business growing?',
      score: p2Rev + p2Fcf,
      detail: `Revenue CAGR ${fmtPct(revCagr)} · FCF CAGR ${fmtPct(fcfCagr)}`,
    },
    {
      name: 'Are its profits real cash?',
      score: p3Avg + p3Worst,
      detail: `Avg CFO/NI ${fmtRatio(avgEq)} · Worst ${fmtRatio(worstEq)}`,
    },
    {
      name: 'Can it handle a downturn?',
      score: p4Debt + p4Cash,
      detail: `Debt/EBITDA ${fmtRatio(latestDebtToEbitda)} · Cash/Debt ${fmtCashDebt(latest)}`,
    },
    {
      name: 'Is it stable or boom-bust?',
      score: p5Stable + p5FcfPositive,
      detail: `ROIC volatility ${fmtPct(roicCov)} · ${negativeFcfYears} negative FCF yr${negativeFcfYears === 1 ? '' : 's'}`,
    },
  ];

  const total = pillars.reduce((sum, p) => sum + p.score, 0);
  const rating = ratingFor(total);
  return { total, rating, pillars };
}

function ratingFor(total) {
  if (total >= 8) return { label: 'Strong', tone: 'strong' };
  if (total >= 6) return { label: 'Solid', tone: 'solid' };
  if (total >= 4) return { label: 'Mixed', tone: 'mixed' };
  return { label: 'Weak', tone: 'weak' };
}

function fmtPct(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return 'N/A';
  return `${(v * 100).toFixed(1)}%`;
}
function fmtRatio(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return 'N/A';
  return `${v.toFixed(2)}x`;
}
function fmtCashDebt(latest) {
  if (!latest || latest.totalDebt === null || latest.cash === null) return 'N/A';
  if (latest.totalDebt === 0) return 'net cash';
  return `${(latest.cash / latest.totalDebt).toFixed(2)}x`;
}
