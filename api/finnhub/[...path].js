export default async function handler(req, res) {
  try {
    const token = process.env.FINNHUB_API_KEY || process.env.VITE_FINNHUB_API_KEY;
    if (!token) {
      res.status(500).json({ error: 'FINNHUB_API_KEY not set' });
      return;
    }
    const { path, ...query } = req.query;
    const pathStr = Array.isArray(path) ? path.join('/') : path || '';
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (Array.isArray(v)) v.forEach((vv) => params.append(k, vv));
      else if (v !== undefined) params.append(k, v);
    }
    params.set('token', token);
    const upstream = await fetch(
      `https://finnhub.io/api/v1/${pathStr}?${params.toString()}`,
    );
    if (!upstream.ok) {
      res.status(upstream.status).end();
      return;
    }
    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json(data);
  } catch {
    res.status(500).json({ error: 'finnhub proxy failed' });
  }
}
