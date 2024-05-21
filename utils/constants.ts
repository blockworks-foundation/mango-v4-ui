import { PublicKey } from '@solana/web3.js'

export const LAST_ACCOUNT_KEY = 'mangoAccount-0.4'

export const CLIENT_TX_TIMEOUT = 90000

export const SECONDS = 1000

export const INPUT_TOKEN_DEFAULT = 'SOL'
export const MANGO_MINT = 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac'
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
export const OUTPUT_TOKEN_DEFAULT = 'MNGO'

export const JUPITER_V4_PROGRAM_ID =
  'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB'

export const CONNECTION_COMMITMENT = 'processed'

// Local storage keys for settings
export const IS_ONBOARDED_KEY = 'isOnboarded-0.1'

export const SHOW_ZERO_BALANCES_KEY = 'show-zero-balances-0.2'

export const SIDEBAR_COLLAPSE_KEY = 'sidebar-0.1'

export const UI_TOURS_KEY = 'uiToursCompleted-0.1'

export const PREFERRED_EXPLORER_KEY = 'preferredExplorer-0.1'

export const ANIMATION_SETTINGS_KEY = 'animationSettings-0.1'

export const SOUND_SETTINGS_KEY = 'soundSettings-0.1'

export const SIZE_INPUT_UI_KEY = 'tradeFormUi-0.2'

export const TRADE_CHECKBOXES_KEY = 'tradeCheckboxes-0.1'

export const TV_USER_ID_KEY = 'tv-userId-0.1'

export const GRID_LAYOUT_KEY = 'savedLayouts-0.2'

export const NOTIFICATION_POSITION_KEY = 'notificationPosition-0.2'

export const TRADE_CHART_UI_KEY = 'tradeChart-0.3'

export const FAVORITE_MARKETS_KEY = 'favoriteMarkets-0.3'

export const FAVORITE_SWAPS_KEY = 'favoriteSwaps-0.2'

export const THEME_KEY = 'theme-0.1'

export const RPC_PROVIDER_KEY = 'rpcProviderKey-0.11'

export const PRIORITY_FEE_KEY = 'priorityFeeKey-0.2'

export const SHOW_ORDER_LINES_KEY = 'showOrderLines-0.1'

export const SWAP_MARGIN_KEY = 'swapMargin-0.1'

export const SHOW_SWAP_INTRO_MODAL = 'showSwapModal-0.1'

export const ACCEPT_TERMS_KEY = 'termsOfUseAccepted-0.1'

export const TRADE_LAYOUT_KEY = 'tradeLayoutKey-0.1'

export const STATS_TAB_KEY = 'activeStatsTab-0.1'

export const USE_ORDERBOOK_FEED_KEY = 'useOrderbookFeed-0.2'

export const HOT_KEYS_KEY = 'hotKeys-0.2'

export const AUTO_CONNECT_WALLET = 'auto-connect-0.1'

export const LAST_WALLET_NAME = 'lastWalletName'

export const PRIVACY_MODE = 'privacy-mode-0.1'

export const MANGO_MINTS_BANNER_KEY = 'mangoMintsBanner-0.1'

export const SEND_TELEMETRY_KEY = 'sendTelemetry-0.1'

export const SLOTS_WARNING_KEY = 'tokenSlotsWarning-0.1'

export const NEW_LISTING_BANNER_KEY = 'new-listing-banner-0.3'

export const NON_RESTRICTED_JURISDICTION_KEY = 'non-restricted-jurisdiction-0.1'

export const FILTER_ORDERS_FOR_MARKET_KEY = 'filterOrdersForMarket-0.1'
export const FILTER_HISTORY_FOR_MARKET_KEY = 'filterHistoryForMarket-0.1'

export const SHOW_ANNOUNCEMENTS_KEY = 'showAnnouncements-0.1'

export const TOKEN_WATCHLIST_KEY = 'watchlist-0.1'

// Unused
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

export const MANGO_ROUTER_API_URL = 'https://router-1.fly.dev'

