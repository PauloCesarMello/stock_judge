const TICKERS_URL = '/api/sec-tickers';
const COMPANY_FACTS_URL = '/api/sec-facts/';

let tickersCache = null;
let tickersList = null;
const companyFactsCache = new Map();

export async function loadTickers() {
  if (tickersCache) return tickersCache;

  const res = await fetch(TICKERS_URL);
  if (!res.ok) throw new Error('Failed to load company tickers');
  const data = await res.json();

  tickersCache = data;
  tickersList = Object.values(data).map((entry) => ({
    ticker: entry.ticker.toUpperCase(),
    cik: String(entry.cik_str),
    name: entry.title,
  }));

  return tickersCache;
}

export function searchTickers(query) {
  if (!tickersList || query.length < 2) return [];

  const q = query.toUpperCase();
  const qLower = query.toLowerCase();

  const scored = [];
  for (const item of tickersList) {
    const tickerMatch = item.ticker === q;
    const tickerStartsWith = item.ticker.startsWith(q);
    const nameContains = item.name.toLowerCase().includes(qLower);
    const tickerContains = item.ticker.includes(q);

    if (tickerMatch || tickerStartsWith || tickerContains || nameContains) {
      let score = 0;
      if (tickerMatch) score = 100;
      else if (tickerStartsWith) score = 80;
      else if (tickerContains) score = 60;
      else if (nameContains) score = 40;
      scored.push({ ...item, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 10);
}

const TAG_MAP = {
  revenue: [
    'RevenueFromContractWithCustomerExcludingAssessedTax',
    'Revenues',
    'SalesRevenueNet',
    'RevenueFromContractWithCustomerIncludingAssessedTax',
  ],
  operatingIncome: ['OperatingIncomeLoss'],
  preTaxIncome: [
    'IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest',
    'IncomeLossFromContinuingOperationsBeforeIncomeTaxesDomestic',
  ],
  incomeTaxExpense: ['IncomeTaxExpenseBenefit'],
  netIncome: ['NetIncomeLoss', 'NetIncomeLossAvailableToCommonStockholdersBasic'],
  cfo: ['NetCashProvidedByUsedInOperatingActivities'],
  cfi: ['NetCashProvidedByUsedInInvestingActivities'],
  cff: ['NetCashProvidedByUsedInFinancingActivities'],
  cash: [
    'CashAndCashEquivalentsAtCarryingValue',
    'CashCashEquivalentsAndShortTermInvestments',
  ],
  shareholdersEquity: [
    'StockholdersEquity',
    'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest',
  ],
  depreciation: ['DepreciationDepletionAndAmortization', 'DepreciationAndAmortization'],
  longTermDebt: ['LongTermDebt', 'LongTermDebtNoncurrent'],
  shortTermDebt: ['ShortTermBorrowings', 'LongTermDebtCurrent', 'NotesPayableCurrent'],
};

function extractAnnualValues(facts, tags, companyName, conceptName) {
  const usGaap = facts?.facts?.['us-gaap'];
  if (!usGaap) return {};

  // Merge across all candidate tags: earlier tags in the list win on overlap,
  // later tags fill in years the earlier ones don't cover. This handles
  // companies that switched reporting concepts over time (e.g., NVIDIA
  // reported revenue under RevenueFromContractWithCustomer... for FY19–22
  // and then under Revenues from FY23 onward).
  const merged = {};
  const mergedSource = {};
  for (const tag of tags) {
    const concept = usGaap[tag];
    const usdEntries = concept?.units?.USD;
    if (!usdEntries) continue;

    const annuals = usdEntries.filter(
      (e) => e.form === '10-K' && e.fp === 'FY' && e.val !== undefined
    );
    if (annuals.length === 0) continue;

    const byYear = {};
    for (const entry of annuals) {
      // Use the end-date year when it disagrees with the fy tag —
      // some companies mis-tag the fiscal year field.
      const endYear = entry.end ? Number(entry.end.slice(0, 4)) : null;
      const year = endYear && endYear !== entry.fy ? endYear : entry.fy;
      if (!byYear[year] || entry.end > byYear[year].end) {
        byYear[year] = entry;
      }
    }

    for (const [year, entry] of Object.entries(byYear)) {
      if (mergedSource[year] === undefined) {
        merged[year] = { val: entry.val, end: entry.end };
        mergedSource[year] = tag;
      }
    }
  }

  const result = {};
  for (const [year, entry] of Object.entries(merged)) {
    result[year] = entry.val;
  }

  if (Object.keys(result).length === 0) {
    console.log(`[StockJudge] Could not resolve "${conceptName}" for ${companyName}`);
  }
  return result;
}

export async function fetchCompanyFacts(cik, companyName) {
  const paddedCik = cik.padStart(10, '0');

  if (companyFactsCache.has(paddedCik)) {
    return companyFactsCache.get(paddedCik);
  }

  const url = `${COMPANY_FACTS_URL}${paddedCik}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch data for CIK ${cik}`);
  const data = await res.json();

  const raw = {};
  for (const [concept, tags] of Object.entries(TAG_MAP)) {
    raw[concept] = extractAnnualValues(data, tags, companyName, concept);
  }

  const allYears = new Set();
  for (const values of Object.values(raw)) {
    for (const year of Object.keys(values)) {
      allYears.add(Number(year));
    }
  }

  // Fetch 6 years so ROIC can be calculated for all 5 display years
  const sortedYears = [...allYears].sort((a, b) => b - a).slice(0, 6);

  const periods = sortedYears.map((year) => {
    const get = (concept) => {
      const val = raw[concept]?.[year];
      return val !== undefined ? val : null;
    };

    const longTermDebt = get('longTermDebt');
    const shortTermDebt = get('shortTermDebt');
    const totalDebt =
      longTermDebt !== null || shortTermDebt !== null
        ? (longTermDebt || 0) + (shortTermDebt || 0)
        : null;

    return {
      year,
      revenue: get('revenue'),
      operatingIncome: get('operatingIncome'),
      preTaxIncome: get('preTaxIncome'),
      incomeTaxExpense: get('incomeTaxExpense'),
      netIncome: get('netIncome'),
      cfo: get('cfo'),
      cfi: get('cfi'),
      cff: get('cff'),
      depreciation: get('depreciation'),
      cash: get('cash'),
      shareholdersEquity: get('shareholdersEquity'),
      longTermDebt,
      totalDebt,
    };
  });

  const result = { companyName, cik, periods };
  companyFactsCache.set(paddedCik, result);
  return result;
}
