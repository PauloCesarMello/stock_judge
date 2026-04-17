const profileCache = new Map();
const quoteCache = new Map();

export async function fetchCompanyProfile(ticker) {
  const key = ticker.toUpperCase();
  if (profileCache.has(key)) return profileCache.get(key);

  const res = await fetch(`/api/finnhub-profile?symbol=${encodeURIComponent(key)}`);
  if (!res.ok) {
    profileCache.set(key, null);
    return null;
  }
  const data = await res.json();
  if (!data || !data.name) {
    profileCache.set(key, null);
    return null;
  }

  const profile = {
    name: data.name,
    logo: data.logo || null,
    website: data.weburl || null,
    industry: data.finnhubIndustry || null,
  };
  profileCache.set(key, profile);
  return profile;
}

export async function fetchStockQuote(ticker) {
  const key = ticker.toUpperCase();
  if (quoteCache.has(key)) return quoteCache.get(key);

  const [quoteRes, metricRes] = await Promise.all([
    fetch(`/api/finnhub-quote?symbol=${encodeURIComponent(key)}`),
    fetch(`/api/finnhub-metric?symbol=${encodeURIComponent(key)}`),
  ]);

  if (!quoteRes.ok) {
    quoteCache.set(key, null);
    return null;
  }
  const q = await quoteRes.json();
  if (!q?.c) {
    quoteCache.set(key, null);
    return null;
  }

  let m = {};
  if (metricRes.ok) {
    const data = await metricRes.json();
    m = data?.metric || {};
  }

  const quote = {
    price: q.c,
    changePercent: q.dp ?? null,
    high52: m['52WeekHigh'] ?? null,
    low52: m['52WeekLow'] ?? null,
  };
  quoteCache.set(key, quote);
  return quote;
}
