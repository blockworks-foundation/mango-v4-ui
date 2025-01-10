import {
  Bank,
  toUiDecimals,
  I80F48,
  PriceImpact,
  OracleProvider,
  toUiDecimalsForQuote,
  Group,
} from '@blockworks-foundation/mango-v4'
import ExplorerLink from '@components/shared/ExplorerLink'
import { BorshAccountsCoder } from '@coral-xyz/anchor'
import { coder } from '@project-serum/anchor/dist/cjs/spl/token'
import mangoStore from '@store/mangoStore'
import useMangoGroup from 'hooks/useMangoGroup'
import type { NextPage } from 'next'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import {
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/20/solid'
import { Disclosure } from '@headlessui/react'
import MarketLogos from '@components/trade/MarketLogos'
import Button from '@components/shared/Button'
import BN from 'bn.js'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  getApiTokenName,
  getFormattedBankValues,
} from 'utils/governance/listingTools'
import GovernancePageWrapper from '@components/governance/GovernancePageWrapper'
import TokenLogo from '@components/shared/TokenLogo'
import DashboardSuggestedValues from '@components/modals/DashboardSuggestedValuesModal'
import { USDC_MINT } from 'utils/constants'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import useBanks from 'hooks/useBanks'
import { PythHttpClient } from '@pythnetwork/client'
import { MAINNET_PYTH_PROGRAM } from 'utils/governance/constants'
import { PublicKey } from '@solana/web3.js'
import { notify } from 'utils/notifications'
import {
  LISTING_PRESETS,
  MidPriceImpact,
  getMidPriceImpacts,
  getProposedKey,
} from '@blockworks-foundation/mango-v4-settings/lib/helpers/listingTools'
import Tooltip from '@components/shared/Tooltip'
import SecurityCouncilModal from '@components/modals/SecurityCouncilModal'

dayjs.extend(relativeTime)

type BankWarningObject = {
  depositWeightScaleStartQuote?: string
  borrowWeightScaleStartQuote?: string
  depositLimit?: string
  netBorrowLimitPerWindowQuote?: string
  oracleConfFilter?: string
  oracleLiveliness?: string
}

const getSuggestedAndCurrentTier = (
  bank: Bank,
  midPriceImp: MidPriceImpact[],
) => {
  const epsilon = 1e-8
  let currentTier = Object.values(LISTING_PRESETS).find((x) => {
    if (bank?.name == 'USDC' || bank?.name == 'USDT') return true
    if (bank?.depositWeightScaleStartQuote != 20000000000) {
      if (
        x.depositWeightScaleStartQuote === bank?.depositWeightScaleStartQuote
      ) {
        return true
      }
    } else {
      return (
        Math.abs(
          x.loanOriginationFeeRate - bank?.loanOriginationFeeRate.toNumber(),
        ) < epsilon
      )
    }
  })

  if (currentTier == undefined) {
    currentTier = LISTING_PRESETS['asset_5000']
  }

  const filteredResp = midPriceImp
    .filter((x) => x.avg_price_impact_percent < 1)
    .reduce((acc: { [key: string]: MidPriceImpact }, val: MidPriceImpact) => {
      if (
        !acc[val.symbol] ||
        val.target_amount > acc[val.symbol].target_amount
      ) {
        acc[val.symbol] = val
      }
      return acc
    }, {})
  const priceImpact = filteredResp[getApiTokenName(bank.name)]

  const suggestedTierKey = getProposedKey(priceImpact?.target_amount)

  return {
    suggestedTierKey,
    currentTier,
  }
}

const getPythLink = async (pythOraclePk: PublicKey) => {
  const connection = mangoStore.getState().connection
  const pythClient = new PythHttpClient(connection, MAINNET_PYTH_PROGRAM)
  const pythAccounts = await pythClient.getData()
  const feed = pythAccounts.products.find(
    (x) => x.price_account === pythOraclePk.toBase58(),
  )
  window.open(
    feed
      ? `https://pyth.network/price-feeds/${feed.asset_type.toLowerCase()}-${feed.base.toLowerCase()}-${feed.quote_currency.toLowerCase()}?cluster=solana-mainnet-beta`
      : `https://explorer.solana.com/address/${pythOraclePk.toBase58()}`,
    '_blank',
  )
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'account',
        'close-account',
        'common',
        'notifications',
        'onboarding',
        'profile',
        'search',
        'settings',
        'token',
        'trade',
      ])),
    },
  }
}

