export default function MetricChart({ subtitle, data, format = 'number', inverted = false, startYear: startYearProp }) {
  if (!data || data.length < 2) return null;

  const width = 280;
  const height = 120;
  const padding = { top: 8, bottom: 18, left: 6, right: 6 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const min = Math.min(...data, 0);
  const max = Math.max(...data, 0);
  const range = max - min || 1;

  const barCount = data.length;
  const totalBarSpace = chartW / barCount;
  const barWidth = totalBarSpace * 0.6;
  const barGap = totalBarSpace * 0.4;

  // Zero line position
  const zeroY = padding.top + chartH - ((0 - min) / range) * chartH;

  function formatValue(v) {
    if (format === 'percent') return (v * 100).toFixed(1) + '%';
    if (format === 'ratio') return v.toFixed(2);
    if (Math.abs(v) >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
    if (Math.abs(v) >= 1e3) return '$' + (v / 1e3).toFixed(1) + 'K';
    if (Math.abs(v) >= 1) return '$' + v.toFixed(1);
    return (v * 100).toFixed(1) + '%';
  }

  // Linear regression for trend line
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumX2 += i * i;
  }
  const denom = n * sumX2 - sumX * sumX;
  const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
  const safeSlope = isNaN(slope) ? 0 : slope;
  const intercept = (sumY - safeSlope * sumX) / n;
  const mean = sumY / n;
  const normalizedSlope = mean !== 0 ? safeSlope / Math.abs(mean) : 0;

  // For inverted metrics: if all values are negative (e.g. net cash), trend is always green
  const allNegative = inverted && data.every(v => v < 0);
  const trendColor = allNegative
    ? 'var(--green)'
    : inverted
      ? (normalizedSlope > 0.01 ? 'var(--red)' : normalizedSlope < -0.01 ? 'var(--green)' : 'var(--yellow)')
      : (normalizedSlope > 0.01 ? 'var(--green)' : normalizedSlope < -0.01 ? 'var(--red)' : 'var(--yellow)');

  function trendY(i) {
    const v = intercept + safeSlope * i;
    return padding.top + chartH - ((v - min) / range) * chartH;
  }

  // Years: use prop if provided, otherwise assume most recent = last year
  const startYear = startYearProp ?? (new Date().getFullYear() - 1 - data.length + 1);

  return (
    <div className="metric-chart">
      <div className="metric-chart-subtitle-row">
        {subtitle && <span className="metric-chart-subtitle">{subtitle}</span>}
        <span className="metric-chart-trend-label" style={{ color: trendColor }}>
          {(normalizedSlope * 100) >= 0 ? '+' : ''}{(normalizedSlope * 100).toFixed(1)}% trend
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto' }}
      >
        {/* Zero line */}
        {min < 0 && (
          <line
            x1={padding.left}
            y1={zeroY}
            x2={width - padding.right}
            y2={zeroY}
            stroke="var(--text-muted)"
            strokeWidth="0.5"
            strokeDasharray="3,2"
            opacity="0.5"
          />
        )}

        {data.map((v, i) => {
          const barH = Math.max(Math.abs((v / range) * chartH), 1);
          const x = padding.left + i * totalBarSpace + barGap / 2;
          const y = v >= 0 ? zeroY - barH : zeroY;
          const color = inverted
            ? (v >= 0 ? 'var(--red)' : 'var(--green)')
            : (v >= 0 ? 'var(--green)' : 'var(--red)');
          const yearLabel = startYear + i;

          // Value text inside the bar, vertically centered
          const textY = v >= 0 ? y + barH / 2 + 3 : y + barH / 2 + 3;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={2}
                fill={color}
                opacity={0.65}
              />
              <text
                x={x + barWidth / 2}
                y={textY}
                textAnchor="middle"
                fontSize="7.5"
                fontWeight="600"
                fill="var(--text-primary)"
              >
                {formatValue(v)}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - 3}
                textAnchor="middle"
                fontSize="8"
                fill="var(--text-muted)"
              >
                {String(yearLabel).slice(-2)}
              </text>
            </g>
          );
        })}

        {/* Trend line */}
        <line
          x1={padding.left + barGap / 2 + barWidth / 2}
          y1={trendY(0)}
          x2={padding.left + (n - 1) * totalBarSpace + barGap / 2 + barWidth / 2}
          y2={trendY(n - 1)}
          stroke={trendColor}
          strokeWidth="1.5"
          strokeDasharray="4,3"
          opacity="0.8"
        />
      </svg>
    </div>
  );
}
