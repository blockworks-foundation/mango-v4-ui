import { AnchorProvider, Program } from '@project-serum/anchor'
import { PythHttpClient } from '@pythnetwork/client'
import { notify } from 'utils/notifications'
import { MAINNET_PYTH_PROGRAM } from './constants'
import { OPENBOOK_PROGRAM_ID, toNative } from '@blockworks-foundation/mango-v4'
import { Market } from '@project-serum/serum'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import EmptyWallet from 'utils/wallet'

export const getOracle = async ({
  baseSymbol,
  quoteSymbol,
  connection,
  pythOnly = false,
}: {
  baseSymbol: string
  quoteSymbol: string
  connection: Connection
  pythOnly?: boolean
}) => {
  try {
    let oraclePk = ''
    const pythOracle = await getPythOracle({
      baseSymbol,
      quoteSymbol,
      connection,
    })
    if (pythOracle) {
      oraclePk = pythOracle
    } else if (!pythOnly) {
      const switchBoardOracle = await getSwitchBoardOracle({
        baseSymbol,
        quoteSymbol,
        connection,
      })
      oraclePk = switchBoardOracle
    }

    return oraclePk
  } catch (e) {
    notify({
      title: 'Oracle not found',
      description: `${e}`,
      type: 'error',
    })
  }
}

export const getPythOracle = async ({
  baseSymbol,
  quoteSymbol,
  connection,
}: {
  baseSymbol: string
  quoteSymbol: string
  connection: Connection
}) => {
  try {
    const pythClient = new PythHttpClient(connection, MAINNET_PYTH_PROGRAM)
    const pythAccounts = await pythClient.getData()
    const product = pythAccounts.products.find(
      (x) =>
        x.base === baseSymbol.toUpperCase() &&
        x.quote_currency === quoteSymbol.toUpperCase()
    )
    return product?.price_account || ''
  } catch (e) {
    notify({
      title: 'Pyth oracle fetch error',
      description: `${e}`,
      type: 'error',
    })
    return ''
  }
}

export const getSwitchBoardOracle = async ({
  baseSymbol,
  quoteSymbol,
  connection,
}: {
  baseSymbol: string
  quoteSymbol: string
  connection: Connection
}) => {
  try {
    const SWITCHBOARD_PROGRAM_ID = 'SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f'

    const options = AnchorProvider.defaultOptions()
    const provider = new AnchorProvider(
      connection,
      new EmptyWallet(Keypair.generate()),
      options
    )
    const idl = await Program.fetchIdl(
      new PublicKey(SWITCHBOARD_PROGRAM_ID),
      provider
    )
    const switchboardProgram = new Program(
      idl!,
      new PublicKey(SWITCHBOARD_PROGRAM_ID),
      provider
    )

    const allFeeds =
      await switchboardProgram.account.aggregatorAccountData.all()

    const feedNames = allFeeds.map((x) =>
      String.fromCharCode(...[...(x.account.name as number[])].filter((x) => x))
    )

    const possibleFeedIndexes = feedNames.reduce(function (r, v, i) {
      return r.concat(
        v.toLowerCase().includes(baseSymbol.toLowerCase()) &&
          v.toLowerCase().includes(quoteSymbol.toLowerCase())
          ? i
          : []
      )
    }, [] as number[])

    const possibleFeeds = allFeeds.filter(
      (x, i) => possibleFeedIndexes.includes(i) && x.account.isLocked
    )
    return possibleFeeds.length ? possibleFeeds[0].publicKey.toBase58() : ''
  } catch (e) {
    notify({
      title: 'Switchboard oracle fetch error',
      description: `${e}`,
      type: 'error',
    })
    return ''
  }
}

