import MetricChart from './MetricChart';

export default function HealthScore({ health }) {
  const { score, checks, values, sparklines, verdict } = health;

  const verdictClass = verdict === 'Healthy' ? 'healthy' : verdict === 'Watch' ? 'watch' : 'unhealthy';

  const metrics = [
    {
      section: 'Growth',
      items: [
        { key: 'revenueGrowth', label: 'Revenue', subtitle: 'Sales / Share', format: 'number' },
        { key: 'netIncomeGrowth', label: 'Net Income', subtitle: 'Net Income / Share', format: 'number' },
        { key: 'fcfGrowth', label: 'Free Cash Flow', subtitle: 'FCF / Sales', format: 'percent' },
      ],
    },
    {
      section: 'Profitability',
      items: [
        { key: 'profitMarginAbove10', label: 'Profit Margin', subtitle: 'Net Income / Sales', format: 'percent' },

        { key: 'roicTrend', label: 'ROIC', subtitle: 'Return on Invested Capital', format: 'percent' },
      ],
    },
    {
      section: 'Safety',
      items: [
        { key: 'netDebtCapital', label: 'Net Debt / Capital', subtitle: '(Debt - Cash) / Total Capital', format: 'percent', inverted: true },
      ],
    },
  ];

  function checkIcon(state) {
    const cls = state === 'pass' ? 'traffic-green' : state === 'neutral' ? 'traffic-yellow' : 'traffic-red';
    return <span className={`traffic-light ${cls}`} />;
  }

  return (
    <div className="health-sections">
      <div className="metric-grid">
        {metrics.flatMap(section =>
          section.items.map(item => (
            <div key={item.key} className="metric-panel">
              <div className="metric-panel-header">
                <span className="score-icon">{checkIcon(checks[item.key])}</span>
                <span className="metric-panel-label">{item.label}</span>
              </div>
              {sparklines[item.key] && sparklines[item.key].length >= 2 ? (
                <MetricChart
                  subtitle={item.subtitle}
                  data={sparklines[item.key]}
                  format={item.format}
                  inverted={item.inverted}
                />
              ) : values[item.key] != null ? (
                <div className="metric-panel-value">{values[item.key]}</div>
              ) : (
                <div className="metric-panel-value metric-panel-na">N/A</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
