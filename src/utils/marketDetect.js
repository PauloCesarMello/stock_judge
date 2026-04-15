// Brazilian tickers: 4-letter code + digit (e.g., PETR4, VALE3, BBAS3)
const BR_TICKER_REGEX = /^[A-Z]{4}\d{1,2}$/;

export function isBrazilianTicker(ticker) {
  return BR_TICKER_REGEX.test(ticker.toUpperCase());
}

export function getMarket(ticker) {
  return isBrazilianTicker(ticker) ? 'BR' : 'US';
}
