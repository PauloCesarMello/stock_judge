import { useState, useEffect } from 'react';
import { loadTickers, fetchCompanyFacts } from './api/secEdgar';
import { fetchCompanyProfile, fetchStockQuote } from './api/finnhub';
import { calculateMetrics } from './utils/metrics';
import SearchBar from './components/SearchBar';
import CompanyHeader from './components/CompanyHeader';
import MetricCard from './components/MetricCard';
import About from './components/About';
import './App.css';

const PRIMARY_METRICS = [
  { label: 'Revenue', metricKey: 'revenue' },
  { label: 'Net Income', metricKey: 'netIncome' },
  { label: 'Operating Margin', metricKey: 'operatingMargin' },
  { label: 'Cash Flow from Operations', metricKey: 'cfo' },
  { label: 'Free Cash Flow', metricKey: 'fcf' },
  { label: 'FCF Margin', metricKey: 'fcfMargin' },
  { label: 'Cash Flow from Investing', metricKey: 'cfi' },
  { label: 'Cash Flow from Financing', metricKey: 'cff' },
  { label: 'Available Cash', metricKey: 'cash' },
  { label: 'Total Debt', metricKey: 'totalDebt' },
  { label: 'Return on Invested Capital', metricKey: 'roic' },
  { label: 'Are Profits Backed by Real Cash?', metricKey: 'earningsQuality' },
  { label: 'Investment Intensity', metricKey: 'investmentIntensity' },
  { label: 'Years to Pay Off Debt', metricKey: 'debtToEbitda' },
];

export default function App() {
  const [tickersLoaded, setTickersLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [profile, setProfile] = useState(null);
  const [quote, setQuote] = useState(null);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    loadTickers()
      .then(() => setTickersLoaded(true))
      .catch(() => setError('Failed to load company list. Please refresh the page.'));
  }, []);

  async function handleSelect(item) {
    setError(null);
    setLoading(true);
    setCompanyData(null);
    setMetrics(null);
    setProfile(null);
    setQuote(null);
    setSelectedTicker(item.ticker);

    try {
      const [data, profileData, quoteData] = await Promise.all([
        fetchCompanyFacts(item.cik, item.name),
        fetchCompanyProfile(item.ticker).catch(() => null),
        fetchStockQuote(item.ticker).catch(() => null),
      ]);
      if (data.periods.length === 0) {
        setError(`No annual filing data found for ${item.name} (${item.ticker}).`);
        setLoading(false);
        return;
      }
      setCompanyData(data);
      setMetrics(calculateMetrics(data.periods));
      setProfile(profileData);
      setQuote(quoteData);
    } catch {
      setError(`Could not load financial data for ${item.ticker}. The company may not have XBRL filings available.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <button
          type="button"
          className="app-title-button"
          onClick={() => setShowAbout(false)}
        >
          <h1>StockJudge</h1>
        </button>
        <p className="tagline">Understand any public company's finances in plain English</p>
        <button
          type="button"
          className="about-link"
          onClick={() => setShowAbout((v) => !v)}
        >
          {showAbout ? 'Back to app' : 'About'}
        </button>
      </header>

      {showAbout ? (
        <About />
      ) : (
        <>
          <SearchBar onSelect={handleSelect} disabled={!tickersLoaded} />

          {!tickersLoaded && !error && (
            <div className="status-message">Loading company directory...</div>
          )}

          {loading && (
            <div className="status-message">
              <div className="spinner" />
              Loading financial data for {selectedTicker}...
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          {metrics && companyData && (
            <div className="results">
              <CompanyHeader
                name={companyData.companyName}
                ticker={selectedTicker}
                profile={profile}
                quote={quote}
                metrics={metrics}
              />

              <div className="metrics-grid">
                {PRIMARY_METRICS.map((m) => (
                  <MetricCard
                    key={m.metricKey}
                    label={m.label}
                    metricKey={m.metricKey}
                    metrics={metrics}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
