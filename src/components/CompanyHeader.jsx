import { calculateQualityScore } from '../utils/score';
import Tooltip from './Tooltip';

function pillarTier(score) {
  if (score >= 1.5) return 'high';
  if (score >= 0.5) return 'mid';
  return 'low';
}

export default function CompanyHeader({ name, ticker, profile, quote, metrics }) {
  const displayName = profile?.name || name;
  const industry = profile?.industry;
  const website = profile?.website;
  const logo = profile?.logo;

  let websiteLabel = null;
  if (website) {
    try {
      websiteLabel = new URL(website).hostname.replace(/^www\./, '');
    } catch {
      websiteLabel = website;
    }
  }

  const { total, rating, pillars } = calculateQualityScore(metrics);

  return (
    <div className="company-card">
      <div className="company-top">
        {logo ? (
          <img className="company-logo" src={logo} alt="" />
        ) : (
          <div className="company-logo company-logo-placeholder">{ticker?.[0] || '?'}</div>
        )}
        <div className="company-info">
          <div className="company-name-row">
            <h2 className="company-name">{displayName}</h2>
            {ticker && <span className="company-ticker">{ticker}</span>}
          </div>
          {industry && <div className="company-industry">{industry}</div>}
          {quote?.price != null && (
            <div className="company-price">
              <span className="price-value">${quote.price.toFixed(2)}</span>
              {quote.changePercent != null && (
                <span className={`price-change ${quote.changePercent >= 0 ? 'up' : 'down'}`}>
                  {quote.changePercent >= 0 ? '▲' : '▼'} {Math.abs(quote.changePercent).toFixed(2)}%
                </span>
              )}
              {quote.low52 != null && quote.high52 != null && quote.high52 > quote.low52 && (
                <div className="price-range" title="52-week range">
                  <span className="range-endpoint">${quote.low52.toFixed(0)}</span>
                  <div className="range-track">
                    <div
                      className="range-marker"
                      style={{
                        left: `${Math.max(0, Math.min(100, ((quote.price - quote.low52) / (quote.high52 - quote.low52)) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="range-endpoint">${quote.high52.toFixed(0)}</span>
                </div>
              )}
            </div>
          )}
          <div className="company-details">
            <div className="company-detail">
              <span className="detail-label">Website</span>
              <span className="detail-value">
                {website ? (
                  <a href={website} target="_blank" rel="noopener noreferrer">
                    {websiteLabel}
                  </a>
                ) : (
                  'N/A'
                )}
              </span>
            </div>
          </div>
        </div>
        <div className={`quality-summary tone-${rating.tone}`}>
          <div className="quality-label">Quality Score</div>
          <div className="quality-value">
            <span className="quality-number">{total.toFixed(1)}</span>
            <span className="quality-max">/ 10</span>
          </div>
          <div className="quality-rating">{rating.label}</div>
        </div>
      </div>
      <div className="quality-pillars">
        {pillars.map((p) => (
          <div key={p.name} className="quality-pillar">
            <div className="pillar-score-badge" data-tier={pillarTier(p.score)}>
              {p.score.toFixed(1)}
            </div>
            <span className="pillar-name">
              <Tooltip text={p.detail}>{p.name}</Tooltip>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
