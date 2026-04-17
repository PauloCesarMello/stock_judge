import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const finnhubKey = env.VITE_FINNHUB_API_KEY || ''

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/sec-tickers': {
          target: 'https://www.sec.gov',
          changeOrigin: true,
          rewrite: () => '/files/company_tickers.json',
          headers: {
            'User-Agent': 'StockJudge stock-judge-app@example.com',
            'Accept': 'application/json',
          },
        },
        '/sec-api': {
          target: 'https://data.sec.gov',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/sec-api/, ''),
          headers: {
            'User-Agent': 'StockJudge stock-judge-app@example.com',
            'Accept': 'application/json',
          },
        },
        '/finnhub': {
          target: 'https://finnhub.io',
          changeOrigin: true,
          rewrite: (path) => {
            const rewritten = path.replace(/^\/finnhub/, '/api/v1')
            const sep = rewritten.includes('?') ? '&' : '?'
            return `${rewritten}${sep}token=${finnhubKey}`
          },
        },
      },
    },
  }
})