export const getBestMarket = async ({
  baseMint,
  quoteMint,
  cluster,
  connection,
}: {
  baseMint: string
  quoteMint: string
  cluster: 'devnet' | 'mainnet-beta'
  connection: Connection
}) => {
  try {
    const dexProgramPk = OPENBOOK_PROGRAM_ID[cluster]

    const markets = await Market.findAccountsByMints(
      connection,
      new PublicKey(baseMint),
      new PublicKey(quoteMint),
      dexProgramPk
    )

    if (!markets.length) {
      return undefined
    }
    if (markets.length === 1) {
      return markets[0].publicKey
    }
    const marketsDataJsons = await Promise.all([
      ...markets.map((x) =>
        fetch(`/openSerumApi/market/${x.publicKey.toBase58()}`)
      ),
    ])
    const marketsData = await Promise.all([
      ...marketsDataJsons.map((x) => x.json()),
    ])
    const bestMarket = marketsData.sort((a, b) => b.volume24h - a.volume24h)
    return bestMarket.length
      ? new PublicKey(bestMarket[0].id)
      : markets[0].publicKey
  } catch (e) {
    notify({
      title: 'Openbook market not found',
      description: `${e}`,
      type: 'error',
    })
  }
}

// definitions:
// baseLots = 10 ^ baseLotExponent
// quoteLots = 10 ^ quoteLotExponent
// minOrderSize = 10^(baseLotExponent - baseDecimals)
// minOrderValue = basePrice * minOrderSize
// priceIncrement =  10^(quoteLotExponent + baseDecimals - baseLotExponent - quoteDecimals)
// priceIncrementRelative =  priceIncrement * quotePrice / basePrice

// derive: baseLotExponent <= min[ basePrice * minOrderSize > 0.05]
// baseLotExponent = 10
// While (baseLotExponent < 10):
//     minOrderSize =  10^(baseLotExponent - baseDecimals)
//     minOrderValue =  basePrice * minOrderSize
//     if minOrderValue > 0.05:
//         break;

// Derive: quoteLotExponent <= min[ priceIncrement * quotePrice / basePrice > 0.000025 ]
// quoteLotExponent = 0
// While (quoteLotExponent < 10):
//     priceIncrement =  10^(quoteLotExponent + baseDecimals - baseLotExponent - quoteDecimals)
//         priceIncrementRelative =  priceIncrement * quotePrice / basePrice
//     if priceIncrementRelative > 0.000025:
//         break;

export function calculateTradingParameters(
  basePrice: number,
  quotePrice: number,
  baseDecimals: number,
  quoteDecimals: number
) {
  const MAX_MIN_ORDER_VALUE = 0.05
  const MIN_PRICE_INCREMENT_RELATIVE = 0.000025
  const EXPONENT_THRESHOLD = 10

  let minOrderSize = 0
  let priceIncrement = 0
  let baseLotExponent = 0
  let quoteLotExponent = 0
  let minOrderValue = 0
  let priceIncrementRelative = 0

  // Calculate minimum order size
  do {
    minOrderSize = Math.pow(10, baseLotExponent - baseDecimals)
    minOrderValue = basePrice * minOrderSize

    if (minOrderValue > MAX_MIN_ORDER_VALUE) {
      break
    }

    baseLotExponent++
  } while (baseLotExponent < EXPONENT_THRESHOLD)

  // Calculate price increment
  do {
    priceIncrement = Math.pow(
      10,
      quoteLotExponent + baseDecimals - baseLotExponent - quoteDecimals
    )
    priceIncrementRelative = (priceIncrement * quotePrice) / basePrice
    if (priceIncrementRelative > MIN_PRICE_INCREMENT_RELATIVE) {
      break
    }

    quoteLotExponent++
  } while (quoteLotExponent < EXPONENT_THRESHOLD)

  //exception override values in that case example eth/btc market
  if (
    quoteLotExponent === 0 &&
    priceIncrementRelative > 0.001 &&
    minOrderSize < 1
  ) {
    baseLotExponent = baseLotExponent + 1
    minOrderSize = Math.pow(10, baseLotExponent - baseDecimals)
    minOrderValue = basePrice * minOrderSize
    priceIncrement = Math.pow(
      10,
      quoteLotExponent + baseDecimals - baseLotExponent - quoteDecimals
    )
    priceIncrementRelative = (priceIncrement * quotePrice) / basePrice
  }

  return {
    baseLots: Math.pow(10, baseLotExponent),
    quoteLots: Math.pow(10, quoteLotExponent),
    minOrderValue: minOrderValue,
    baseLotExponent: baseLotExponent,
    quoteLotExponent: quoteLotExponent,
    minOrderSize: minOrderSize,
    priceIncrement: priceIncrement,
    priceIncrementRelative: priceIncrementRelative,
  }
}

