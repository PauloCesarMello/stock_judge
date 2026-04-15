const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
const BASE = 'https://finnhub.io/api/v1';

function simplifyExchange(exchange) {
  if (!exchange) return '';
  const upper = exchange.toUpperCase();
  if (upper.includes('NASDAQ')) return 'NASDAQ';
  if (upper.includes('NEW YORK')) return 'NYSE';
  if (upper.includes('NYSE')) return 'NYSE';
  if (upper.includes('AMEX')) return 'AMEX';
  return exchange.split(' ')[0];
}

async function finnhubGet(endpoint, params = {}) {
  const url = new URL(`${BASE}${endpoint}`);
  url.searchParams.set('token', API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Finnhub API error: ${res.status}`);
  return res.json();
}

export async function getUSProfile(ticker) {
  const [profile, quote] = await Promise.all([
    finnhubGet('/stock/profile2', { symbol: ticker }),
    finnhubGet('/quote', { symbol: ticker }),
  ]);

  if (!profile.name) {
    throw new Error(`No data found for "${ticker}". For Brazilian stocks, include the share number (e.g. PETR4, VALE3).`);
  }

  // Fetch company description from Wikipedia — search by name + ticker for accuracy
  let description = null;
  try {
    const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(profile.name + ' ' + ticker)}&format=json&srlimit=1&origin=*`);
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const title = searchData.query?.search?.[0]?.title;
      if (title) {
        const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          if (summaryData.extract) description = summaryData.extract;
        }
      }
    }
  } catch {
    // Non-critical, skip silently
  }

  return {
    name: profile.name,
    ticker: profile.ticker,
    exchange: profile.exchange,
    logo: profile.logo,
    description,
    employees: null,
    industry: profile.finnhubIndustry,
    country: profile.country,
    website: profile.weburl,
    marketCap: profile.marketCapitalization ? profile.marketCapitalization * 1e6 : null,
    currentPrice: quote.c,
    currency: profile.currency || 'USD',
    ipo: profile.ipo,
  };
}

// Extract last N years from a Finnhub series.annual array, sorted oldest→newest
function extractSeries(seriesArray, years = 5) {
  if (!seriesArray || seriesArray.length === 0) return [];
  return seriesArray
    .filter(e => e.v != null)
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-years)
    .map(e => e.v);
}

export async function getUSFinancials(ticker) {
  const metrics = await finnhubGet('/stock/metric', { symbol: ticker, metric: 'all' });

  const metric = metrics.metric || {};
  const series = metrics.series?.annual || {};

  // Use standardized series.annual data for 5-year trends
  // salesPerShare tracks revenue growth direction reliably
  const revenueProxy = extractSeries(series.salesPerShare);
  // EPS tracks net income growth direction
  const epsHistory = extractSeries(series.eps);
  // FCF margin as proxy for FCF growth (positive = positive FCF)
  const fcfMarginSeries = extractSeries(series.fcfMargin);
  // Net margin series for profitability trend
  const netMarginSeries = extractSeries(series.netMargin);
  // ROIC series for profitability
  const roicSeries = extractSeries(series.roic);
  // Historical P/E ratios for valuation
  const peHistory = extractSeries(series.pe);
  // Net debt to total capital for safety
  const netDebtCapitalSeries = extractSeries(series.netDebtToTotalCapital);

  // revenueEmployeeAnnual = revenue(in millions) / employees
  // revenuePerShareAnnual = revenue / shares (in dollars)
  // So: employees = (revenuePerShare * shares) / (revenueEmployeeAnnual * 1e6)
  // We expose the raw metric values; App.jsx computes with marketCap/price for shares.
  const revPerEmployeeM = metric.revenueEmployeeAnnual; // revenue per employee in millions
  const revPerShare = metric.revenuePerShareAnnual;

  return {
    revPerEmployeeM,
    revPerShare,
    // For growth checks, we use per-share / margin proxies — growth direction is the same
    revenue: revenueProxy,
    netIncome: epsHistory,
    freeCashFlow: fcfMarginSeries,
    profitMarginHistory: netMarginSeries,
    roicHistory: roicSeries,
    netDebtCapitalHistory: netDebtCapitalSeries,
    eps: metric.epsTTM || null,
    epsHistory,
    peHistory,
    trailingPE: metric.peTTM || null,
  };
}