const Dashboard: NextPage = () => {
  const { group } = useMangoGroup()
  const { banks } = useBanks()
  const [stickyIndex, setStickyIndex] = useState(-1)

  const midPriceImp = useMemo(() => {
    const priceImpacts: PriceImpact[] = group?.pis || []
    return getMidPriceImpacts(priceImpacts.length ? priceImpacts : [])
  }, [group?.pis])

  const handleScroll = useCallback(() => {
    for (let i = 0; i < banks.length; i++) {
      const element = document.getElementById(`parent-item-${i}`)

      if (element) {
        const rect = element.getBoundingClientRect()

        if (rect.top <= 0) {
          setStickyIndex(i)
        }
      }
    }
  }, [banks])

  useEffect(() => {
    if (banks.length) {
      window.addEventListener('scroll', handleScroll)

      return () => {
        window.removeEventListener('scroll', handleScroll)
      }
    }
  }, [banks])

  useEffect(() => {
    if (banks.length) {
      const banksWithZeroPrice = banks.filter((x) => x.price.isZero())

      if (banksWithZeroPrice?.length) {
        banksWithZeroPrice.map((x) =>
          notify({
            type: 'error',
            description: `${x.name} reported price 0`,
            title: '0 price detected',
          }),
        )
      }
    }
  }, [banks.length])

  const sortByTier = (tier: string | undefined) => {
    const tierOrder: Record<string, number> = {
      S: 0,
      AAA: 1,
      AA: 2,
      A: 3,
      'A-': 4,
      BBB: 5,
      BB: 6,
      B: 7,
      C: 8,
      D: 9,
    }
    if (tier) {
      return tierOrder[tier]
    }
    return Infinity
  }

  return (
    <>
      <DashboardNavbar />
      <GovernancePageWrapper>
        {group ? (
          <div className="mx-4 mt-4 lg:mx-0">
            <ExplorerLink
              address={group?.publicKey.toString()}
              anchorData
            ></ExplorerLink>
            <div className="mt-4 flex space-x-4">
              <Button
                secondary
                size="small"
                onClick={() => {
                  const panels = [
                    ...document.querySelectorAll(
                      '[aria-expanded=false][aria-label=panel]',
                    ),
                  ]
                  panels.map((panel) => (panel as HTMLElement).click())
                }}
              >
                Expand All
              </Button>
              <Button
                secondary
                size="small"
                onClick={() => {
                  const panels = [
                    ...document.querySelectorAll(
                      '[aria-expanded=false][aria-label=panel].has-warning',
                    ),
                  ]
                  panels.map((panel) => (panel as HTMLElement).click())
                }}
              >
                Expand Warnings
              </Button>
              <Button
                secondary
                size="small"
                onClick={() => {
                  const panels = [
                    ...document.querySelectorAll(
                      '[aria-expanded=true][aria-label=panel]',
                    ),
                  ]
                  panels.map((panel) => (panel as HTMLElement).click())
                }}
              >
                Collpase All
              </Button>
            </div>
            <h3 className="mb-3 mt-6 flex text-base text-th-fgd-3">
              <span>Banks</span>
              <span className="ml-auto pr-12 text-sm font-normal">
                Current / <span className="text-th-success">Detected</span>{' '}
              </span>
            </h3>
            <div className="border-b border-th-bkg-3">
              {banks
                .sort((a, b) => {
                  const aIsReduceOnly = a.areDepositsReduceOnly()
                  const bIsReduceOnly = b.areDepositsReduceOnly()
                  if (aIsReduceOnly && !bIsReduceOnly) {
                    return 1
                  } else if (!aIsReduceOnly && bIsReduceOnly) {
                    return -1
                  } else {
                    return sortByTier(a.tier) - sortByTier(b.tier)
                  }
                })
                .map((bank, i) => {
                  return (
                    <BankDisclosure
                      bank={bank}
                      key={bank.name}
                      index={i}
                      midPriceImp={midPriceImp}
                      isSticky={i === stickyIndex}
                    />
                  )
                })}
            </div>

            <h3 className="mb-3 mt-6 text-base text-th-fgd-3">Perp Markets</h3>
            <div className="border-b border-th-bkg-3">
              {Array.from(group.perpMarketsMapByOracle)
                .filter(([_, perpMarket]) => !perpMarket.name.includes('OLD'))
                .map(([oracle, perpMarket]) => {
                  return (
                    <Disclosure key={oracle.toString()}>
                      {({ open }) => (
                        <>
                          <Disclosure.Button
                            aria-label="panel"
                            className={`flex w-full items-center justify-between border-t border-th-bkg-3 p-4 md:hover:bg-th-bkg-2 ${
                              open ? 'bg-th-bkg-2' : ''
                            }`}
                          >
                            <div className="flex items-center">
                              <MarketLogos market={perpMarket} />
                              <p className="text-th-fgd-2">{perpMarket.name}</p>
                            </div>
                            <ChevronDownIcon
                              className={`${
                                open ? 'rotate-180' : 'rotate-0'
                              } h-5 w-5 text-th-fgd-3`}
                            />
                          </Disclosure.Button>
                          <Disclosure.Panel>
                            <KeyValuePair
                              label="Perp Market"
                              value={
                                <ExplorerLink
                                  address={perpMarket.publicKey.toString()}
                                  anchorData
                                />
                              }
                            />
                            <KeyValuePair
                              label="Bids"
                              value={
                                <ExplorerLink
                                  address={perpMarket.bids.toString()}
                                  anchorData
                                />
                              }
                            />
                            <KeyValuePair
                              label="Asks"
                              value={
                                <ExplorerLink
                                  address={perpMarket.asks.toString()}
                                  anchorData
                                />
                              }
                            />
                            <KeyValuePair
                              label="Event Queue"
                              value={
                                <ExplorerLink
                                  address={perpMarket.eventQueue.toString()}
                                  anchorData
                                />
                              }
                            />
                            <KeyValuePair
                              label="Oracle"
                              value={
                                <ExplorerLink
                                  address={perpMarket.oracle.toString()}
                                />
                              }
                            />
                            <KeyValuePair
                              label="Perp Market Index"
                              value={perpMarket.perpMarketIndex}
                            />
                            <KeyValuePair
                              label="Base Decimals"
                              value={perpMarket.baseDecimals}
                            />
                            <KeyValuePair
                              label="Reduce Only"
                              value={perpMarket.reduceOnly ? 'True' : 'False'}
                            />
                            <KeyValuePair
                              label="Oracle Price"
                              value={`$${perpMarket.uiPrice}`}
                            />
                            <KeyValuePair
                              label="Stable Price"
                              value={`$${Group.toUiPrice(
                                group,
                                I80F48.fromNumber(
                                  perpMarket.stablePriceModel.stablePrice,
                                ),
                                perpMarket.baseDecimals,
                              )}`}
                            />
                            <KeyValuePair
                              label="Last stable price updated"
                              value={new Date(
                                1000 *
                                  perpMarket.stablePriceModel.lastUpdateTimestamp.toNumber(),
                              ).toUTCString()}
                            />
                            <KeyValuePair
                              label="Stable Price: delay interval"
                              value={`${perpMarket.stablePriceModel.delayIntervalSeconds}s`}
                            />
                            <KeyValuePair
                              label="Stable Price: growth limits"
                              value={`${(
                                100 *
                                perpMarket.stablePriceModel.delayGrowthLimit
                              ).toFixed(2)}% delay / ${(
                                100 *
                                perpMarket.stablePriceModel.stableGrowthLimit
                              ).toFixed(2)}% stable`}
                            />
                            <KeyValuePair
                              label="Open Interest"
                              value={`${perpMarket.openInterest} lots ($${(
                                perpMarket.baseLotsToUi(
                                  perpMarket.openInterest,
                                ) * perpMarket.uiPrice
                              ).toFixed(2)})`}
                            />
                            <KeyValuePair
                              label="Lot Sizes"
                              value={`${perpMarket.baseLotSize} base /
                          ${
                            perpMarket.quoteLotSize
                          } quote (tick size: $${perpMarket.priceLotsToUi(
                            new BN(1),
                          )}, 1 base lot: $${(
                            perpMarket.baseLotsToUi(new BN(1)) *
                            perpMarket.uiPrice
                          ).toFixed(3)})`}
                            />
                            <KeyValuePair
                              label="Maint Asset/Liab Weight"
                              value={`${perpMarket.maintBaseAssetWeight.toFixed(
                                4,
                              )}/
                          ${perpMarket.maintBaseLiabWeight.toFixed(
                            4,
                          )} (maint leverage: ${(
                            1 /
                            (perpMarket.maintBaseLiabWeight.toNumber() - 1)
                          ).toFixed(2)}x, init leverage: ${(
                            1 /
                            (perpMarket.initBaseLiabWeight.toNumber() - 1)
                          ).toFixed(2)}x)`}
                            />
                            <KeyValuePair
                              label="Init Asset/Liab Weight"
                              value={`${perpMarket.initBaseAssetWeight.toFixed(
                                4,
                              )}/
                          ${perpMarket.initBaseLiabWeight.toFixed(4)}`}
                            />
                            <KeyValuePair
                              label="Base liquidation fee"
                              value={`${(
                                10000 * perpMarket.baseLiquidationFee.toNumber()
                              ).toFixed(2)} bps`}
                            />
                            <KeyValuePair
                              label="Trading Fees"
                              value={`${(
                                10000 * perpMarket.makerFee.toNumber()
                              ).toFixed(2)} bps maker / ${(
                                10000 * perpMarket.takerFee.toNumber()
                              ).toFixed(2)} bps taker`}
                            />
                            <KeyValuePair
                              label="Funding Limits"
                              value={`${(
                                100 * perpMarket.minFunding.toNumber()
                              ).toFixed(2)}% to ${(
                                100 * perpMarket.maxFunding.toNumber()
                              ).toFixed(2)}%`}
                            />
                            <KeyValuePair
                              label="Funding impacty quantity"
                              value={`${perpMarket.impactQuantity.toNumber()} ($${(
                                perpMarket.baseLotsToUi(
                                  perpMarket.impactQuantity,
                                ) * perpMarket.uiPrice
                              ).toFixed(2)})`}
                            />
                            <KeyValuePair
                              label="Fees Accrued"
                              value={`$${toUiDecimals(
                                perpMarket.feesAccrued,
                                6,
                              ).toFixed(2)}`}
                            />
                            <KeyValuePair
                              label="Fees Settled"
                              value={`$${toUiDecimals(
                                perpMarket.feesSettled,
                                6,
                              )}`}
                            />
                            <KeyValuePair
                              label="Oracle: Conf Filter"
                              value={`${(
                                100 *
                                perpMarket.oracleConfig.confFilter.toNumber()
                              ).toFixed(2)}%`}
                            />
                            <KeyValuePair
                              label="Oracle: Max Staleness"
                              value={`${perpMarket.oracleConfig.maxStalenessSlots} slots`}
                            />
                            <KeyValuePair
                              label="Group Insurance Fund"
                              value={`${perpMarket.groupInsuranceFund}`}
                            />
                            <KeyValuePair
                              label="Fee penalty"
                              value={`$${toUiDecimals(
                                perpMarket.feePenalty,
                                6,
                              )}`}
                            />
                            <KeyValuePair
                              label="Settle fee flat"
                              value={`$${toUiDecimals(
                                perpMarket.settleFeeFlat,
                                6,
                              )}`}
                            />
                            <KeyValuePair
                              label="Settle fee amount threshold"
                              value={`$${toUiDecimals(
                                perpMarket.settleFeeAmountThreshold,
                                6,
                              )}`}
                            />
                            <KeyValuePair
                              label="Settle fee fraction low health"
                              value={`${perpMarket.settleFeeFractionLowHealth.toFixed(
                                4,
                              )}`}
                            />
                            <KeyValuePair
                              label="Settle pnl limit factor"
                              value={`${perpMarket.settlePnlLimitFactor}`}
                            />
                            <KeyValuePair
                              label="Settle pnl limit window size"
                              value={`${perpMarket.settlePnlLimitWindowSizeTs.toNumber()} secs`}
                            />
                            <KeyValuePair
                              label="Maint overall asset weight"
                              value={`${perpMarket.maintOverallAssetWeight.toNumber()}`}
                            />
                            <KeyValuePair
                              label="Init overall asset weight"
                              value={`${perpMarket.initOverallAssetWeight.toNumber()}`}
                            />
                            <KeyValuePair
                              label="Positive pnl liquidation fee"
                              value={`${(
                                10000 *
                                perpMarket.positivePnlLiquidationFee.toNumber()
                              ).toFixed(
                                2,
                              )} bps (${perpMarket.positivePnlLiquidationFee
                                .div(perpMarket.baseLiquidationFee)
                                .toNumber()
                                .toFixed(2)}x of Base liquidation fee)`}
                            />
                          </Disclosure.Panel>
                        </>
                      )}
                    </Disclosure>
                  )
                })}
            </div>
            <h3 className="mb-3 mt-6 text-base text-th-fgd-3">Spot Markets</h3>
            <div className="border-b border-th-bkg-3">
              {Array.from(group.serum3MarketsMapByExternal.values()).map(
                (market) => {
                  const externalMarket = group.getSerum3ExternalMarket(
                    market.serumMarketExternal,
                  )
                  return (
                    <Disclosure key={market.marketIndex}>
                      {({ open }) => (
                        <>
                          <Disclosure.Button
                            aria-label="panel"
                            className={`flex w-full items-center justify-between border-t border-th-bkg-3 p-4 md:hover:bg-th-bkg-2 ${
                              open ? 'bg-th-bkg-2' : ''
                            }`}
                          >
                            <div className="flex items-center">
                              <MarketLogos market={market} />
                              <p className="text-th-fgd-2">{market.name}</p>
                            </div>
                            <ChevronDownIcon
                              className={`${
                                open ? 'rotate-180' : 'rotate-0'
                              } h-5 w-5 text-th-fgd-3`}
                            />
                          </Disclosure.Button>
                          <Disclosure.Panel>
                            <KeyValuePair
                              label="Public Key"
                              value={
                                <ExplorerLink
                                  address={market.publicKey.toString()}
                                  anchorData
                                />
                              }
                            />
                            <KeyValuePair
                              label="Serum Market External Public Key"
                              value={
                                <ExplorerLink
                                  address={market.serumMarketExternal.toString()}
                                />
                              }
                            />
                            <KeyValuePair
                              label="Base Mint"
                              value={
                                <ExplorerLink
                                  address={externalMarket.baseMintAddress.toString()}
                                />
                              }
                            />
                            <KeyValuePair
                              label="Quote Mint"
                              value={
                                <ExplorerLink
                                  address={externalMarket.quoteMintAddress.toString()}
                                />
                              }
                            />
                            <KeyValuePair
                              label="Token Index"
                              value={market.marketIndex}
                            />
                            <KeyValuePair
                              label="Base Token Index"
                              value={market.baseTokenIndex}
                            />
                            <KeyValuePair
                              label="Quote Token Index"
                              value={market.quoteTokenIndex}
                            />
                            <KeyValuePair
                              label="Min Order Size"
                              value={externalMarket.minOrderSize}
                            />
                            <KeyValuePair
                              label="Price Band"
                              value={market.oraclePriceBand}
                            />
                            <KeyValuePair
                              label="Tick Size"
                              value={externalMarket.tickSize}
                            />
                            <KeyValuePair
                              label="Max Bid Leverage"
                              value={`${market
                                .maxBidLeverage(group)
                                .toFixed(1)}x`}
                            />
                            <KeyValuePair
                              label="Max Ask Leverage"
                              value={`${market
                                .maxAskLeverage(group)
                                .toFixed(1)}x`}
                            />
                            <KeyValuePair
                              label="Reduce Only"
                              value={market.reduceOnly ? 'True' : 'False'}
                            />
                            <KeyValuePair
                              label="Force Close"
                              value={market.forceClose ? 'True' : 'False'}
                            />
                            <KeyValuePair
                              label="Maker/Taker Fees"
                              value={`${market.getFeeRates(
                                false,
                              )}/${market.getFeeRates(true)}`}
                            />
                          </Disclosure.Panel>
                        </>
                      )}
                    </Disclosure>
                  )
                },
              )}
            </div>
          </div>
        ) : (
          'Loading'
        )}
      </GovernancePageWrapper>
    </>
  )
}

