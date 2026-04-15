export default function About({ onBack }) {
  return (
    <div className="about">
      <button className="about-back" onClick={onBack}>&larr; Back to StockJudge</button>

      <h2>How StockJudge Works</h2>
      <p className="about-intro">
        StockJudge analyzes publicly traded companies using 5 years of financial data
        and delivers a simple health score from 0 to 10, a valuation estimate, and a
        final Buy/Hold/Avoid signal.
      </p>

      <section className="about-section">
        <h3>Data Sources</h3>
        <ul>
          <li><strong>US Stocks</strong> — Financial data from Finnhub (standardized annual series from SEC filings). Company descriptions from Wikipedia.</li>
          <li><strong>Brazilian Stocks</strong> — Financial data from Brapi (B3 filings). Coverage varies by ticker.</li>
          <li><strong>Inflation</strong> — Annual CPI/IPCA data from the World Bank API.</li>
        </ul>
        <p>Market detection is automatic: tickers with 4 letters + a digit (e.g. PETR4) are routed to Brapi, all others to Finnhub.</p>
      </section>

      <section className="about-section">
        <h3>Health Score (0-10)</h3>
        <p>
          The health score evaluates 6 metrics across three categories. Each metric uses a
          <strong> two-factor system</strong>: the <em>level</em> (is the 5-year average good?) and
          the <em>direction</em> (is it trending up, flat, or down?).
        </p>

        <table className="about-table">
          <thead>
            <tr>
              <th>Combination</th>
              <th>Result</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Good level + growing or flat</td><td className="about-green">Pass</td><td>Full</td></tr>
            <tr><td>Good level + declining</td><td className="about-yellow">Neutral</td><td>Half</td></tr>
            <tr><td>Bad level + growing</td><td className="about-yellow">Neutral</td><td>Half</td></tr>
            <tr><td>Bad level + flat or declining</td><td className="about-red">Fail</td><td>Zero</td></tr>
          </tbody>
        </table>

        <p>Direction is measured using a <strong>linear regression trend line</strong> through all 5 data points, which handles outlier years better than comparing just the first and last values. The threshold is +/-1% normalized slope.</p>

        <h4>Growth (5 points)</h4>
        <table className="about-table">
          <thead>
            <tr><th>Metric</th><th>Data</th><th>Level Threshold</th><th>Weight</th></tr>
          </thead>
          <tbody>
            <tr><td>Revenue</td><td>Sales / Share (Finnhub) or Total Revenue / Shares (Brapi)</td><td>5Y avg &gt; 0</td><td>2 pts</td></tr>
            <tr><td>Net Income</td><td>Net Income / Share (EPS)</td><td>5Y avg &gt; 0</td><td>2 pts</td></tr>
            <tr><td>Free Cash Flow</td><td>FCF / Sales margin (Finnhub) or Operating margin (Brapi)</td><td>5Y avg &gt; 0</td><td>1 pt</td></tr>
          </tbody>
        </table>

        <h4>Profitability (3 points)</h4>
        <table className="about-table">
          <thead>
            <tr><th>Metric</th><th>Data</th><th>Level Threshold</th><th>Weight</th></tr>
          </thead>
          <tbody>
            <tr><td>Profit Margin</td><td>Net Income / Sales (net margin)</td><td>5Y avg &gt; 10%</td><td>1.5 pts</td></tr>
            <tr><td>ROIC</td><td>Return on Invested Capital (Net Income / (Equity + LT Debt))</td><td>5Y avg &gt; 10%</td><td>1.5 pts</td></tr>
          </tbody>
        </table>

        <h4>Safety (2 points)</h4>
        <table className="about-table">
          <thead>
            <tr><th>Metric</th><th>Data</th><th>Level Threshold</th><th>Weight</th></tr>
          </thead>
          <tbody>
            <tr><td>Net Debt / Capital</td><td>(Total Debt - Cash) / (Debt + Equity)</td><td>5Y avg &lt; 50%</td><td>2 pts</td></tr>
          </tbody>
        </table>
        <p>If a company has a <strong>net cash position</strong> (negative Net Debt / Capital on average), it automatically passes with full points.</p>

        <h4>Verdict</h4>
        <table className="about-table">
          <thead>
            <tr><th>Score</th><th>Verdict</th></tr>
          </thead>
          <tbody>
            <tr><td>8 - 10</td><td className="about-green">Healthy</td></tr>
            <tr><td>5 - 7.5</td><td className="about-yellow">Watch</td></tr>
            <tr><td>0 - 4.5</td><td className="about-red">Unhealthy</td></tr>
          </tbody>
        </table>
      </section>

      <section className="about-section">
        <h3>Valuation (P/E Based)</h3>
        <p>The fair value is estimated using a Price-to-Earnings approach with three methods tried in order:</p>
        <ol>
          <li><strong>5-Year Average Historical P/E</strong> (primary) — What investors have historically paid for this stock. Requires at least 3 years of valid P/E data.</li>
          <li><strong>Growth-Based P/E</strong> (fallback) — Average EPS growth rate x 2, with a minimum of 8x. Requires 2+ consecutive years of positive EPS.</li>
          <li><strong>Trailing P/E</strong> (last resort) — Current market P/E. Used when historical data is insufficient (e.g. companies recovering from losses).</li>
        </ol>
        <p><strong>Fair Value</strong> = Current EPS x Fair P/E</p>

        <table className="about-table">
          <thead>
            <tr><th>Price vs Fair Value</th><th>Verdict</th></tr>
          </thead>
          <tbody>
            <tr><td>Below 75%</td><td className="about-green">Undervalued</td></tr>
            <tr><td>75% - 125%</td><td className="about-yellow">Fair</td></tr>
            <tr><td>Above 125%</td><td className="about-red">Overvalued</td></tr>
          </tbody>
        </table>
      </section>

      <section className="about-section">
        <h3>Final Signal</h3>
        <table className="about-table">
          <thead>
            <tr><th>Health</th><th>Valuation</th><th>Signal</th></tr>
          </thead>
          <tbody>
            <tr><td>Healthy</td><td>Undervalued</td><td className="about-green">STRONG BUY</td></tr>
            <tr><td>Healthy</td><td>Fair</td><td className="about-green">BUY</td></tr>
            <tr><td>Healthy</td><td>Overvalued</td><td className="about-yellow">HOLD</td></tr>
            <tr><td>Watch</td><td>Undervalued</td><td className="about-yellow">HOLD</td></tr>
            <tr><td>Watch</td><td>Fair / Overvalued</td><td className="about-yellow">WATCH</td></tr>
            <tr><td>Unhealthy</td><td>Any</td><td className="about-red">AVOID</td></tr>
          </tbody>
        </table>
      </section>

      <section className="about-section">
        <h3>Limitations</h3>
        <ul>
          <li>This tool is for educational purposes only. It is not financial advice.</li>
          <li>P/E valuation does not work well for companies with negative or volatile earnings.</li>
          <li>Per-share metrics (Revenue, EPS) can be influenced by share buybacks.</li>
          <li>FCF for US stocks uses FCF margin (FCF/Sales) as a proxy, not absolute FCF.</li>
          <li>Some Brazilian stocks have limited data availability on Brapi.</li>
          <li>Inflation data from the World Bank lags by ~1 year.</li>
          <li>The model does not account for sector-specific benchmarks — a 10% profit margin threshold applies equally to all industries.</li>
        </ul>
      </section>

      <section className="about-section">
        <h3>Chart Elements</h3>
        <ul>
          <li><strong>Bars</strong> — 5 years of annual data. Green = positive (or good for inverted metrics), Red = negative (or bad).</li>
          <li><strong>Dashed line</strong> — Linear regression trend line through all 5 points. Color matches the traffic light signal.</li>
          <li><strong>Trend %</strong> — Normalized slope of the trend line, shown in the top-right corner of each chart.</li>
          <li><strong>Traffic lights</strong> — Green (pass), Amber (neutral/flat), Red (fail) based on the two-factor scoring.</li>
        </ul>
      </section>
    </div>
  );
}
