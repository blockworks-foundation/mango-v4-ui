import { Bank, toUiDecimals, I80F48 } from '@blockworks-foundation/mango-v4'
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

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'onboarding',
        'profile',
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
  // const client = mangoStore(s => s.client)

  // const handleClickScroll = (id: string) => {
  //   const element = document.getElementById(id)
  //   if (element) {
  //     element.scrollIntoView({ behavior: 'smooth' })
  //   }
  // }

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-12 lg:col-span-8 lg:col-start-3 xl:col-span-6 xl:col-start-4">
        <div className="p-8 pb-20 md:pb-16 lg:p-10">
          <h1>Dashboard</h1>
          {group ? (
            <div className="mt-4">
              <h2 className="mb-2">Group</h2>
              <ExplorerLink
                address={group?.publicKey.toString()}
                anchorData
              ></ExplorerLink>
              <h3 className="mt-6 mb-3 text-base text-th-fgd-3">Banks</h3>
              <div className="border-b border-th-bkg-3">
                {Array.from(group.banksMapByMint).map(([mintAddress, banks]) =>
                  banks.map((bank) => {
                    const logoUri = mangoTokens.length
                      ? mangoTokens.find((t) => t.address === mintAddress)
                          ?.logoURI
                      : ''
                    return (
                      <Disclosure key={bank.publicKey.toString()}>
                        {({ open }) => (
                          <>
                            <Disclosure.Button
                              className={`default-transition flex w-full items-center justify-between border-t border-th-bkg-3 p-4 md:hover:bg-th-bkg-2 ${
                                open ? 'bg-th-bkg-2' : ''
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
                                  {bank.name} Bank
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
                                    address={bank.publicKey.toString()}
                                    anchorData
                                  />
                                }
                              />
                              <KeyValuePair
                                label="Vault"
                                value={
                                  <ExplorerLink
                                    address={bank.vault.toString()}
                                    anchorData
                                  />
                                }
                              />
                              <KeyValuePair
                                label="Oracle"
                                value={
                                  <ExplorerLink
                                    address={bank.oracle.toString()}
                                  />
                                }
                              />
                              <KeyValuePair
                                label="Token Index"
                                value={bank.tokenIndex}
                              />
                              <KeyValuePair
                                label="Oracle Price"
                                value={`$${bank.uiPrice}`}
                              />
                              <KeyValuePair
                                label="Stable Price"
                                value={`$${group.toUiPrice(
                                  I80F48.fromNumber(
                                    bank.stablePriceModel.stablePrice
                                  ),
                                  bank.mintDecimals
                                )}`}
                              />
                              <VaultData bank={bank} />
                              <KeyValuePair
                                label="Loan Fee Rate"
                                value={`${(
                                  10000 * bank.loanFeeRate.toNumber()
                                ).toFixed(2)} bps`}
                              />
                              <KeyValuePair
                                label="Loan origination fee rate"
                                value={`${(
                                  10000 * bank.loanOriginationFeeRate.toNumber()
                                ).toFixed(2)} bps`}
                              />
                              <KeyValuePair
                                label="Collected fees native"
                                value={bank.collectedFeesNative.toNumber()}
                              />
                              <KeyValuePair
                                label="Liquidation fee"
                                value={`${(
                                  10000 * bank.liquidationFee.toNumber()
                                ).toFixed(2)} bps`}
                              />
                              <KeyValuePair
                                label="Dust"
                                value={bank.dust.toNumber()}
                              />
                              <KeyValuePair
                                label="Deposits"
                                value={toUiDecimals(
                                  bank.indexedDeposits
                                    .mul(bank.depositIndex)
                                    .toNumber(),
                                  bank.mintDecimals
                                )}
                              />
                              <KeyValuePair
                                label="Borrows"
                                value={toUiDecimals(
                                  bank.indexedBorrows
                                    .mul(bank.borrowIndex)
                                    .toNumber(),
                                  bank.mintDecimals
                                )}
                              />
                              <KeyValuePair
                                label="Avg Utilization"
                                value={`${
                                  bank.avgUtilization.toNumber() * 100
                                }%`}
                              />
                              <KeyValuePair
                                label="Maint Asset/Liab Weight"
                                value={`${bank.maintAssetWeight.toFixed(2)}/
                              ${bank.maintLiabWeight.toFixed(2)}`}
                              />
                              <KeyValuePair
                                label="Init Asset/Liab Weight"
                                value={`${bank.initAssetWeight.toFixed(2)}/
                              ${bank.initLiabWeight.toFixed(2)}`}
                              />
                              <KeyValuePair
                                label="Scaled Init Asset/Liab Weight"
                                value={`${bank
                                  .scaledInitAssetWeight()
                                  .toFixed(4)}/
                              ${bank.scaledInitLiabWeight().toFixed(4)}`}
                              />
                              <KeyValuePair
                                label="Deposit weight scale start quote"
                                value={bank.depositWeightScaleStartQuote}
                              />
                              <KeyValuePair
                                label="Borrow weight scale start quote"
                                value={bank.borrowWeightScaleStartQuote}
                              />
                              <KeyValuePair
                                label="Rate params"
                                value={
                                  <span className="text-right">
                                    {`${(100 * bank.rate0.toNumber()).toFixed(
                                      2
                                    )}% @ ${(
                                      100 * bank.util0.toNumber()
                                    ).toFixed()}% util, `}
                                    {`${(100 * bank.rate1.toNumber()).toFixed(
                                      2
                                    )}% @ ${(
                                      100 * bank.util1.toNumber()
                                    ).toFixed()}% util, `}
                                    {`${(100 * bank.maxRate.toNumber()).toFixed(
                                      2
                                    )}% @ 100% util`}
                                  </span>
                                }
                              />
                              <KeyValuePair
                                label="Deposit rate"
                                value={`${bank.getDepositRateUi()}%`}
                              />
                              <KeyValuePair
                                label="Borrow rate"
                                value={`${bank.getBorrowRateUi()}%`}
                              />
                              <KeyValuePair
                                label="Last index update"
                                value={new Date(
                                  1000 * bank.indexLastUpdated.toNumber()
                                ).toUTCString()}
                              />
                              <KeyValuePair
                                label="Last rates updated"
                                value={new Date(
                                  1000 * bank.bankRateLastUpdated.toNumber()
                                ).toUTCString()}
                              />
                              <KeyValuePair
                                label="Last stable price updated"
                                value={new Date(
                                  1000 *
                                    bank.stablePriceModel.lastUpdateTimestamp.toNumber()
                                ).toUTCString()}
                              />
                              <KeyValuePair
                                label="Stable Price: delay interval"
                                value={`${bank.stablePriceModel.delayIntervalSeconds}s`}
                              />
                              <KeyValuePair
                                label="Stable Price: growth limits"
                                value={`${(
                                  100 * bank.stablePriceModel.delayGrowthLimit
                                ).toFixed(2)}% delay / ${(
                                  100 * bank.stablePriceModel.stableGrowthLimit
                                ).toFixed(2)}% stable`}
                              />
                              <KeyValuePair
                                label="Oracle: Conf Filter"
                                value={`${(
                                  100 * bank.oracleConfig.confFilter.toNumber()
                                ).toFixed(2)}%`}
                              />
                              <KeyValuePair
                                label="Oracle: Max Staleness"
                                value={`${bank.oracleConfig.maxStalenessSlots} slots`}
                              />
                              <KeyValuePair
                                label="netBorrowsInWindow / netBorrowLimitPerWindowQuote"
                                value={`${bank.netBorrowsInWindow.toNumber()} / ${bank.netBorrowLimitPerWindowQuote.toNumber()}`}
                              />
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
                {Array.from(group.perpMarketsMapByOracle).map(
                  ([oracle, perpMarket]) => {
                    return (
                      <Disclosure key={oracle.toString()}>
                        {({ open }) => (
                          <>
                            <Disclosure.Button
                              className={`default-transition flex w-full items-center justify-between border-t border-th-bkg-3 p-4 md:hover:bg-th-bkg-2 ${
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
                                label="Open Interest"
                                value={`${perpMarket.openInterest} lots`}
                              />
                              <KeyValuePair
                                label="Lot Sizes"
                                value={`${perpMarket.baseLotSize} base /
                          ${perpMarket.quoteLotSize} quote`}
                              />
                              <KeyValuePair
                                label="Maint Asset/Liab Weight"
                                value={`${perpMarket.maintAssetWeight.toFixed(
                                  4
                                )}/
                          ${perpMarket.maintLiabWeight.toFixed(4)}`}
                              />
                              <KeyValuePair
                                label="Init Asset/Liab Weight"
                                value={`${perpMarket.initAssetWeight.toFixed(
                                  4
                                )}/
                          ${perpMarket.initLiabWeight.toFixed(4)}`}
                              />
                              <KeyValuePair
                                label="Liquidation Fee"
                                value={`${(
                                  100 * perpMarket.liquidationFee.toNumber()
                                ).toFixed(4)}%`}
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
                                label="Fees Accrued"
                                value={`$${toUiDecimals(
                                  perpMarket.feesAccrued,
                                  6
                                )}`}
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
                                label="Trusted Market"
                                value={`${perpMarket.trustedMarket}`}
                              />
                              <KeyValuePair
                                label="Group Insurance Fund"
                                value={`${perpMarket.groupInsuranceFund}`}
                              />
                            </Disclosure.Panel>
                          </>
                        )}
                      </Disclosure>
                    )
                  }
                )}
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
    <div className="flex justify-between border-t border-th-bkg-3 p-4 xl:py-1.5">
      <span className="mr-4 whitespace-nowrap text-th-fgd-3">{label}</span>
      {value}
    </div>
  )
}

const VaultData = ({ bank }: { bank: Bank }) => {
  const [vault, setVault] = useState<any>()
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

export default Dashboard
