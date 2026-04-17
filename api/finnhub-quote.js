export default async function handler(req, res) {
  try {
    const token = process.env.FINNHUB_API_KEY || process.env.VITE_FINNHUB_API_KEY;
    if (!token) {
      res.status(500).json({ error: 'FINNHUB_API_KEY not set' });
      return;
    }
    const { symbol } = req.query;
    if (!symbol) {
      res.status(400).json({ error: 'symbol required' });
      return;
    }
    const upstream = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`,
    );
    if (!upstream.ok) {
      res.status(upstream.status).end();
      return;
    }
    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json(data);
  } catch {
    res.status(500).json({ error: 'finnhub-quote proxy failed' });
  }
}
