import {
  Bank,
  toUiDecimals,
  I80F48,
  toUiDecimalsForQuote,
  Group,
} from '@blockworks-foundation/mango-v4'
import ExplorerLink from '@components/shared/ExplorerLink'
import { coder } from '@project-serum/anchor/dist/cjs/spl/token'
import mangoStore from '@store/mangoStore'
import useMangoGroup from 'hooks/useMangoGroup'
import type { NextPage } from 'next'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import useJupiterMints from 'hooks/useJupiterMints'
import Image from 'next/image'
import {
  ChevronDownIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/20/solid'
import { Disclosure } from '@headlessui/react'
import MarketLogos from '@components/trade/MarketLogos'
import Button from '@components/shared/Button'
import BN from 'bn.js'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  LISTING_PRESETS,
  formatSuggestedValues,
} from 'utils/governance/listingTools'
import { compareObjectsAndGetDifferentKeys } from 'utils/governance/tools'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
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
  const { mangoTokens } = useJupiterMints()

  const getFormattedBankValues = (group: Group, bank: Bank) => {
    return {
      ...bank,
      publicKey: bank.publicKey.toBase58(),
      vault: bank.vault.toBase58(),
      oracle: bank.oracle.toBase58(),
      stablePrice: group.toUiPrice(
        I80F48.fromNumber(bank.stablePriceModel.stablePrice),
        bank.mintDecimals
      ),
      maxStalenessSlots: bank.oracleConfig.maxStalenessSlots.toNumber(),
      lastStablePriceUpdated: new Date(
        1000 * bank.stablePriceModel.lastUpdateTimestamp.toNumber()
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
        bank.mintDecimals
      ).toFixed(2),
      collectedFeesNativePrice: (
        toUiDecimals(bank.collectedFeesNative.toNumber(), bank.mintDecimals) *
        bank.uiPrice
      ).toFixed(2),
      dust: bank.dust.toNumber(),
      deposits: toUiDecimals(
        bank.indexedDeposits.mul(bank.depositIndex).toNumber(),
        bank.mintDecimals
      ),
      depositsPrice: (
        toUiDecimals(
          bank.indexedDeposits.mul(bank.depositIndex).toNumber(),
          bank.mintDecimals
        ) * bank.uiPrice
      ).toFixed(2),
      borrows: toUiDecimals(
        bank.indexedBorrows.mul(bank.borrowIndex).toNumber(),
        bank.mintDecimals
      ),
      borrowsPrice: (
        toUiDecimals(
          bank.indexedBorrows.mul(bank.borrowIndex).toNumber(),
          bank.mintDecimals
        ) * bank.uiPrice
      ).toFixed(2),
      avgUtilization: bank.avgUtilization.toNumber() * 100,
      maintAssetWeight: bank.maintAssetWeight.toFixed(2),
      maintLiabWeight: bank.maintLiabWeight.toFixed(2),
      initAssetWeight: bank.initAssetWeight.toFixed(2),
      initLiabWeight: bank.initLiabWeight.toFixed(2),
      depositWeightScale: toUiDecimalsForQuote(
        bank.depositWeightScaleStartQuote
      ),
      borrowWeightScale: toUiDecimalsForQuote(bank.borrowWeightScaleStartQuote),
      rate0: (100 * bank.rate0.toNumber()).toFixed(2),
      util0: (100 * bank.util0.toNumber()).toFixed(),
      rate1: (100 * bank.rate1.toNumber()).toFixed(2),
      util1: (100 * bank.util1.toNumber()).toFixed(),
      maxRate: (100 * bank.maxRate.toNumber()).toFixed(2),
      adjustmentFactor: (bank.adjustmentFactor.toNumber() * 100).toFixed(2),
      depositRate: bank.getDepositRateUi(),
      borrowRate: bank.getBorrowRateUi(),
      lastIndexUpdate: new Date(
        1000 * bank.indexLastUpdated.toNumber()
      ).toUTCString(),
      lastRatesUpdate: new Date(
        1000 * bank.bankRateLastUpdated.toNumber()
      ).toUTCString(),
      oracleConfFilter: (100 * bank.oracleConfig.confFilter.toNumber()).toFixed(
        2
      ),
      minVaultToDepositsRatio: bank.minVaultToDepositsRatio * 100,
      netBorrowsInWindow: toUiDecimalsForQuote(
        I80F48.fromI64(bank.netBorrowsInWindow).mul(bank.price)
      ).toFixed(2),
      netBorrowLimitPerWindowQuote: toUiDecimals(
        bank.netBorrowLimitPerWindowQuote,
        6
      ),
      liquidationFee: (bank.liquidationFee.toNumber() * 100).toFixed(2),
    }
  }

  return (
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
                        '[aria-expanded=false][aria-label=panel]'
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
                        '[aria-expanded=true][aria-label=panel]'
                      ),
                    ]
                    panels.map((panel) => (panel as HTMLElement).click())
                  }}
                >
                  Collpase All
                </Button>
              </div>
              <h3 className="mt-6 mb-3 text-base text-th-fgd-3">Banks</h3>
              <div className="border-b border-th-bkg-3">
                {Array.from(group.banksMapByMint)
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([mintAddress, banks]) =>
                    banks.map((bank) => {
                      const mintInfo = group.mintInfosMapByMint.get(
                        bank.mint.toString()
                      )
                      const logoUri = mangoTokens.length
                        ? mangoTokens.find((t) => t.address === mintAddress)
                            ?.logoURI
                        : ''

                      const formattedBankValues = getFormattedBankValues(
                        group,
                        bank
                      )

                      const suggestedVaules = LISTING_PRESETS['PREMIUM']
                      const suggestedFormattedPreset =
                        formatSuggestedValues(suggestedVaules)

                      const invalidKeys: (keyof typeof suggestedFormattedPreset)[] =
                        Object.keys(suggestedVaules).length
                          ? compareObjectsAndGetDifferentKeys<
                              typeof suggestedFormattedPreset
                            >(
                              formattedBankValues,
                              suggestedFormattedPreset
                            ).filter(
                              (x: string) =>
                                suggestedFormattedPreset[
                                  x as keyof typeof suggestedFormattedPreset
                                ]
                            )
                          : []

                      console.log(invalidKeys)
                      return (
                        <Disclosure key={bank.publicKey.toString()}>
                          {({ open }) => (
                            <>
                              <Disclosure.Button
                                aria-label="panel"
                                className={`flex w-full items-center justify-between border-t border-th-bkg-3 p-4 md:hover:bg-th-bkg-4 ${
                                  open ? 'bg-th-bkg-4' : ''
                                }`}
                              >
                                <div className="flex items-center">
                                  {logoUri ? (
                                    <Image
                                      alt=""
                                      width="20"
                                      height="20"
                                      src={logoUri}
                                    />
                                  ) : (
                                    <QuestionMarkCircleIcon className="h-6 w-6 text-th-fgd-3" />
                                  )}
                                  <p className="ml-2 text-th-fgd-2">
                                    {formattedBankValues.name} Bank
                                  </p>
                                </div>
                                <ChevronDownIcon
                                  className={`${
                                    open ? 'rotate-180' : 'rotate-360'
                                  } h-5 w-5 text-th-fgd-3`}
                                />
                              </Disclosure.Button>
                              <Disclosure.Panel>
                                <KeyValuePair
                                  label="Mint"
                                  value={<ExplorerLink address={mintAddress} />}
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
                                    <ExplorerLink
                                      address={formattedBankValues.oracle}
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
                                  label="Deposits"
                                  value={`${formattedBankValues.deposits} ($${formattedBankValues.depositsPrice})`}
                                />
                                <KeyValuePair
                                  label="Borrows"
                                  value={`${formattedBankValues.borrows} ($${formattedBankValues.borrowsPrice})`}
                                />
                                <KeyValuePair
                                  label="Avg Utilization"
                                  value={`${formattedBankValues.avgUtilization}%`}
                                />
                                <KeyValuePair
                                  label="Maint Asset/Liab Weight"
                                  value={`${formattedBankValues.maintAssetWeight}/
                              ${formattedBankValues.maintLiabWeight}`}
                                />
                                <KeyValuePair
                                  label="Init Asset/Liab Weight"
                                  value={`${formattedBankValues.initAssetWeight}/
                              ${formattedBankValues.initLiabWeight}`}
                                />
                                <KeyValuePair
                                  label="Deposit weight scale start quote"
                                  value={`$${formattedBankValues.depositWeightScale}`}
                                />
                                <KeyValuePair
                                  label="Borrow weight scale start quote"
                                  value={`$${formattedBankValues.borrowWeightScale}`}
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
                                  value={`${formattedBankValues.oracleConfFilter}%`}
                                />
                                <KeyValuePair
                                  label="Oracle: Max Staleness"
                                  value={`${bank.oracleConfig.maxStalenessSlots} slots`}
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
                                  label="Net borrows in window / Net borrow limit per window quote"
                                  value={`$${formattedBankValues.minVaultToDepositsRatio} / $${formattedBankValues.netBorrowLimitPerWindowQuote}`}
                                />
                                <KeyValuePair
                                  label="Liquidation fee"
                                  value={`${formattedBankValues.liquidationFee}%`}
                                />
                                <div className="flex items-center p-4">
                                  <div className="mr-auto">
                                    Green values are params that needs to change
                                    suggested by current liquidity
                                  </div>
                                  <Button>Propose new values</Button>
                                </div>
                              </Disclosure.Panel>
                            </>
                          )}
                        </Disclosure>
                      )
                    })
                  )}
              </div>

              <h3 className="mt-6 mb-3 text-base text-th-fgd-3">
                Perp Markets
              </h3>
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
                                <p className="text-th-fgd-2">
                                  {perpMarket.name}
                                </p>
                              </div>
                              <ChevronDownIcon
                                className={`${
                                  open ? 'rotate-180' : 'rotate-360'
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
                                value={`$${group.toUiPrice(
                                  I80F48.fromNumber(
                                    perpMarket.stablePriceModel.stablePrice
                                  ),
                                  perpMarket.baseDecimals
                                )}`}
                              />
                              <KeyValuePair
                                label="Last stable price updated"
                                value={new Date(
                                  1000 *
                                    perpMarket.stablePriceModel.lastUpdateTimestamp.toNumber()
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
                                    perpMarket.openInterest
                                  ) * perpMarket.uiPrice
                                ).toFixed(2)})`}
                              />
                              <KeyValuePair
                                label="Lot Sizes"
                                value={`${perpMarket.baseLotSize} base /
                          ${
                            perpMarket.quoteLotSize
                          } quote (tick size: $${perpMarket.priceLotsToUi(
                                  new BN(1)
                                )}, 1 base lot: $${(
                                  perpMarket.baseLotsToUi(new BN(1)) *
                                  perpMarket.uiPrice
                                ).toFixed(3)})`}
                              />
                              <KeyValuePair
                                label="Maint Asset/Liab Weight"
                                value={`${perpMarket.maintBaseAssetWeight.toFixed(
                                  4
                                )}/
                          ${perpMarket.maintBaseLiabWeight.toFixed(
                            4
                          )} (maint leverage: ${(
                                  1 /
                                  (perpMarket.maintBaseLiabWeight.toNumber() -
                                    1)
                                ).toFixed(2)}x, init leverage: ${(
                                  1 /
                                  (perpMarket.initBaseLiabWeight.toNumber() - 1)
                                ).toFixed(2)}x)`}
                              />
                              <KeyValuePair
                                label="Init Asset/Liab Weight"
                                value={`${perpMarket.initBaseAssetWeight.toFixed(
                                  4
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
                                    perpMarket.impactQuantity
                                  ) * perpMarket.uiPrice
                                ).toFixed(2)})`}
                              />
                              <KeyValuePair
                                label="Fees Accrued"
                                value={`$${toUiDecimals(
                                  perpMarket.feesAccrued,
                                  6
                                ).toFixed(2)}`}
                              />
                              <KeyValuePair
                                label="Fees Settled"
                                value={`$${toUiDecimals(
                                  perpMarket.feesSettled,
                                  6
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
                                  6
                                )}`}
                              />
                              <KeyValuePair
                                label="Settle fee flat"
                                value={`$${toUiDecimals(
                                  perpMarket.settleFeeFlat,
                                  6
                                )}`}
                              />
                              <KeyValuePair
                                label="Settle fee amount threshold"
                                value={`$${toUiDecimals(
                                  perpMarket.settleFeeAmountThreshold,
                                  6
                                )}`}
                              />
                              <KeyValuePair
                                label="Settle fee fraction low health"
                                value={`${perpMarket.settleFeeFractionLowHealth.toFixed(
                                  4
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
                                  2
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
            </div>
          ) : (
            'Loading'
          )}
        </div>
      </div>
    </div>
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
    <div className="flex justify-between border-t border-th-bkg-2 px-6 py-3">
      <span className="mr-4 whitespace-nowrap text-th-fgd-3">{label}</span>
      <span className="font-mono text-th-fgd-2">{value}</span>
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
      bank.vault
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
        vault ? toUiDecimals(vault.amount.toNumber(), bank.mintDecimals) : '...'
      }
    />
  )
}

export const DashboardNavbar = () => {
  const { asPath } = useRouter()

  return (
    <div className="mt-4 mb-2 flex border border-th-bkg-3">
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
