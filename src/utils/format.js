export function formatNumber(num) {
  if (num == null || isNaN(num)) return 'N/A';
  if (Math.abs(num) >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toFixed(2);
}

export function formatCurrency(num, currency = 'USD') {
  if (num == null || isNaN(num)) return 'N/A';
  const symbol = currency === 'BRL' ? 'R$' : '$';
  return symbol + formatNumber(num);
}

export function formatPrice(num, currency = 'USD') {
  if (num == null || isNaN(num)) return 'N/A';
  const symbol = currency === 'BRL' ? 'R$' : '$';
  return symbol + num.toFixed(2);
}

export function formatEmployees(num) {
  if (num == null) return 'N/A';
  return num.toLocaleString();
}