export const getQuoteSymbol = (quoteTokenSymbol: string) => {
  if (
    quoteTokenSymbol.toLowerCase() === 'usdc' ||
    quoteTokenSymbol.toLocaleLowerCase() === 'usdt'
  ) {
    return 'usd'
  }
  return quoteTokenSymbol
}

const listingBase = {
  maxStalenessSlots: 120 as number | null,
  oracleConfFilter: 0.1,
  adjustmentFactor: 0.004,
  util0: 0.5,
  rate0: 0.018,
  util1: 0.8,
  rate1: 0.05,
  maxRate: 0.8,
  loanFeeRate: 0.1,
  loanOriginationFeeRate: 0.001,
  maintAssetWeight: 0.9,
  initAssetWeight: 0.8,
  maintLiabWeight: 1.1,
  initLiabWeight: 1.2,
  liquidationFee: 0.05,
  minVaultToDepositsRatio: 0.2,
  netBorrowLimitWindowSizeTs: 24 * 60 * 60,
  netBorrowLimitPerWindowQuote: toNative(50000, 6).toNumber(),
  insuranceFound: true,
  borrowWeightScale: toNative(250000, 6).toNumber(),
  depositWeightScale: toNative(250000, 6).toNumber(),
}

const secondTierRates = {
  rate0: 0.052,
  rate1: 0.1446,
  maxRate: 1.4456,
}

export const LISTING_PRESETS: {
  [key: string]: typeof listingBase & { name: string }
} = {
  //Price impact $100,000 < 1%
  PREMIUM: {
    ...listingBase,
    name: 'Premium',
  },
  //Price impact $20,000 < 1%
  MID: {
    ...listingBase,
    ...secondTierRates,
    maintAssetWeight: 0.75,
    initAssetWeight: 0.5,
    maintLiabWeight: 1.2,
    initLiabWeight: 1.4,
    liquidationFee: 0.1,
    netBorrowLimitPerWindowQuote: toNative(20000, 6).toNumber(),
    name: 'Mid',
    borrowWeightScale: toNative(50000, 6).toNumber(),
    depositWeightScale: toNative(50000, 6).toNumber(),
    insuranceFound: false,
  },
  //Price impact $5,000 < 1%
  MEME: {
    ...listingBase,
    ...secondTierRates,
    maxStalenessSlots: null,
    loanOriginationFeeRate: 0.002,
    maintAssetWeight: 0,
    initAssetWeight: 0,
    maintLiabWeight: 1.25,
    initLiabWeight: 1.5,
    liquidationFee: 0.125,
    netBorrowLimitPerWindowQuote: toNative(5000, 6).toNumber(),
    borrowWeightScale: toNative(20000, 6).toNumber(),
    depositWeightScale: toNative(20000, 6).toNumber(),
    insuranceFound: false,
    name: 'Meme',
  },
  //Price impact $1,000 < 1%
  SHIT: {
    ...listingBase,
    ...secondTierRates,
    maxStalenessSlots: null,
    loanOriginationFeeRate: 0.002,
    maintAssetWeight: 0,
    initAssetWeight: 0,
    maintLiabWeight: 1.4,
    initLiabWeight: 1.8,
    liquidationFee: 0.2,
    netBorrowLimitPerWindowQuote: toNative(1000, 6).toNumber(),
    borrowWeightScale: toNative(5000, 6).toNumber(),
    depositWeightScale: toNative(5000, 6).toNumber(),
    insuranceFound: false,
    name: 'Shit',
  },
}

export const coinTiersToNames: {
  [key: string]: string
} = {
  PREMIUM: 'Blue Chip',
  MID: 'Mid-wit',
  MEME: 'Meme',
  SHIT: 'Shit Coin',
}