export const MANGO_DATA_API_URL = 'https://api.mngo.cloud/data/v4'

export const MANGO_DATA_OPENBOOK_URL = 'https://api.mngo.cloud/openbook/v1'

export const DEFAULT_MARKET_NAME = 'SOL-PERP'

export const MIN_SOL_BALANCE = 0.001

export const MAX_PRIORITY_FEE_KEYS = 128

export const BORROW_REPAY_MODAL_INNER_HEIGHT = '436px'

export const DEPOSIT_WITHDRAW_MODAL_INNER_HEIGHT = '536px'

export const TRADE_VOLUME_ALERT_KEY = 'tradeVolumeAlert-0.1'

export const PAGINATION_PAGE_LENGTH = 250

export const JUPITER_API_MAINNET = 'https://token.jup.ag/all'

export const JUPITER_API_DEVNET = 'https://api.jup.ag/api/tokens/devnet'

export const JUPITER_PRICE_API_MAINNET = 'https://price.jup.ag/v4/' // V6 Does not yet support /price requests as of 16/10/2023

export const JUPITER_V6_QUOTE_API_MAINNET = 'https://quote-api.jup.ag/v6'

export const NOTIFICATION_API = 'https://notifications-api.herokuapp.com/'

export const NOTIFICATION_API_WEBSOCKET =
  'wss://notifications-api.herokuapp.com/ws'

export const SWITCHBOARD_PROGRAM_ID =
  'SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f'

export const AUCTION_HOUSE_ID = new PublicKey(
  'BGBBt6G9bp36i5qt7PWjBWg3VNef1zPozAN9RFsEPDkh',
)
export const CUSTOM_TOKEN_ICONS: { [key: string]: boolean } = {
  all: true,
  blze: true,
  bome: true,
  bonk: true,
  btc: true,
  chai: true,
  corn: true,
  crown: true,
  dai: true,
  drift: true,
  dual: true,
  elon: true,
  eth: true,
  ethpo: true,
  'eth (portal)': true,
  eurc: true,
  gecko: true,
  gme: true,
  gofx: true,
  guac: true,
  hnt: true,
  inf: true,
  jitosol: true,
  jlp: true,
  jsol: true,
  jto: true,
  jup: true,
  kin: true,
  kmno: true,
  ldo: true,
  mew: true,
  mnde: true,
  mngo: true,
  moutai: true,
  meta: true,
  msol: true,
  neon: true,
  nos: true,
  orca: true,
  popcat: true,
  pups: true,
  pyth: true,
  ray: true,
  render: true,
  rlb: true,
  samo: true,
  slcl: true,
  slerf: true,
  sol: true,
  step: true,
  stsol: true,
  tbtc: true,
  tnsr: true,
  usdc: true,
  usdh: true,
  usdt: true,
  w: true,
  wbtcpo: true,
  'wbtc (portal)': true,
  wen: true,
  $wif: true,
  wif: true,
  zeus: true,
}

export const DEFAULT_FAVORITE_MKTS = ['SOL-PERP', 'ETH-PERP', 'BTC-PERP']

export const WHITE_LIST_API = 'https://api.mngo.cloud/whitelist/v1/'
export const DAILY_SECONDS = 86400
export const DAILY_MILLISECONDS = 86400000

// max slot numbers for mango account
export const MAX_ACCOUNTS = {
  tokenAccounts: '8',
  spotOpenOrders: '4',
  perpAccounts: '3',
  perpOpenOrders: '24',
  tcsOrders: '24',
}

export enum TOKEN_REDUCE_ONLY_OPTIONS {
  DISABLED,
  ENABLED,
  NO_BORROWS,
}

export const PRIVATE_MODE_STRING = '****'

export const MANGO_MAINNET_GROUP = new PublicKey(
  '78b8f4cGCwmZ9ysPFMWLaLTkkaYnUjwMJYStWe5RTSSX',
)

export const MAX_PERP_SLIPPAGE = 0.025

export const COLLATERAL_FEE_KEY = 'collateral_fee_modal_v1'
