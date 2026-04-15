const API_KEY = import.meta.env.VITE_BRAPI_API_KEY;
const BASE = 'https://brapi.dev/api';

async function brapiGet(endpoint, params = {}) {
  const url = new URL(`${BASE}${endpoint}`);
  url.searchParams.set('token', API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Brapi API error: ${res.status}`);
  return res.json();
}

export async function getBRProfile(ticker) {
  let data;
  try {
    data = await brapiGet(`/quote/${ticker}`, { modules: 'summaryProfile', fundamental: 'true' });
  } catch {
    // Fallback to basic quote without modules
    data = await brapiGet(`/quote/${ticker}`, { fundamental: 'true' });
  }

  const result = data.results?.[0];
  if (!result) throw new Error(`No data found for ticker "${ticker}"`);

  const profile = result.summaryProfile || {};

  return {
    name: result.longName || result.shortName || ticker,
    ticker: result.symbol,
    exchange: result.fullExchangeName || 'B3',
    logo: result.logourl || null,
    description: profile.longBusinessSummary || null,
    employees: profile.fullTimeEmployees || null,
    industry: profile.industry || result.industry || null,
    country: profile.country || 'Brazil',
    website: profile.website || null,
    marketCap: result.marketCap || null,
    currentPrice: result.regularMarketPrice || null,
    currency: result.currency || 'BRL',
    sector: profile.sector || null,
  };
}

export async function getBRFinancials(ticker) {
  // Fetch profile + financials and income/balance data in parallel
  // Note: Brapi doesn't support cashflowStatementHistory as a module
  // Fetch basic quote first (always works), then modules via allSettled
  const basicData = await brapiGet(`/quote/${ticker}`, { fundamental: 'true' });
  const basicResult = basicData.results?.[0] || {};

  const results = await Promise.allSettled([
    brapiGet(`/quote/${ticker}`, { modules: 'defaultKeyStatistics,financialData', fundamental: 'true' }),
    brapiGet(`/quote/${ticker}`, { modules: 'incomeStatementHistory' }),
    brapiGet(`/quote/${ticker}`, { modules: 'balanceSheetHistory' }),
  ]);

  const settled = (i) => results[i].status === 'fulfilled' ? results[i].value : {};
  const profileData = settled(0);
  const incomeData = settled(1);
  const balanceData = settled(2);

  const result = profileData.results?.[0] || {};
  const keyStats = result.defaultKeyStatistics || {};
  const finData = result.financialData || {};

  // Income statements — annual (sort oldest to newest, take last 5)
  const incomeStatements = (incomeData.results?.[0]?.incomeStatementHistory || [])
    .filter(s => s.type === 'yearly' || !s.type)
    .sort((a, b) => a.endDate.localeCompare(b.endDate))
    .slice(-5);

  // Balance sheets — annual
  const balanceSheets = (balanceData.results?.[0]?.balanceSheetHistory || [])
    .filter(s => s.type === 'yearly' || !s.type)
    .sort((a, b) => a.endDate.localeCompare(b.endDate))
    .slice(-5);

  // Annual data arrays (oldest to newest)
  const revenue = incomeStatements.map(s => s.totalRevenue).filter(v => v != null);
  const netIncome = incomeStatements.map(s => s.netIncome).filter(v => v != null);

  // EPS history (derive from net income / shares outstanding)
  const sharesOutstanding = keyStats.sharesOutstanding;
  const epsHistory = netIncome.length > 0 && sharesOutstanding
    ? netIncome.map(ni => ni / sharesOutstanding)
    : [];

  // Revenue per share (to match Finnhub format)
  const revenuePerShare = revenue.length > 0 && sharesOutstanding
    ? revenue.map(r => r / sharesOutstanding)
    : revenue;

  // Profit margin history (net income / revenue)
  const profitMarginHistory = [];
  for (let i = 0; i < Math.min(revenue.length, netIncome.length); i++) {
    if (revenue[i] && revenue[i] !== 0) {
      profitMarginHistory.push(netIncome[i] / revenue[i]);
    }
  }

  // FCF margin history — derive from income + balance sheet if possible
  // Brapi doesn't have cash flow history, so use operating margin as proxy
  const fcfMarginHistory = incomeStatements
    .map(s => {
      if (s.totalRevenue && s.totalRevenue !== 0 && s.operatingIncome != null) {
        return s.operatingIncome / s.totalRevenue;
      }
      return null;
    })
    .filter(v => v != null);

  // ROIC history: net income / (equity + long-term debt)
  const roicHistory = [];
  for (let i = 0; i < Math.min(incomeStatements.length, balanceSheets.length); i++) {
    const ni = incomeStatements[i]?.netIncome;
    const equity = balanceSheets[i]?.shareholdersEquity;
    const ltd = balanceSheets[i]?.longTermLoansAndFinancing || balanceSheets[i]?.longTermDebt || 0;
    if (ni != null && equity != null && (equity + ltd) > 0) {
      roicHistory.push(ni / (equity + ltd));
    }
  }

  // Net debt / capital history: (LT debt - cash) / (LT debt + equity)
  const netDebtCapitalHistory = balanceSheets.map(bs => {
    const ltd = bs.longTermLoansAndFinancing || bs.longTermDebt || 0;
    const cash = bs.cash || 0;
    const equity = bs.shareholdersEquity || 0;
    const totalCapital = ltd + equity;
    if (totalCapital <= 0) return null;
    return (ltd - cash) / totalCapital;
  }).filter(v => v != null);

  const latestFCF = finData.freeCashflow || null;

  return {
    revenue: revenuePerShare,
    netIncome: epsHistory.length > 0 ? epsHistory : netIncome,
    freeCashFlow: fcfMarginHistory.length > 0 ? fcfMarginHistory : (latestFCF != null ? [latestFCF] : []),
    profitMarginHistory,
    roicHistory,
    netDebtCapitalHistory,
    eps: keyStats.trailingEps || basicResult.earningsPerShare || null,
    epsHistory: [],
    peHistory: null,
    trailingPE: basicResult.priceEarnings || keyStats.trailingPE || null,
    currentPrice: finData.currentPrice || basicResult.regularMarketPrice || null,
  };
}
