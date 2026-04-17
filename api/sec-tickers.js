export default async function handler(req, res) {
  try {
    const upstream = await fetch(
      'https://www.sec.gov/files/company_tickers.json',
      {
        headers: {
          'User-Agent': 'StockJudge stock-judge-app@example.com',
          Accept: 'application/json',
        },
      },
    );
    if (!upstream.ok) {
      res.status(upstream.status).end();
      return;
    }
    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(data);
  } catch {
    res.status(500).json({ error: 'sec-tickers proxy failed' });
  }
}
