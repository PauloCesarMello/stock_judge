const WB_BASE = 'https://api.worldbank.org/v2';

async function worldBankGet(country, indicator, startYear, endYear) {
  const url = `${WB_BASE}/country/${country}/indicator/${indicator}?date=${startYear}:${endYear}&format=json`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  if (!data[1]) return [];
  return data[1]
    .filter(d => d.value != null)
    .map(d => ({ year: parseInt(d.date), value: d.value }))
    .sort((a, b) => a.year - b.year);
}

export async function getMacroData(market = 'US') {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 6; // request extra year in case latest is missing
  const country = market === 'BR' ? 'BRA' : 'USA';

  const results = {};

  // Inflation (CPI annual %)
  const inflation = await worldBankGet(country, 'FP.CPI.TOTL.ZG', startYear, currentYear);
  results.inflation = inflation.slice(-5);

  // Lending rate (works for Brazil, sparse for US)
  if (market === 'BR') {
    const lending = await worldBankGet('BRA', 'FR.INR.LEND', startYear, currentYear);
    results.lendingRate = lending.slice(-5);
  }

  return results;
}
