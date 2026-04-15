import { useState } from 'react';

export default function SearchBar({ onSearch, loading }) {
  const [ticker, setTicker] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const value = ticker.trim().toUpperCase();
    if (value) onSearch(value);
  }

  return (
    <form onSubmit={handleSubmit} className="search-container">
      <span className="search-icon">&#128269;</span>
      <input
        type="text"
        className="search-input"
        placeholder="Enter ticker (e.g. AAPL, PETR4)"
        value={ticker}
        onChange={e => setTicker(e.target.value)}
        disabled={loading}
      />
      <button type="submit" className="search-btn" disabled={loading || !ticker.trim()}>
        {loading ? 'Analyzing...' : 'Judge'}
      </button>
    </form>
  );
}
