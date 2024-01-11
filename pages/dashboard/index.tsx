import {
  Bank,
  toUiDecimals,
  I80F48,
  PriceImpact,
  OracleProvider,
} from '@blockworks-foundation/mango-v4'
import ExplorerLink from '@components/shared/ExplorerLink'
import { coder } from '@project-serum/anchor/dist/cjs/spl/token'
import mangoStore from '@store/mangoStore'
import useMangoGroup from 'hooks/useMangoGroup'
import type { NextPage } from 'next'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import {
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
} from '@heroicons/react/20/solid'
import { Disclosure } from '@headlessui/react'
import MarketLogos from '@components/trade/MarketLogos'
import Button from '@components/shared/Button'
import BN from 'bn.js'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  getFormattedBankValues,
  getPriceImpacts,
} from 'utils/governance/listingTools'
import GovernancePageWrapper from '@components/governance/GovernancePageWrapper'
import TokenLogo from '@components/shared/TokenLogo'
import DashboardSuggestedValues from '@components/modals/DashboardSuggestedValuesModal'
import { USDC_MINT } from 'utils/constants'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import useBanks from 'hooks/useBanks'

dayjs.extend(relativeTime)

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
  const connection = mangoStore((s) => s.connection)
  const { banks } = useBanks()
  const [isOpenSuggestionModal, setIsOpenSuggestionModal] = useState(false)
  const [priceImpacts, setPriceImapcts] = useState<PriceImpact[]>([])
  const [stickyIndex, setStickyIndex] = useState(-1)

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
    const handleGetPriceImapcts = async () => {
      const [resp] = await Promise.all([getPriceImpacts()])
      setPriceImapcts(resp)
    }
    if (group) {
      handleGetPriceImapcts()
    }
  }, [connection, group])

  return (
    <GovernancePageWrapper noStyles={true}>
      <div className="grid grid-cols-12">
        <div className="col-span-12 lg:col-span-8 lg:col-start-3">
          <div className="p-8 pb-20 md:pb-16 lg:p-10">
            <h1>Dashboard</h1>
            <DashboardNavbar />
            {group ? (
              <div className="mt-4">
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
                          '[aria-expanded=true][aria-label=panel]',
                        ),
                      ]
                      panels.map((panel) => (panel as HTMLElement).click())
                    }}
                  >
                    Collpase All
                  </Button>
                </div>
                <h3 className="mb-3 mt-6 text-base text-th-fgd-3">Banks</h3>
                <div className="border-b border-th-bkg-3">
                  {banks
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((bank, i) => {
                      const mintInfo = group.mintInfosMapByMint.get(
                        bank.mint.toString(),
                      )

                      const formattedBankValues = getFormattedBankValues(
                        group,
                        bank,
                      )

                      return (
                        <Disclosure key={bank.publicKey.toString()}>
                          {({ open }) => (
                            <>
                              <div
                                className={`w-full border-t border-th-bkg-3 p-4 md:hover:bg-th-bkg-4 ${
                                  open
                                    ? i === stickyIndex
                                      ? 'sticky top-0 bg-th-bkg-4'
                                      : 'bg-th-bkg-4'
                                    : ''
                                }`}
                                id={`parent-item-${i}`}
                              >
                                <Disclosure.Button
                                  className="flex w-full items-center justify-between"
                                  aria-label="panel"
                                >
                                  <div className="flex items-center">
                                    <TokenLogo bank={bank} />
                                    <p className="ml-2 text-th-fgd-2">
                                      {formattedBankValues.name} Bank
                                    </p>
                                  </div>
                                  <ChevronDownIcon
                                    className={`${
                                      open ? 'rotate-180' : 'rotate-0'
                                    } h-5 w-5 text-th-fgd-3`}
                                  />
                                </Disclosure.Button>
                              </div>
                              <Disclosure.Panel>
                                <KeyValuePair
                                  label="Mint"
                                  value={
                                    <ExplorerLink
                                      address={bank.mint.toString()}
                                    />
                                  }
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
                                    <ExplorerLink
                                      address={formattedBankValues.vault}
                                      anchorData
                                    />
                                  }
                                />
                                <KeyValuePair
                                  label="Oracle"
                                  value={
                                    bank.oracleProvider ==
                                    OracleProvider.Switchboard ? (
                                      <a
                                        href={`https://app.switchboard.xyz/solana/mainnet-beta/feed/${bank.oracle.toString()}`}
                                        className={`flex items-center break-all text-th-fgd-2 hover:text-th-fgd-3`}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        {bank.oracle.toString()}
                                        <ArrowTopRightOnSquareIcon className="ml-2 h-5 w-5 whitespace-nowrap" />
                                      </a>
                                    ) : (
                                      <a
                                        href={`https://pyth.network/price-feeds/crypto-${bankNameToOracleName(
                                          bank.name,
                                        ).toLowerCase()}-${'usd'}`}
                                        className={`flex items-center break-all text-th-fgd-2 hover:text-th-fgd-3`}
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
                                  label="Token Index"
                                  value={formattedBankValues.tokenIndex}
                                />
                                <KeyValuePair
                                  label="Mint Decimals"
                                  value={formattedBankValues.mintDecimals}
                                />
                                <KeyValuePair
                                  label="Oracle Price"
                                  value={`$${bank.uiPrice}`}
                                />
                                <KeyValuePair
                                  label="Stable Price"
                                  value={`$${formattedBankValues.stablePrice}`}
                                />
                                <KeyValuePair
                                  label="Last stable price updated"
                                  value={
                                    formattedBankValues.lastStablePriceUpdated
                                  }
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
                                  label="Collected fees native"
                                  value={`${formattedBankValues.collectedFeesNative} ($${formattedBankValues.collectedFeesNativePrice})`}
                                />
                                <KeyValuePair
                                  label="Dust"
                                  value={formattedBankValues.dust}
                                />
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
                                  label="Scaled Init Asset/Liab Weight"
                                  value={`${formattedBankValues.scaledInitAssetWeight} / ${formattedBankValues.scaledInitLiabWeight}`}
                                />
                                <KeyValuePair
                                  label="Deposits"
                                  value={`${formattedBankValues.deposits} ($${formattedBankValues.depositsPrice})`}
                                />
                                <KeyValuePair
                                  label="Borrows"
                                  value={`${formattedBankValues.borrows} ($${formattedBankValues.borrowsPrice})`}
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
                                  value={`$${formattedBankValues.minVaultToDepositsRatio} / $${formattedBankValues.netBorrowLimitPerWindowQuote}`}
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
                                    bank._oracleLastKnownDeviation instanceof
                                      I80F48 &&
                                    !bank._oracleLastKnownDeviation.isZero()
                                      ? bank._oracleLastKnownDeviation
                                          ?.div(bank.price)
                                          .mul(I80F48.fromNumber(100))
                                          .toNumber()
                                          .toFixed(2)
                                      : 'null'
                                  }%)`}
                                />
                                <KeyValuePair
                                  label="Oracle: Max Staleness"
                                  value={`${bank.oracleConfig.maxStalenessSlots} slots (Last updated slot ${bank._oracleLastUpdatedSlot})`}
                                />
                                <KeyValuePair
                                  label="Deposit limit"
                                  value={
                                    formattedBankValues.depositLimit
                                      ? `${formattedBankValues.depositLimit} ${
                                          bank.name
                                        } ($${(
                                          formattedBankValues.depositLimit *
                                          bank.uiPrice
                                        ).toFixed(2)})`
                                      : 'None'
                                  }
                                />
                                <KeyValuePair
                                  label="Interest Curve Scaling"
                                  value={
                                    formattedBankValues.interestCurveScaling
                                  }
                                />
                                <KeyValuePair
                                  label="Interest Targe tUtilization"
                                  value={
                                    formattedBankValues.interestTargetUtilization
                                  }
                                />
                                <KeyValuePair
                                  label="Maint Weight Shift Start"
                                  value={
                                    formattedBankValues.maintWeightShiftStart
                                  }
                                />
                                <KeyValuePair
                                  label="Maint Weight Shift End"
                                  value={
                                    formattedBankValues.maintWeightShiftEnd
                                  }
                                />
                                <KeyValuePair
                                  label="Maint Weight Shift Asset Target"
                                  value={
                                    formattedBankValues.maintWeightShiftAssetTarget
                                  }
                                />
                                <KeyValuePair
                                  label="Maint Weight Shift Liab Target"
                                  value={
                                    formattedBankValues.maintWeightShiftLiabTarget
                                  }
                                />
                                <KeyValuePair
                                  label="Maint Weight Shift Duration Inv"
                                  value={
                                    formattedBankValues.maintWeightShiftDurationInv
                                  }
                                />
                                {bank.mint.toBase58() !== USDC_MINT && (
                                  <div className="mb-4 mt-2 flex">
                                    <Button
                                      className=" ml-auto"
                                      onClick={() =>
                                        setIsOpenSuggestionModal(true)
                                      }
                                    >
                                      Check suggested values
                                      {isOpenSuggestionModal && (
                                        <DashboardSuggestedValues
                                          priceImpacts={priceImpacts}
                                          group={group}
                                          bank={bank}
                                          isOpen={isOpenSuggestionModal}
                                          onClose={() =>
                                            setIsOpenSuggestionModal(false)
                                          }
                                        ></DashboardSuggestedValues>
                                      )}
                                    </Button>
                                  </div>
                                )}
                              </Disclosure.Panel>
                            </>
                          )}
                        </Disclosure>
                      )
                    })}
                </div>

                <h3 className="mb-3 mt-6 text-base text-th-fgd-3">
                  Perp Markets
                </h3>
                <div className="border-b border-th-bkg-3">
                  {Array.from(group.perpMarketsMapByOracle)
                    .filter(
                      ([_, perpMarket]) => !perpMarket.name.includes('OLD'),
                    )
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
                                  <p className="text-th-fgd-2">
                                    {perpMarket.name}
                                  </p>
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
                                  value={
                                    perpMarket.reduceOnly ? 'True' : 'False'
                                  }
                                />
                                <KeyValuePair
                                  label="Oracle Price"
                                  value={`$${perpMarket.uiPrice}`}
                                />
                                <KeyValuePair
                                  label="Stable Price"
                                  value={`$${group.toUiPrice(
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
                                    perpMarket.stablePriceModel
                                      .stableGrowthLimit
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
                                    10000 *
                                    perpMarket.baseLiquidationFee.toNumber()
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
                <h3 className="mb-3 mt-6 text-base text-th-fgd-3">
                  Spot Markets
                </h3>
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
          </div>
        </div>
      </div>
    </GovernancePageWrapper>
  )
}

const KeyValuePair = ({
  label,
  value,
}: {
  label: string
  value: number | ReactNode | string
}) => {
  return (
    <div className="flex items-center justify-between border-t border-th-bkg-2 px-6 py-3">
      <span className="mr-4 flex flex-col whitespace-nowrap text-th-fgd-3">
        {label}
      </span>
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
    <div className="mb-2 mt-4 flex border border-th-bkg-3">
      <div>
        <Link href={'/dashboard'} shallow={true}>
          <h4
            className={`${
              asPath === '/dashboard' ? 'bg-th-bkg-2 text-th-active' : ''
            } cursor-pointer border-r border-th-bkg-3 px-6 py-4`}
          >
            Group
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

//some assets are listed with different pyth named oracles
const bankNameToOracleName = (val: string) => {
  if (val === 'ETH (Portal)') {
    return 'ETH'
  }
  if (val === 'CHAI') return 'DAI'
  if (val === 'wBTC (Portal)') return 'BTC'
  return val
}
