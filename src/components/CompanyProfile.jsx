import { useState } from 'react';
import { formatCurrency, formatEmployees, formatPrice } from '../utils/format';

export default function CompanyProfile({ profile, signal, health, valuation, macro }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card" style={{ position: 'relative' }}>
      <div className="profile-badges">
        <div className="profile-badges-row">
          {health && (() => {
            if (health.score === null) {
              return (
                <div className="profile-score-circle nodata">
                  <span className="profile-score-number" style={{ fontSize: '11px' }}>N/A</span>
                </div>
              );
            }
            const vc = health.verdict === 'Healthy' ? 'healthy' : health.verdict === 'Watch' ? 'watch' : 'unhealthy';
            return (
              <div className={`profile-score-circle ${vc}`}>
                <span className="profile-score-number">{health.score}</span>
                <span className="profile-score-total">/ 10</span>
              </div>
            );
          })()}
          {signal && (
            <div className={`profile-signal ${signal.type}`}>
              {signal.signal}
            </div>
          )}
        </div>
        {valuation && valuation.verdict !== 'N/A' && (
          <div className="profile-valuation-badges">
            <div className="profile-valuation-item">
              <span className="profile-valuation-label">Fair P/E {valuation.method === 'historical' ? '(5Y Avg)' : valuation.method === 'trailing' ? '(Trailing)' : '(Growth)'}</span>
              <span className="profile-valuation-value">{valuation.fairPE?.toFixed(1)}x</span>
            </div>
            <div className="profile-valuation-item">
              <span className="profile-valuation-label">Fair Value</span>
              <span className="profile-valuation-value">{formatPrice(valuation.fairValue, profile.currency)}</span>
            </div>
          </div>
        )}
      </div>
      <div className="profile-header">
        {profile.logo ? (
          <img src={profile.logo} alt={profile.name} className="profile-logo" />
        ) : (
          <div className="profile-logo-placeholder">
            {profile.name?.charAt(0) || '?'}
          </div>
        )}
        <div className="profile-info">
          <h2>{profile.name}</h2>
          <div className="profile-ticker">
            <strong>{profile.ticker}</strong>
            <span className="exchange">{profile.exchange}</span>
          </div>
          <div className="profile-price-row">
            <div className="profile-price">
              {formatPrice(profile.currentPrice, profile.currency)}
              <span className="currency"> {profile.currency}</span>
            </div>
            {valuation && valuation.verdict !== 'N/A' && (
              <span className={`profile-valuation-badge ${valuation.verdict === 'Undervalued' ? 'undervalued' : valuation.verdict === 'Fair' ? 'fair' : 'overvalued'}`}>
                {valuation.verdict}
                {valuation.ratio != null && (
                  <span> ({((valuation.ratio - 1) * 100) >= 0 ? '+' : ''}{((valuation.ratio - 1) * 100).toFixed(0)}%)</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {profile.description && (
        <>
          <p className={`profile-description ${expanded ? 'expanded' : ''}`}>
            {profile.description}
          </p>
          <button className="profile-toggle" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Show less' : 'Show more'}
          </button>
        </>
      )}

      <div className="profile-meta">
        {profile.industry && (
          <div className="meta-item">
            <span className="meta-label">Industry</span>
            <span className="meta-value">{profile.sector ? `${profile.sector} / ${profile.industry}` : profile.industry}</span>
          </div>
        )}
        {profile.country && (
          <div className="meta-item">
            <span className="meta-label">Country</span>
            <span className="meta-value">{profile.country}</span>
          </div>
        )}
        {profile.employees && (
          <div className="meta-item">
            <span className="meta-label">Employees</span>
            <span className="meta-value">{formatEmployees(profile.employees)}</span>
          </div>
        )}
        {profile.marketCap && (
          <div className="meta-item">
            <span className="meta-label">Market Cap</span>
            <span className="meta-value">{formatCurrency(profile.marketCap, profile.currency)}</span>
          </div>
        )}
        {profile.website && (
          <div className="meta-item">
            <span className="meta-label">Website</span>
            <span className="meta-value">
              <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer">
                {profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            </span>
          </div>
        )}
        {macro?.inflation?.length > 0 && (() => {
          const latest = macro.inflation[macro.inflation.length - 1];
          return (
            <div className="meta-item">
              <span className="meta-label">Inflation ({latest.year})</span>
              <span className="meta-value">{latest.value.toFixed(1)}%</span>
            </div>
          );
        })()}
      </div>

    </div>
  );
}