const BankDisclosure = ({
  bank,
  index,
  midPriceImp,
  isSticky,
}: {
  bank: Bank
  index: number
  midPriceImp: MidPriceImpact[]
  isSticky: boolean
}) => {
  const { group } = useMangoGroup()
  const [isStale, setIsStale] = useState(false)
  const [openedSuggestedModal, setOpenedSuggestedModal] = useState<
    string | null
  >(null)
  const [securityModalOpen, setSecurityModalOpen] = useState<string | null>(
    null,
  )

  const { currentTier, suggestedTierKey } = getSuggestedAndCurrentTier(
    bank,
    midPriceImp,
  )

  const warnings = useMemo(() => {
    const warnings: BankWarningObject = {}

    if (bank.areDepositsReduceOnly()) return
    const deposits = toUiDecimals(
      bank.indexedDeposits.mul(bank.depositIndex).toNumber(),
      bank.mintDecimals,
    )

    const depositLimit = toUiDecimals(bank.depositLimit, bank.mintDecimals)

    const depositsValue = deposits * bank.uiPrice
    if (depositsValue < 10) return

    const depositsScaleStart = toUiDecimalsForQuote(
      bank.depositWeightScaleStartQuote,
    )

    const netBorrowsInWindow = toUiDecimalsForQuote(
      I80F48.fromI64(bank.netBorrowsInWindow).mul(bank.price),
    )

    const netBorrowLimitPerWindowQuote = toUiDecimals(
      bank.netBorrowLimitPerWindowQuote,
      6,
    )

    const borrowsValue =
      toUiDecimals(
        bank.indexedBorrows.mul(bank.borrowIndex).toNumber(),
        bank.mintDecimals,
      ) * bank.uiPrice

    const borrowsScaleStart = toUiDecimalsForQuote(
      bank.borrowWeightScaleStartQuote,
    )

    const oracleConfFilter = 100 * bank.oracleConfig.confFilter.toNumber()
    const lastKnownConfidence =
      bank._oracleLastKnownDeviation instanceof I80F48 &&
      !bank._oracleLastKnownDeviation.isZero()
        ? bank._oracleLastKnownDeviation
            ?.div(bank.price)
            .mul(I80F48.fromNumber(100))
            .toNumber()
        : 0

    if (depositsValue > depositsScaleStart) {
      warnings.depositWeightScaleStartQuote =
        'Deposits value exceeds scaling start quote'
    }
    if (borrowsValue > borrowsScaleStart) {
      warnings.borrowWeightScaleStartQuote =
        'Borrows value exceeds scaling start quote'
    }
    if (depositLimit && deposits >= depositLimit) {
      warnings.depositLimit = 'Deposits are at capacity'
    }
    if (netBorrowsInWindow >= netBorrowLimitPerWindowQuote) {
      warnings.netBorrowLimitPerWindowQuote =
        'Net borrows in current window are at capacity'
    }
    if (lastKnownConfidence && lastKnownConfidence > oracleConfFilter) {
      warnings.oracleConfFilter = `Oracle confidence is outside the limit. Current: ${lastKnownConfidence.toFixed(
        2,
      )}% limit: ${oracleConfFilter.toFixed(2)}%`
    }
    if (isStale) {
      warnings.oracleLiveliness = 'Oracle is stale'
    }
    return warnings
  }, [bank, isStale])

  useEffect(() => {
    const client = mangoStore.getState().client
    const connection = mangoStore.getState().connection
    const group = mangoStore.getState().group
    if (!group) return

    const coder = new BorshAccountsCoder(client.program.idl)
    const decimals = group.getMintDecimals(bank.mint)
    const subId = connection.onAccountChange(
      bank.oracle,
      async (info, context) => {
        const { lastUpdatedSlot } = await Group.decodePriceFromOracleAi(
          group,
          coder,
          bank.oracle,
          info,
          decimals,
          client,
        )

        const oracleWriteSlot = context.slot
        const accountSlot = mangoStore.getState().mangoAccount.lastSlot
        const highestSlot = Math.max(oracleWriteSlot, accountSlot)
        const maxStalenessSlots = bank.oracleConfig.maxStalenessSlots.toNumber()
        setIsStale(
          maxStalenessSlots > 0 &&
            highestSlot - lastUpdatedSlot > maxStalenessSlots,
        )
      },
      'processed',
    )
    return () => {
      if (typeof subId !== 'undefined') {
        connection.removeAccountChangeListener(subId)
      }
    }
  }, [bank])

  const depositLimitWarning = warnings?.depositLimit ?? null

  const depositWeightScaleStartQuoteWarning =
    warnings?.depositWeightScaleStartQuote ?? null

  const depositWarnings = [
    depositLimitWarning,
    depositWeightScaleStartQuoteWarning,
  ].filter(Boolean)

  const borrowWeightScaleStartQuoteWarning =
    warnings?.borrowWeightScaleStartQuote ?? null

  const netBorrowLimitPerWindowQuoteWarning =
    warnings?.netBorrowLimitPerWindowQuote ?? null

  const borrowWarnings = [
    borrowWeightScaleStartQuoteWarning,
    netBorrowLimitPerWindowQuoteWarning,
  ].filter(Boolean)

  const oracleConfFilterWarning = warnings?.oracleConfFilter ?? null
  const oracleLivelinessWarning = warnings?.oracleLiveliness ?? null

  const oracleWarnings = [
    oracleConfFilterWarning,
    oracleLivelinessWarning,
  ].filter(Boolean)

  const showWarningTooltip = warnings && Object.keys(warnings).length

  if (!group) return null
  const mintInfo = group.mintInfosMapByMint.get(bank.mint.toString())

  const formattedBankValues = getFormattedBankValues(group, bank)
  return (
    <Disclosure key={bank.publicKey.toString()}>
      {({ open }) => (
        <>
          <div
            className={`default-transition w-full border-t border-th-bkg-3 md:hover:bg-th-bkg-2 ${
              open
                ? isSticky
                  ? 'sticky top-0 bg-th-bkg-3'
                  : 'bg-th-bkg-3'
                : ''
            }`}
            id={`parent-item-${index}`}
          >
            <Disclosure.Button
              className={`flex w-full items-center justify-between p-4 ${
                showWarningTooltip ? 'has-warning' : ''
              }`}
              aria-label="panel"
            >
              <div className="flex items-center">
                <TokenLogo bank={bank} />
                <Tooltip
                  content={
                    showWarningTooltip ? (
                      <div className="space-y-1.5">
                        {Object.values(warnings).map((value, i) => (
                          <p key={value}>
                            {i + 1}. {value}
                          </p>
                        ))}
                      </div>
                    ) : (
                      ''
                    )
                  }
                >
                  <div className="flex items-center">
                    <p
                      className={`ml-2 ${
                        showWarningTooltip
                          ? `tooltip-underline ${
                              oracleWarnings.length
                                ? 'text-th-error'
                                : 'text-th-warning'
                            }`
                          : 'text-th-fgd-2'
                      }`}
                    >
                      {formattedBankValues.name} Bank
                    </p>
                    {showWarningTooltip ? (
                      <ExclamationTriangleIcon
                        className={`ml-2 h-4 w-4 cursor-help ${
                          oracleWarnings.length
                            ? 'text-th-error'
                            : 'text-th-warning'
                        }`}
                      />
                    ) : null}
                  </div>
                </Tooltip>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex space-x-2">
                  <div>{formattedBankValues.tier}</div>
                  <div>/</div>
                  <div className="text-th-success">
                    {currentTier?.preset_name}
                  </div>
                </div>
                <ChevronDownIcon
                  className={`${
                    open ? 'rotate-180' : 'rotate-0'
                  } h-5 w-5 text-th-fgd-3`}
                />
              </div>
            </Disclosure.Button>
          </div>
          <Disclosure.Panel>
            {bank.mint.toBase58() !== USDC_MINT ? (
              <div className="my-3 flex">
                <Button
                  className="ml-auto"
                  onClick={() => setOpenedSuggestedModal(bank.mint.toBase58())}
                  size="small"
                >
                  Check suggested values
                  {openedSuggestedModal === bank.mint.toBase58() && (
                    <DashboardSuggestedValues
                      midPriceImp={midPriceImp}
                      currentTier={currentTier}
                      suggestedTierKey={suggestedTierKey}
                      group={group}
                      bank={bank}
                      isOpen={openedSuggestedModal === bank.mint.toBase58()}
                      onClose={() => setOpenedSuggestedModal(null)}
                    ></DashboardSuggestedValues>
                  )}
                </Button>
              </div>
            ) : null}

            <div className="my-3 flex">
              <Button
                className="ml-auto"
                onClick={() => setSecurityModalOpen(bank.mint.toBase58())}
                size="small"
              >
                Security council
                {securityModalOpen === bank.mint.toBase58() && (
                  <SecurityCouncilModal
                    group={group}
                    bank={bank}
                    isOpen={securityModalOpen === bank.mint.toBase58()}
                    onClose={() => setSecurityModalOpen(null)}
                  ></SecurityCouncilModal>
                )}
              </Button>
            </div>

            <KeyValuePair
              label="Mint"
              value={<ExplorerLink address={bank.mint.toString()} />}
            />
            <KeyValuePair
              label="Bank"
              value={
                <ExplorerLink
                  address={formattedBankValues.publicKey.toString()}
                  anchorData
                />
              }
            />
            <KeyValuePair
              label="MintInfo"
              value={
                <ExplorerLink
                  address={mintInfo!.publicKey.toString()}
                  anchorData
                />
              }
            />
            <KeyValuePair
              label="Vault"
              value={
                <ExplorerLink address={formattedBankValues.vault} anchorData />
              }
            />
            <KeyValuePair
              label="Oracle"
              value={
                bank.oracleProvider == OracleProvider.Switchboard ? (
                  <a
                    href={`https://app.switchboard.xyz/solana/mainnet/feed/${bank.oracle.toString()}`}
                    className={`flex items-center break-all text-th-fgd-2 hover:text-th-fgd-3`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {bank.oracle.toString()}
                    <ArrowTopRightOnSquareIcon className="ml-2 h-5 w-5 whitespace-nowrap" />
                  </a>
                ) : (
                  <a
                    onClick={() => getPythLink(bank.oracle)}
                    className={`flex cursor-pointer items-center break-all text-th-fgd-2 hover:text-th-fgd-3`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {bank.oracle.toString()}
                    <ArrowTopRightOnSquareIcon className="ml-2 h-5 w-5 whitespace-nowrap" />
                  </a>
                )
              }
            />
            <KeyValuePair
              label="Fallback Oracle"
              value={
                <ExplorerLink
                  address={formattedBankValues.fallbackOracle.toBase58()}
                  anchorData
                />
              }
            />
            <KeyValuePair
              label="Token Index"
              value={formattedBankValues.tokenIndex}
            />
            <KeyValuePair
              label="Mint Decimals"
              value={formattedBankValues.mintDecimals}
            />
            <KeyValuePair label="Oracle Price" value={`$${bank.uiPrice}`} />
            <KeyValuePair
              label="Stable Price"
              value={`$${formattedBankValues.stablePrice}`}
            />
            <KeyValuePair
              label="Last stable price updated"
              value={formattedBankValues.lastStablePriceUpdated}
            />
            <KeyValuePair
              label="Stable Price: delay interval"
              value={`${formattedBankValues.stablePriceModel.delayIntervalSeconds}s`}
            />
            <KeyValuePair
              label="Stable Price: growth limits"
              value={`${formattedBankValues.stablePriceGrowthLimitsDelay}% delay / ${formattedBankValues.stablePriceGrowthLimitsStable}% stable`}
            />
            <VaultData bank={bank} />
            <KeyValuePair
              label="Loan Fee Rate"
              value={`${formattedBankValues.loanFeeRate} bps`}
            />
            <KeyValuePair
              label="Loan origination fee rate"
              value={`${formattedBankValues.loanOriginationFeeRate} bps`}
            />
            <KeyValuePair
              label="Collateral fee per year"
              value={`${formattedBankValues.collateralFeePerYear} %`}
            />
            <KeyValuePair
              label="Collected fees"
              value={`${formattedBankValues.collectedFeesNative} ($${formattedBankValues.collectedFeesNativePrice})`}
            />
            <KeyValuePair
              label="Collected collateral fees"
              value={`${formattedBankValues.collectedCollateralFeesNative} ($${formattedBankValues.collectedCollateralFeesNativePrice})`}
            />
            <KeyValuePair label="Dust" value={formattedBankValues.dust} />
            <KeyValuePair
              label="Reduce Only"
              value={`${
                bank.reduceOnly
              } (Are deposits reduce only - ${bank.areDepositsReduceOnly()}, Are borrows reduce only - ${bank.areBorrowsReduceOnly()})`}
            />
            <KeyValuePair
              label="Avg Utilization"
              value={`${formattedBankValues.avgUtilization}%`}
            />
            <KeyValuePair
              label="Maint Asset/Liab Weight"
              value={`${formattedBankValues.maintAssetWeight} /
                              ${formattedBankValues.maintLiabWeight}`}
            />
            <KeyValuePair
              label="Init Asset/Liab Weight"
              value={`${formattedBankValues.initAssetWeight} /
                              ${formattedBankValues.initLiabWeight}`}
            />
            <KeyValuePair
              label="Liquidation fee"
              value={`${formattedBankValues.liquidationFee}%`}
            />
            <KeyValuePair
              label="Platform liquidation fee"
              value={`${formattedBankValues.platformLiquidationFee}%`}
            />
            <KeyValuePair
              label="Collected liquidation fees"
              value={`${toUiDecimals(
                bank.collectedLiquidationFees,
                formattedBankValues.mintDecimals,
              )}% ($${formattedBankValues.collectedFeesNativePrice})`}
            />
            <KeyValuePair
              label="Scaled Init Asset/Liab Weight"
              value={`${formattedBankValues.scaledInitAssetWeight} / ${formattedBankValues.scaledInitLiabWeight}`}
            />
            <KeyValuePair
              label="Deposits"
              value={`${formattedBankValues.deposits} ($${formattedBankValues.depositsPrice})`}
              warnings={depositWarnings}
            />
            <KeyValuePair
              label="Borrows"
              value={`${formattedBankValues.borrows} ($${formattedBankValues.borrowsPrice})`}
              warnings={borrowWarnings}
            />
            <KeyValuePair
              label="Deposit weight scale start quote"
              value={`$${formattedBankValues.depositWeightScaleStartQuote}`}
            />
            <KeyValuePair
              label="Borrow weight scale start quote"
              value={`$${formattedBankValues.borrowWeightScaleStartQuote}`}
            />
            <KeyValuePair
              label={`Net borrows in window (next window starts ${dayjs().to(
                dayjs().add(
                  bank.getTimeToNextBorrowLimitWindowStartsTs(),
                  'second',
                ),
              )})`}
              value={`$${formattedBankValues.netBorrowsInWindow} / $${formattedBankValues.netBorrowLimitPerWindowQuote}`}
            />
            <KeyValuePair
              label="Group Insurance Fund"
              value={`${mintInfo!.groupInsuranceFund}`}
            />
            <KeyValuePair
              label="Min vault to deposits ratio"
              value={`${formattedBankValues.minVaultToDepositsRatio}%`}
            />
            <KeyValuePair
              label="Rate params"
              value={
                <span className="text-right">
                  {`${formattedBankValues.rate0}% @ ${formattedBankValues.util0}% util, `}
                  {`${formattedBankValues.rate1}% @ ${formattedBankValues.util1}% util, `}
                  {`${formattedBankValues.maxRate}% @ 100% util`}
                </span>
              }
            />
            <KeyValuePair
              label="Adjustment factor"
              value={`${formattedBankValues.adjustmentFactor}%`}
            />
            <KeyValuePair
              label="Deposit rate"
              value={`${formattedBankValues.depositRate}%`}
            />
            <KeyValuePair
              label="Borrow rate"
              value={`${formattedBankValues.borrowRate}%`}
            />
            <KeyValuePair
              label="Last index update"
              value={formattedBankValues.lastIndexUpdate}
            />
            <KeyValuePair
              label="Last rates updated"
              value={formattedBankValues.lastRatesUpdate}
            />
            <KeyValuePair
              label="Oracle: Conf Filter"
              value={`${
                formattedBankValues.oracleConfFilter
              }% (Last known confidence ${
                bank._oracleLastKnownDeviation instanceof I80F48 &&
                !bank._oracleLastKnownDeviation.isZero()
                  ? bank._oracleLastKnownDeviation
                      ?.div(bank.price)
                      .mul(I80F48.fromNumber(100))
                      .toNumber()
                      .toFixed(2)
                  : 'null'
              }%)`}
              warnings={[oracleConfFilterWarning].filter(Boolean)}
            />
            <KeyValuePair
              label="Oracle: Max Staleness"
              value={`${bank.oracleConfig.maxStalenessSlots} slots (Last updated slot ${bank._oracleLastUpdatedSlot})`}
              warnings={[oracleLivelinessWarning].filter(Boolean)}
            />
            <KeyValuePair
              label="Deposit limit"
              value={
                formattedBankValues.depositLimit
                  ? `${formattedBankValues.depositLimit} ${bank.name} ($${(
                      formattedBankValues.depositLimit * bank.uiPrice
                    ).toFixed(2)})`
                  : 'None'
              }
            />
            <KeyValuePair
              label="Interest Curve Scaling"
              value={formattedBankValues.interestCurveScaling}
            />
            <KeyValuePair
              label="Allow Asset Liquidation"
              value={formattedBankValues.allowAssetLiquidation.toString()}
            />
            <KeyValuePair
              label="Interest Target Utilization"
              value={formattedBankValues.interestTargetUtilization}
            />
            <KeyValuePair
              label="Maint Weight Shift Start"
              value={formattedBankValues.maintWeightShiftStart}
            />
            <KeyValuePair
              label="Maint Weight Shift End"
              value={formattedBankValues.maintWeightShiftEnd}
            />
            <KeyValuePair
              label="Maint Weight Shift Asset Target"
              value={formattedBankValues.maintWeightShiftAssetTarget}
            />
            <KeyValuePair
              label="Maint Weight Shift Liab Target"
              value={formattedBankValues.maintWeightShiftLiabTarget}
            />
            <KeyValuePair
              label="Maint Weight Shift Duration Inv"
              value={formattedBankValues.maintWeightShiftDurationInv}
            />
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  )
}

const KeyValuePair = ({
  label,
  value,
  warnings,
}: {
  label: string
  value: number | ReactNode | string
  warnings?: (string | null)[]
}) => {
  const isOracleWarning = warnings?.length
    ? warnings.some((str) => str && str.toLowerCase().includes('oracle'))
    : false
  return (
    <div className="flex items-center justify-between border-t border-th-bkg-2 px-6 py-3 md:hover:bg-th-bkg-2">
      <Tooltip
        content={
          warnings?.length ? (
            <div className="space-y-1.5">
              {warnings.map((value, index) => (
                <p key={value}>
                  {index + 1}. {value}
                </p>
              ))}
            </div>
          ) : (
            ''
          )
        }
      >
        <div className="flex items-center">
          <span
            className={`mr-4 flex flex-col whitespace-nowrap ${
              warnings?.length
                ? `tooltip-underline ${
                    isOracleWarning ? 'text-th-error' : 'text-th-warning'
                  }`
                : 'text-th-fgd-3'
            }`}
          >
            {label}
          </span>
          {warnings?.length ? (
            <ExclamationTriangleIcon
              className={`h-4 w-4 cursor-help ${
                isOracleWarning ? 'text-th-error' : 'text-th-warning'
              }`}
            />
          ) : null}
        </div>
      </Tooltip>
      <span className="flex flex-col font-mono text-th-fgd-2">
        <div>
          <span>{value}</span>
        </div>
      </span>
    </div>
  )
}

type Vault = {
  amount: BN
}

const VaultData = ({ bank }: { bank: Bank }) => {
  const [vault, setVault] = useState<Vault>()
  const client = mangoStore((s) => s.client)

  const getVaultData = useCallback(async () => {
    const res = await client.program.provider.connection.getAccountInfo(
      bank.vault,
    )
    const v = res?.data ? coder().accounts.decode('token', res.data) : undefined

    setVault(v)
  }, [bank.vault])

  useEffect(() => {
    getVaultData()
  }, [getVaultData])

  return (
    <KeyValuePair
      label="Vault balance"
      value={
        vault
          ? toUiDecimals(new BN(vault.amount.toString()), bank.mintDecimals)
          : '...'
      }
    />
  )
}

export const DashboardNavbar = () => {
  const { asPath } = useRouter()

  return (
    <div className="mb-2 flex border-b border-th-bkg-3">
      <div>
        <Link href={'/dashboard'} shallow={true}>
          <h4
            className={`${
              asPath === '/dashboard' ? 'bg-th-bkg-2 text-th-active' : ''
            } cursor-pointer border-r border-th-bkg-3 px-6 py-4`}
          >
            Groups
          </h4>
        </Link>
      </div>
      <div>
        <Link href={'/dashboard/risks'} shallow={true}>
          <h4
            className={`${
              asPath === '/dashboard/risks' ? 'bg-th-bkg-2 text-th-active' : ''
            } cursor-pointer border-r border-th-bkg-3 px-6 py-4`}
          >
            Risks
          </h4>
        </Link>
      </div>
      <div>
        <Link href={'/dashboard/slippage'} shallow={true}>
          <h4
            className={`${
              asPath.includes('/dashboard/slippage')
                ? 'bg-th-bkg-2 text-th-active'
                : ''
            } cursor-pointer border-r border-th-bkg-3 px-6 py-4`}
          >
            Slippage
          </h4>
        </Link>
      </div>
      <div>
        <Link href={'/dashboard/prospective'} shallow={true}>
          <h4
            className={`${
              asPath.includes('/dashboard/prospective')
                ? 'bg-th-bkg-2 text-th-active'
                : ''
            } cursor-pointer border-r border-th-bkg-3 px-6 py-4`}
          >
            Prospective
          </h4>
        </Link>
      </div>
      <div>
        <Link href={'/dashboard/marketing'} shallow={true}>
          <h4
            className={`${
              asPath.includes('/dashboard/marketing')
                ? 'bg-th-bkg-2 text-th-active'
                : ''
            } cursor-pointer border-r border-th-bkg-3 px-6 py-4`}
          >
            Marketing
          </h4>
        </Link>
      </div>
      <div>
        <Link
          href={
            '/dashboard/mangoaccount?address=DNjtajTW6PZps3gCerWEPBRvu1vZPEieVEoqXFrXWn3k'
          }
          shallow={true}
        >
          <h4
            className={`${
              asPath.includes('/dashboard/mangoaccount')
                ? 'bg-th-bkg-2 text-th-active'
                : ''
            } cursor-pointer border-r border-th-bkg-3 px-6 py-4`}
          >
            Mango Account
          </h4>
        </Link>
      </div>
    </div>
  )
}

export default Dashboard
