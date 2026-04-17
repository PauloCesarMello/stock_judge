export default async function handler(req, res) {
  try {
    const { path } = req.query;
    const pathStr = Array.isArray(path) ? path.join('/') : path || '';
    const upstream = await fetch(`https://data.sec.gov/${pathStr}`, {
      headers: {
        'User-Agent': 'StockJudge stock-judge-app@example.com',
        Accept: 'application/json',
      },
    });
    if (!upstream.ok) {
      res.status(upstream.status).end();
      return;
    }
    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(data);
  } catch {
    res.status(500).json({ error: 'sec-api proxy failed' });
  }
}
