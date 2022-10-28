export const LAST_ACCOUNT_KEY = 'mangoAccount-0.1'

export const CLIENT_TX_TIMEOUT = 90000

export const INPUT_TOKEN_DEFAULT = 'USDC'

export const OUTPUT_TOKEN_DEFAULT = 'SOL'

export const IS_ONBOARDED_KEY = 'isOnboarded-0.1'

export const SHOW_ZERO_BALANCES_KEY = 'show-zero-balances-0.1'

export const ALPHA_DEPOSIT_LIMIT = 20

export const SIDEBAR_COLLAPSE_KEY = 'sidebar-0.1'

export const ONBOARDING_TOUR_KEY = 'showOnboardingTour'

export const PREFERRED_EXPLORER_KEY = 'preferredExplorer'

export const PROFILE_CATEGORIES = [
  'borrower',
  'day-trader',
  'degen',
  'discretionary',
  'loan-shark',
  'market-maker',
  'swing-trader',
  'trader',
  'yolo',
]

export const COINGECKO_IDS = [
  { id: 'bitcoin', symbol: 'BTC' },
  { id: 'ethereum', symbol: 'ETH' },
  { id: 'solana', symbol: 'SOL' },
  { id: 'mango-markets', symbol: 'MNGO' },
  // { id: 'binancecoin', symbol: 'BNB' },
  // { id: 'serum', symbol: 'SRM' },
  // { id: 'raydium', symbol: 'RAY' },
  // { id: 'ftx-token', symbol: 'FTT' },
  // { id: 'avalanche-2', symbol: 'AVAX' },
  // { id: 'terra-luna', symbol: 'LUNA' },
  // { id: 'cope', symbol: 'COPE' },
  // { id: 'cardano', symbol: 'ADA' },
  { id: 'msol', symbol: 'MSOL' },
  { id: 'usd-coin', symbol: 'USDC' },
  { id: 'tether', symbol: 'USDT' },
  // { id: 'stepn', symbol: 'GMT' },
]

const baseUrl = 'https://event-history-api-candles.herokuapp.com'

export const CHART_DATA_FEED = `${baseUrl}/tv`

export const DEFAULT_MARKET_NAME = 'SOL/USDC'

export const GRID_LAYOUT_KEY = 'savedLayouts-0.1'

export const ORDERBOOK_FLASH_KEY = 'showOrderbookFlash-0.1'

export const NOTIFICATION_POSITION_KEY = 'notificationPosition'
