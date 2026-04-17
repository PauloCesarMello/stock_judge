import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const SEC_UA = 'StockJudge stock-judge-app@example.com'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const finnhubKey = env.VITE_FINNHUB_API_KEY || ''

  const finnhubProxy = (endpoint) => ({
    target: 'https://finnhub.io',
    changeOrigin: true,
    rewrite: (path) => {
      const query = path.split('?')[1] || ''
      return `/api/v1/${endpoint}?${query}${query ? '&' : ''}token=${finnhubKey}`
    },
  })

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/sec-tickers': {
          target: 'https://www.sec.gov',
          changeOrigin: true,
          rewrite: () => '/files/company_tickers.json',
          headers: { 'User-Agent': SEC_UA, Accept: 'application/json' },
        },
        '/api/sec-facts': {
          target: 'https://data.sec.gov',
          changeOrigin: true,
          rewrite: (path) => {
            const cik = path.split('/').pop().split('?')[0]
            return `/api/xbrl/companyfacts/CIK${cik}.json`
          },
          headers: { 'User-Agent': SEC_UA, Accept: 'application/json' },
        },
        '/api/finnhub-profile': {
          ...finnhubProxy('stock/profile2'),
        },
        '/api/finnhub-quote': {
          ...finnhubProxy('quote'),
        },
        '/api/finnhub-metric': {
          target: 'https://finnhub.io',
          changeOrigin: true,
          rewrite: (path) => {
            const query = path.split('?')[1] || ''
            return `/api/v1/stock/metric?${query}${query ? '&' : ''}metric=all&token=${finnhubKey}`
          },
        },
      },
    },
  }
})
