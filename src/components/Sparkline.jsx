import { formatDollar } from '../utils/format';

export default function Sparkline({ values, years, format = formatDollar }) {
  // values are in reverse chronological order (newest first), reverse for left-to-right display
  const data = [...values].reverse();
  const labels = [...years].reverse();
  const valid = data.filter((v) => v !== null);
  if (valid.length === 0) return null;

  const maxVal = Math.max(...valid);
  const minVal = Math.min(...valid);
  const hasNegative = minVal < 0;
  const hasPositive = maxVal > 0;

  // Determine how to split the space between positive and negative zones
  const posMax = hasPositive ? maxVal : 0;
  const negMax = hasNegative ? Math.abs(minVal) : 0;
  const total = posMax + negMax || 1;
  const posFraction = posMax / total;
  const negFraction = negMax / total;

  return (
    <div className="bar-chart">
      {data.map((v, i) => {
        const isNull = v === null;
        const isNegative = !isNull && v < 0;
        const barPct = !isNull
          ? (Math.abs(v) / (isNegative ? negMax : posMax || 1)) * 100
          : 0;

        return (
          <div key={labels[i]} className="bar-column">
            {/* Positive zone */}
            {hasPositive && (
              <div className="bar-zone bar-zone-pos" style={{ flex: posFraction }}>
                {!isNull && !isNegative ? (
                  <div
                    className="bar-fill"
                    style={{ height: `${Math.max(barPct, 15)}%` }}
                  >
                    <span className="bar-value">{format(v)}</span>
                  </div>
                ) : isNull ? (
                  <div className="bar-fill bar-na" style={{ height: '15%' }}>
                    <span className="bar-value">N/A</span>
                  </div>
                ) : null}
              </div>
            )}
            {/* Negative zone */}
            {hasNegative && (
              <div className="bar-zone bar-zone-neg" style={{ flex: negFraction }}>
                {!isNull && isNegative ? (
                  <div
                    className="bar-fill bar-negative"
                    style={{ height: `${Math.max(barPct, 15)}%` }}
                  >
                    <span className="bar-value">{format(v)}</span>
                  </div>
                ) : null}
              </div>
            )}
            <span className="bar-year">{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}
