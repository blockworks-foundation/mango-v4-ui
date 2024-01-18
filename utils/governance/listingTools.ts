import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { PythHttpClient } from '@pythnetwork/client'
import { notify } from 'utils/notifications'
import { MAINNET_PYTH_PROGRAM } from './constants'
import {
  Bank,
  Group,
  I80F48,
  OPENBOOK_PROGRAM_ID,
  PriceImpact,
  toUiDecimals,
  toUiDecimalsForQuote,
} from '@blockworks-foundation/mango-v4'
import { Market } from '@project-serum/serum'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import EmptyWallet from 'utils/wallet'
import dayjs from 'dayjs'
import { LISTING_PRESET } from '@blockworks-foundation/mango-v4-settings/lib/helpers/listingTools'

export const getOracle = async ({
  baseSymbol,
  quoteSymbol,
  connection,
  targetAmount,
}: {
  baseSymbol: string
  quoteSymbol: string
  connection: Connection
  targetAmount: number
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
        noLock: targetAmount === 0 || targetAmount === 1000,
      })
      oraclePk = switchBoardOracle
    }

    return { oraclePk, isPyth: !!pythOracle }
  } catch (e) {
    console.log(e)
    notify({
      title: 'Oracle not found',
      description: `${e}`,
      type: 'error',
    })
    return { oraclePk: '', isPyth: false }
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
        x.quote_currency === quoteSymbol.toUpperCase(),
    )
    const isLive =
      product &&
      pythAccounts.productPrice.get(product.symbol)?.price !== undefined

    return isLive && product?.price_account ? product.price_account : ''
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
  noLock,
}: {
  baseSymbol: string
  quoteSymbol: string
  connection: Connection
  noLock: boolean
}) => {
  try {
    const SWITCHBOARD_PROGRAM_ID = 'SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f'

    const options = AnchorProvider.defaultOptions()
    const provider = new AnchorProvider(
      connection,
      new EmptyWallet(Keypair.generate()),
      options,
    )
    const idl = await Program.fetchIdl(
      new PublicKey(SWITCHBOARD_PROGRAM_ID),
      provider,
    )
    const switchboardProgram = new Program(
      idl!,
      new PublicKey(SWITCHBOARD_PROGRAM_ID),
      provider,
    )

    //get all feeds check if they are tried to fetch in last 24h
    const allFeeds = (
      await switchboardProgram.account.aggregatorAccountData.all()
    ).filter(
      (x) =>
        isWithinLastXHours(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (x as any).account.currentRound.roundOpenTimestamp.toNumber(),
          24,
        ) ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        isWithinLastXHours((x as any).account.creationTimestamp.toNumber(), 2),
    )

    //parse names of feeds
    const feedNames = allFeeds.map((x) =>
      String.fromCharCode(
        ...[...(x.account.name as number[])].filter((x) => x),
      ),
    )

    //find feeds that match base + quote
    //base is checked to include followed by non alphabetic character e.g
    //if base is kin it will match kin_usd, kin/USD, kin usd, but not king/usd
    //looks like most feeds are using space, _ or /
    const possibleFeedIndexes = feedNames.reduce(function (r, v, i) {
      const isBaseMatch =
        v.toLowerCase().includes(baseSymbol.toLowerCase()) &&
        (() => {
          const match = v.toLowerCase().match(baseSymbol.toLowerCase())
          if (!match) return false

          const idx = match!.index! + baseSymbol.length
          const nextChar = v[idx]
          return !nextChar || [' ', '/', '_'].includes(nextChar)
        })()

      const isQuoteMatch = v.toLowerCase().includes(quoteSymbol.toLowerCase())

      return r.concat(isBaseMatch && isQuoteMatch ? i : [])
    }, [] as number[])

    //feeds sponsored by switchboard or solend
    const trustedQuesKeys = [
      //switchboard sponsored que
      new PublicKey('3HBb2DQqDfuMdzWxNk1Eo9RTMkFYmuEAd32RiLKn9pAn'),
    ]
    const sponsoredAuthKeys = [
      //solend
      new PublicKey('A4PzGUimdCMv8xvT5gK2fxonXqMMayDm3eSXRvXZhjzU'),
      //switchboard
      new PublicKey('31Sof5r1xi7dfcaz4x9Kuwm8J9ueAdDduMcme59sP8gc'),
    ]

    const possibleFeeds = allFeeds
      .filter((x, i) => possibleFeedIndexes.includes(i))
      //unlocked feeds can be used only when noLock is true
      //atm only for untrusted use
      .filter((x) => (noLock ? true : x.account.isLocked))
      .sort((x) => (x.account.isLocked ? -1 : 1))

    const sponsoredFeeds = possibleFeeds.filter(
      (x) =>
        sponsoredAuthKeys.find((s) =>
          s.equals(x.account.authority as PublicKey),
        ) ||
        trustedQuesKeys.find((s) =>
          s.equals(x.account.queuePubkey as PublicKey),
        ),
    )

    return sponsoredFeeds.length
      ? sponsoredFeeds[0].publicKey.toBase58()
      : possibleFeeds.length
      ? possibleFeeds[0].publicKey.toBase58()
      : ''
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
      dexProgramPk,
    )

    if (!markets.length) {
      return undefined
    }
    const marketsDataJsons = await Promise.all([
      ...markets.map((x) =>
        fetch(`/openSerumApi/market/${x.publicKey.toBase58()}`),
      ),
    ])
    const marketsData = await Promise.all([
      ...marketsDataJsons.map((x) => x.json()),
    ])
    let sortedMarkets = marketsData
      .filter((x) => Object.keys(x).length)
      .sort((a, b) => b.volume24h - a.volume24h)

    let firstBestMarket = sortedMarkets.length ? sortedMarkets[0] : undefined
    if (firstBestMarket?.volume24h === 0 || !sortedMarkets.length) {
      notify({
        title: 'Openbook market had 0 volume in last 24h check it carefully',
        description: ``,
        type: 'error',
      })
    }
    sortedMarkets = sortedMarkets.sort(
      (a, b) => b.quoteDepositsTotal - a.quoteDepositsTotal,
    )

    firstBestMarket = sortedMarkets.length ? sortedMarkets[0] : undefined

    return sortedMarkets.length && firstBestMarket?.id
      ? new PublicKey(firstBestMarket.id)
      : markets[0].publicKey
  } catch (e) {
    notify({
      title: 'Openbook market not found',
      description: `${e}`,
      type: 'error',
    })
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

export const formatSuggestedValues = (
  suggestedParams: Record<string, never> | Omit<LISTING_PRESET, 'name'>,
) => {
  return {
    maxStalenessSlots: suggestedParams.maxStalenessSlots,
    oracleConfFilter: (100 * suggestedParams.oracleConfFilter).toFixed(2),
    adjustmentFactor: (suggestedParams.adjustmentFactor * 100).toFixed(2),
    rate0: (100 * suggestedParams.rate0).toFixed(2),
    util0: (100 * suggestedParams.util0).toFixed(),
    rate1: (100 * suggestedParams.rate1).toFixed(2),
    util1: (100 * suggestedParams.util1).toFixed(),
    maxRate: (100 * suggestedParams.maxRate).toFixed(2),
    loanFeeRate: (10000 * suggestedParams.loanFeeRate).toFixed(2),
    loanOriginationFeeRate: (
      10000 * suggestedParams.loanOriginationFeeRate
    ).toFixed(2),
    maintAssetWeight: suggestedParams.maintAssetWeight.toFixed(2),
    initAssetWeight: suggestedParams.initAssetWeight.toFixed(2),
    maintLiabWeight: suggestedParams.maintLiabWeight.toFixed(2),
    initLiabWeight: suggestedParams.initLiabWeight.toFixed(2),
    liquidationFee: (suggestedParams.liquidationFee * 100).toFixed(2),
    minVaultToDepositsRatio: suggestedParams.minVaultToDepositsRatio * 100,
    netBorrowLimitPerWindowQuote: toUiDecimals(
      suggestedParams.netBorrowLimitPerWindowQuote,
      6,
    ),
    borrowWeightScaleStartQuote: toUiDecimals(
      suggestedParams.borrowWeightScaleStartQuote,
      6,
    ),
    depositWeightScaleStartQuote: toUiDecimals(
      suggestedParams.depositWeightScaleStartQuote,
      6,
    ),
    groupInsuranceFund: suggestedParams.groupInsuranceFund,
    netBorrowLimitWindowSizeTs: suggestedParams.netBorrowLimitWindowSizeTs,
    stablePriceDelayIntervalSeconds:
      suggestedParams.stablePriceDelayIntervalSeconds,
    stablePriceGrowthLimit: suggestedParams.stablePriceGrowthLimit,
    stablePriceDelayGrowthLimit: suggestedParams.stablePriceDelayGrowthLimit,
    tokenConditionalSwapTakerFeeRate:
      suggestedParams.tokenConditionalSwapTakerFeeRate,
    tokenConditionalSwapMakerFeeRate:
      suggestedParams.tokenConditionalSwapMakerFeeRate,
    interestTargetUtilization:
      suggestedParams.interestTargetUtilization.toString(),
    interestCurveScaling: suggestedParams.interestCurveScaling.toString(),
    depositLimit: suggestedParams.depositLimit,
    flashLoanSwapFeeRate: suggestedParams.flashLoanSwapFeeRate,
    reduceOnly: suggestedParams.reduceOnly,
  }
}

export const getFormattedBankValues = (group: Group, bank: Bank) => {
  return {
    ...bank,
    publicKey: bank.publicKey.toBase58(),
    vault: bank.vault.toBase58(),
    oracle: bank.oracle.toBase58(),
    stablePrice: group.toUiPrice(
      I80F48.fromNumber(bank.stablePriceModel.stablePrice),
      bank.mintDecimals,
    ),
    maxStalenessSlots: bank.oracleConfig.maxStalenessSlots.toNumber(),
    lastStablePriceUpdated: new Date(
      1000 * bank.stablePriceModel.lastUpdateTimestamp.toNumber(),
    ).toUTCString(),
    stablePriceGrowthLimitsDelay: (
      100 * bank.stablePriceModel.delayGrowthLimit
    ).toFixed(2),
    stablePriceGrowthLimitsStable: (
      100 * bank.stablePriceModel.stableGrowthLimit
    ).toFixed(2),
    loanFeeRate: (10000 * bank.loanFeeRate.toNumber()).toFixed(2),
    loanOriginationFeeRate: (
      10000 * bank.loanOriginationFeeRate.toNumber()
    ).toFixed(2),
    collectedFeesNative: toUiDecimals(
      bank.collectedFeesNative.toNumber(),
      bank.mintDecimals,
    ).toFixed(2),
    collectedFeesNativePrice: (
      toUiDecimals(bank.collectedFeesNative.toNumber(), bank.mintDecimals) *
      bank.uiPrice
    ).toFixed(2),
    dust: bank.dust.toNumber(),
    deposits: toUiDecimals(
      bank.indexedDeposits.mul(bank.depositIndex).toNumber(),
      bank.mintDecimals,
    ),
    depositsPrice: (
      toUiDecimals(
        bank.indexedDeposits.mul(bank.depositIndex).toNumber(),
        bank.mintDecimals,
      ) * bank.uiPrice
    ).toFixed(2),
    borrows: toUiDecimals(
      bank.indexedBorrows.mul(bank.borrowIndex).toNumber(),
      bank.mintDecimals,
    ),
    borrowsPrice: (
      toUiDecimals(
        bank.indexedBorrows.mul(bank.borrowIndex).toNumber(),
        bank.mintDecimals,
      ) * bank.uiPrice
    ).toFixed(2),
    avgUtilization: bank.avgUtilization.toNumber() * 100,
    maintAssetWeight: bank.maintAssetWeight.toFixed(2),
    maintLiabWeight: bank.maintLiabWeight.toFixed(2),
    initAssetWeight: bank.initAssetWeight.toFixed(2),
    initLiabWeight: bank.initLiabWeight.toFixed(2),
    scaledInitAssetWeight: bank.scaledInitAssetWeight(bank.price).toFixed(2),
    scaledInitLiabWeight: bank.scaledInitLiabWeight(bank.price).toFixed(2),
    depositWeightScaleStartQuote: toUiDecimalsForQuote(
      bank.depositWeightScaleStartQuote,
    ),
    borrowWeightScaleStartQuote: toUiDecimalsForQuote(
      bank.borrowWeightScaleStartQuote,
    ),
    rate0: (100 * bank.rate0.toNumber()).toFixed(2),
    util0: (100 * bank.util0.toNumber()).toFixed(),
    rate1: (100 * bank.rate1.toNumber()).toFixed(2),
    util1: (100 * bank.util1.toNumber()).toFixed(),
    maxRate: (100 * bank.maxRate.toNumber()).toFixed(2),
    adjustmentFactor: (bank.adjustmentFactor.toNumber() * 100).toFixed(2),
    depositRate: bank.getDepositRateUi(),
    borrowRate: bank.getBorrowRateUi(),
    lastIndexUpdate: new Date(
      1000 * bank.indexLastUpdated.toNumber(),
    ).toUTCString(),
    lastRatesUpdate: new Date(
      1000 * bank.bankRateLastUpdated.toNumber(),
    ).toUTCString(),
    oracleConfFilter: (100 * bank.oracleConfig.confFilter.toNumber()).toFixed(
      2,
    ),
    minVaultToDepositsRatio: bank.minVaultToDepositsRatio * 100,
    netBorrowsInWindow: toUiDecimalsForQuote(
      I80F48.fromI64(bank.netBorrowsInWindow).mul(bank.price),
    ).toFixed(2),
    netBorrowLimitPerWindowQuote: toUiDecimals(
      bank.netBorrowLimitPerWindowQuote,
      6,
    ),
    liquidationFee: (bank.liquidationFee.toNumber() * 100).toFixed(2),
    interestCurveScaling: bank.interestCurveScaling.toString(),
    interestTargetUtilization: bank.interestTargetUtilization.toString(),
    maintWeightShiftStart: bank.maintWeightShiftStart.toNumber(),
    maintWeightShiftEnd: bank.maintWeightShiftEnd.toNumber(),
    maintWeightShiftAssetTarget: bank.maintWeightShiftAssetTarget.toNumber(),
    maintWeightShiftLiabTarget: bank.maintWeightShiftLiabTarget.toNumber(),
    maintWeightShiftDurationInv: bank.maintWeightShiftDurationInv.toNumber(),
    depositLimit: toUiDecimals(bank.depositLimit, bank.mintDecimals),
    stablePriceDelayIntervalSeconds: bank.stablePriceModel.delayIntervalSeconds,
    stablePriceGrowthLimit: bank.stablePriceModel.stableGrowthLimit,
    stablePriceDelayGrowthLimit: bank.stablePriceModel.delayGrowthLimit,
    netBorrowLimitWindowSizeTs: bank.netBorrowLimitWindowSizeTs.toNumber(),
    reduceOnly: bank.reduceOnly,
    groupInsuranceFund: !!group?.mintInfosMapByMint.get(bank.mint.toString())
      ?.groupInsuranceFund,
  }
}

function isWithinLastXHours(timestampInSeconds: number, hoursNumber: number) {
  const now = dayjs()
  const inputDate = dayjs.unix(timestampInSeconds) // Convert seconds to dayjs object

  const differenceInHours = now.diff(inputDate, 'hour')

  return differenceInHours < hoursNumber
}

export type MidPriceImpact = Omit<
  PriceImpact,
  'side' | 'min_price_impact_percent' | 'max_price_impact_percent'
>

export const getPriceImpacts = async () => {
  const resp = await fetch(
    'https://api.mngo.cloud/data/v4/risk/listed-tokens-one-week-price-impacts',
  )
  const jsonReps = (await resp.json()) as PriceImpact[]
  return jsonReps
}
