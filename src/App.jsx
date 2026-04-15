import { useState } from 'react';
import './App.css';
import SearchBar from './components/SearchBar';
import CompanyProfile from './components/CompanyProfile';
import HealthScore from './components/HealthScore';
import About from './components/About';
import { getMarket } from './utils/marketDetect';
import { getMacroData } from './api/macro';
import { getUSProfile, getUSFinancials } from './api/finnhub';
import { getBRProfile, getBRFinancials } from './api/brapi';
import { calculateHealthScore, calculateValuation, getFinalSignal } from './utils/scoring';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [page, setPage] = useState('home');

  async function handleSearch(ticker) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const market = getMarket(ticker);
      let profile, financials;

      if (market === 'BR') {
        [profile, financials] = await Promise.all([
          getBRProfile(ticker),
          getBRFinancials(ticker),
        ]);
      } else {
        [profile, financials] = await Promise.all([
          getUSProfile(ticker),
          getUSFinancials(ticker),
        ]);
        if (!profile.employees && financials.revPerEmployeeM && financials.revPerShare && profile.marketCap && profile.currentPrice > 0) {
          const shares = profile.marketCap / profile.currentPrice;
          const totalRevenueM = (financials.revPerShare * shares) / 1e6;
          profile.employees = Math.round(totalRevenueM / financials.revPerEmployeeM);
        }
      }

      const health = calculateHealthScore(financials);
      const valuation = calculateValuation({
        ...financials,
        currentPrice: profile.currentPrice,
      });
      const signal = getFinalSignal(health.verdict, valuation.verdict);

      setResult({ profile, financials, health, valuation, signal, macro: null, market });

      getMacroData(market)
        .then(macro => setResult(prev => prev ? { ...prev, macro } : prev))
        .catch(() => {});
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (page === 'about') {
    return <About onBack={() => setPage('home')} />;
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <span className="header-icon">{'\u2696\uFE0F'}</span>
          <h1>StockJudge</h1>
        </div>
        <p>Analyze stocks. Get a verdict.</p>
        <button className="header-about" onClick={() => setPage('about')}>
          How it works
        </button>
      </header>

      <SearchBar onSearch={handleSearch} loading={loading} />

      {loading && (
        <div className="loading">
          <div className="spinner" />
          <p>Analyzing financials...</p>
        </div>
      )}

      {error && (
        <div className="error">
          <p>{error}</p>
        </div>
      )}

      {result && (
        <>
          <CompanyProfile profile={result.profile} signal={result.signal} health={result.health} valuation={result.valuation} macro={result.macro} />

          <HealthScore health={result.health} />
        </>
      )}
    </div>
  );
}

export default App;
