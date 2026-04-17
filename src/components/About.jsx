const PILLARS = [
  {
    question: 'Does it earn well on what\u2019s invested?',
    signal: 'Latest ROIC + 5-year average ROIC',
  },
  {
    question: 'Is the business growing?',
    signal: '5-year revenue and free cash flow CAGR',
  },
  {
    question: 'Are its profits real cash?',
    signal: 'Average and worst-year CFO / Net Income',
  },
  {
    question: 'Can it handle a downturn?',
    signal: 'Long-term debt / EBITDA and cash / total debt',
  },
  {
    question: 'Is it stable or boom-bust?',
    signal: 'ROIC volatility and negative-FCF year count',
  },
];

export default function About() {
  return (
    <div className="about">
      <section className="about-section">
        <h2>What StockJudge does</h2>
        <p>
          StockJudge reads five years of a company&rsquo;s audited financial
          filings and turns them into a simple quality read &mdash; a 0&ndash;10
          score plus five plain-English verdicts. It&rsquo;s built for people
          who want to understand whether a business is fundamentally healthy
          without wading through a 10-K.
        </p>
      </section>

      <section className="about-section">
        <h2>How the Quality Score works</h2>
        <p>
          Each of the five pillars is worth up to 2 points. We answer a yes/no
          question for each using the last five annual filings:
        </p>
        <ul className="about-list">
          {PILLARS.map((p) => (
            <li key={p.question}>
              <strong>{p.question}</strong>
              <span className="about-muted"> &mdash; {p.signal}</span>
            </li>
          ))}
        </ul>
        <p>
          The five pillar scores sum to a 0&ndash;10 total, mapped to a label:
          Strong (&ge;8), Solid (&ge;6), Mixed (&ge;4), or Weak.
        </p>
      </section>

      <section className="about-section">
        <h2>Data sources</h2>
        <ul className="about-list">
          <li>
            <strong>SEC EDGAR</strong> &mdash; audited financial statements
            (revenue, cash flows, debt, equity) from annual 10-K filings. Free,
            official, no API key.
          </li>
          <li>
            <strong>Finnhub</strong> &mdash; current price, 52-week range,
            company logo, industry, and website. Free tier.
          </li>
        </ul>
        <p className="about-muted">
          Coverage is limited to US-listed companies that file 10-Ks with the
          SEC. The quality framework works best for mature, non-financial
          businesses; it can misread banks, REITs, and early-growth companies
          where the standard metrics mean something different.
        </p>
      </section>

      <section className="about-section">
        <h2>Tech stack</h2>
        <ul className="about-list">
          <li>React 19 + Vite 8</li>
          <li>Plain JavaScript (no TypeScript), plain CSS (no framework)</li>
          <li>ESLint with react-hooks and react-refresh plugins</li>
          <li>No backend, no database &mdash; all data fetched client-side via proxies</li>
        </ul>
      </section>

      <section className="about-section">
        <h2>Not investment advice</h2>
        <p>
          The Quality Score measures business quality based on reported
          historical numbers. It does <strong>not</strong> factor in valuation
          (price vs. worth), management, competitive dynamics, or
          forward-looking risks. A great business at a bad price is still a bad
          investment. Use this as one input among many, not as a buy or sell
          signal.
        </p>
      </section>

      <section className="about-section">
        <p className="about-muted">
          Source:{' '}
          <a
            href="https://github.com/PauloCesarMello/stock_judge"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/PauloCesarMello/stock_judge
          </a>
        </p>
      </section>
    </div>
  );
}
