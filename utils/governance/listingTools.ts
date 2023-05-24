import { AnchorProvider, Program } from '@project-serum/anchor'
import { PythHttpClient } from '@pythnetwork/client'
import { notify } from 'utils/notifications'
import { MAINNET_PYTH_PROGRAM } from './constants'
import { OPENBOOK_PROGRAM_ID } from '@blockworks-foundation/mango-v4'
import { Market } from '@project-serum/serum'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import EmptyWallet from 'utils/wallet'

export const getOracle = async ({
  baseSymbol,
  quoteSymbol,
  connection,
}: {
  baseSymbol: string
  quoteSymbol: string
  connection: Connection
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
    } else {
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
    console.log(bestMarket)
    return new PublicKey(bestMarket[0].id)
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

// derive: baseLotExponent <= max[ basePrice * minOrderSize  < 0.5] (start high -> go low until condition is met)
// baseLotExponent = 20
// While (baseLotExponent > 0):
//     minOrderSize =  10^(baseLotExponent - baseDecimals)
//     minOrderValue =  basePrice * minOrderSize
//     if minOrderValue < 0.5:
//         break;

// Derive: quoteLotExponent <= max[ priceIncrement * basePrice / quotePrice < 0.0001 ]
// quoteLotExponent = 20
// While (quoteLotExponent > 0):
//     priceIncrement =  10^(quoteLotExponent + baseDecimals - baseLotExponent - quoteDecimals)
//         priceIncrementRelative =  priceIncrement * basePrice / quotePrice
//     if priceIncrementRelative < 0.0002:
//         break;

export function calculateTradingParameters(
  basePrice: number,
  quotePrice: number,
  baseDecimals: number,
  quoteDecimals: number
) {
  const MAX_MIN_ORDER_VALUE = 0.5
  const MIN_PRICE_INCREMENT_RELATIVE = 0.0002

  let minOrderSize = 0
  let priceIncrement = 0
  let baseLotExponent = 20
  let quoteLotExponent = 20

  // Calculate minimum order size
  do {
    minOrderSize = Math.pow(10, baseLotExponent - baseDecimals)
    const minOrderValue = basePrice * minOrderSize

    if (minOrderValue < MAX_MIN_ORDER_VALUE) {
      break
    }

    baseLotExponent--
  } while (baseLotExponent > 0)

  // Calculate price increment
  do {
    priceIncrement = Math.pow(
      10,
      quoteLotExponent + baseDecimals - baseLotExponent - quoteDecimals
    )
    const priceIncrementRelative = (priceIncrement * basePrice) / quotePrice
    if (priceIncrementRelative < MIN_PRICE_INCREMENT_RELATIVE) {
      break
    }

    quoteLotExponent--
  } while (quoteLotExponent > 0)
  return {
    minOrder: minOrderSize,
    priceTick: priceIncrement,
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
