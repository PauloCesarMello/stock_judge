import { formatDollar, formatPercent, formatRatio } from '../utils/format';
import Sparkline from './Sparkline';
import Tooltip from './Tooltip';

const METRIC_TOOLTIPS = {
  revenue: 'Total money the company earned from selling its products or services.',
  netIncome: 'The bottom-line profit after all expenses, taxes, and costs are subtracted from revenue.',
  cfo: 'Actual cash generated from the company\'s day-to-day business operations — the real money coming in.',
  fcf: 'Cash left over after the company pays for its operations and investments. This is money available for dividends, buybacks, or paying down debt.',
  cash: 'Cash and cash equivalents the company has on hand. This is the money available to cover short-term needs, invest, or pay down debt.',
  cfi: 'Cash spent on or received from investments — buying equipment, acquiring companies, or selling assets. Usually negative because companies spend money to grow.',
  cff: 'Cash raised from or returned to investors and lenders — borrowing, repaying debt, issuing stock, or buying back shares.',
  totalDebt: 'The total amount the company owes to lenders, including both short-term and long-term borrowings.',
  roic: 'How much profit the company generates for every dollar invested in the business. A higher percentage means the company is using its capital more efficiently.',
  operatingMargin: 'Operating income as a percent of revenue — how many cents per dollar of sales the business keeps after paying for operations. Expanding margins often signal pricing power or improving efficiency.',
  fcfMargin: 'Free cash flow as a percent of revenue — how many cents per dollar of sales end up as cash available to owners.',
  earningsQuality: 'A number close to or above 1 means the company is actually collecting the cash it reports as profit. A number well below 1 is a warning sign.',
  investmentIntensity: 'How much of its operating cash the company reinvests each year. Higher values mean the business is plowing more of what it earns back into the business.',
  debtToEbitda: 'How many years of earnings (before interest, taxes, and depreciation) it would take to pay off long-term debt. Under 2x is strong, 2–4x is moderate, above 4x is a warning sign.',
};

const PERCENT_METRICS = new Set(['roic', 'operatingMargin', 'fcfMargin']);
const RATIO_METRICS = new Set(['earningsQuality', 'investmentIntensity', 'debtToEbitda']);
const INVERSE_METRICS = new Set(['totalDebt']);

function calcCAGR(values, years) {
  const pairs = values
    .map((v, i) => ({ value: v, year: years[i] }))
    .filter((p) => p.value !== null && p.value > 0);

  if (pairs.length < 2) return null;

  const newest = pairs[0];
  const oldest = pairs[pairs.length - 1];
  const n = newest.year - oldest.year;
  if (n <= 0) return null;

  const cagr = Math.pow(newest.value / oldest.value, 1 / n) - 1;
  return cagr;
}

function formatCAGR(cagr) {
  if (cagr === null) return null;
  const pct = (cagr * 100).toFixed(1);
  return {
    text: `${Math.abs(pct)}% CAGR`,
    direction: cagr >= 0 ? 'up' : 'down',
  };
}

export default function MetricCard({ label, metricKey, metrics }) {
  const sparkValues = metrics.map((m) => m[metricKey]);
  const years = metrics.map((m) => m.year);
  const isPercent = PERCENT_METRICS.has(metricKey);
  const isRatio = RATIO_METRICS.has(metricKey);
  const isInverse = INVERSE_METRICS.has(metricKey);
  const cagr = isPercent || isRatio ? null : formatCAGR(calcCAGR(sparkValues, years));
  const tone = cagr && isInverse ? (cagr.direction === 'up' ? 'down' : 'up') : cagr?.direction;
  const format = isPercent ? formatPercent : isRatio ? formatRatio : formatDollar;

  return (
    <div className="metric-card">
      <div className="metric-header">
        <div className="metric-label">
          <Tooltip text={METRIC_TOOLTIPS[metricKey]}>
            {label}
          </Tooltip>
        </div>
        {cagr && (
          <span className={`metric-cagr ${tone}`}>
            {cagr.direction === 'up' ? '▲' : '▼'} {cagr.text}
          </span>
        )}
      </div>
      <Sparkline values={sparkValues} years={years} format={format} />
    </div>
  );
}
