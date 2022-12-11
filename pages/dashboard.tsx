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
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}

const Dashboard: NextPage = () => {
  const { group } = useMangoGroup()
  const { mangoTokens } = useJupiterMints()
  // const client = mangoStore(s => s.client)

  const handleClickScroll = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-12 border-b border-th-bkg-3 lg:col-span-8 lg:col-start-3 xl:col-span-6 xl:col-start-4">
        <div className="p-8 pb-20 md:pb-16 lg:p-10">
          <h1>Dashboard</h1>
          {group ? (
            <div className="mt-4">
              <h2 className="mb-2">Group</h2>
              <ExplorerLink
                address={group?.publicKey.toString()}
                anchorData
              ></ExplorerLink>
              <div className="sticky top-2 z-10 mt-2 flex flex-col rounded-md bg-th-bkg-2 p-4 md:flex-row md:items-center md:justify-between">
                <p className="whitespace-nowrap">Jump to Bank:</p>
                <div className="flex flex-wrap">
                  {Array.from(group.banksMapByMint).map(
                    ([mintAddress, banks]) => (
                      <button
                        className="mr-2 mt-2 rounded bg-th-bkg-3 px-2 py-1 md:mt-0"
                        key={mintAddress}
                        onClick={() => handleClickScroll(banks[0].name)}
                      >
                        {banks[0].name}
                      </button>
                    )
                  )}
                </div>
                <p className="whitespace-nowrap">Jump to Perp Market:</p>
                <div className="flex flex-wrap">
                  {Array.from(group.perpMarketsMapByOracle).map(
                    ([oracle, perpMarket]) => (
                      <button
                        className="mr-2 mt-2 rounded bg-th-bkg-3 px-2 py-1 md:mt-0"
                        key={oracle.toString()}
                        onClick={() => handleClickScroll(perpMarket.name)}
                      >
                        {perpMarket.name}
                      </button>
                    )
                  )}
                </div>
              </div>


              <h3 className="mt-6 text-sm text-th-fgd-3">Banks</h3>
              {Array.from(group.banksMapByMint).map(([mintAddress, banks]) => {
                return (
                  <div
                    key={mintAddress}
                    className="mt-6 border-b border-th-bkg-3"
                  >
                    {banks.map((bank) => {
                      const logoUri = mangoTokens.length
                        ? mangoTokens.find((t) => t.address === mintAddress)
                            ?.logoURI
                        : ''
                      return (
                        <div
                          key={bank.publicKey.toString()}
                          id={bank.name}
                          className="scroll-mt-28"
                        >
                          <div className="mb-3 flex items-center">
                            {logoUri ? (
                              <Image
                                alt=""
                                width="24"
                                height="24"
                                src={logoUri}
                              />
                            ) : (
                              <QuestionMarkCircleIcon className="h-6 w-6 text-th-fgd-3" />
                            )}
                            <h4 className="ml-2 text-lg font-bold text-th-fgd-2">
                              {bank.name} Bank
                            </h4>
                          </div>
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
                            value={`$${group.toUiPrice(I80F48.fromNumber(bank.stablePriceModel.stablePrice), bank.mintDecimals)}`}
                          />
                          <VaultData bank={bank} />
                          <KeyValuePair
                            label="Loan Fee Rate"
                            value={`${(10000 * bank.loanFeeRate.toNumber()).toFixed(2)} bps`}
                          />
                          <KeyValuePair
                            label="Loan origination fee rate"
                            value={`${(10000 * bank.loanOriginationFeeRate.toNumber()).toFixed(2)} bps`}
                          />
                          <KeyValuePair
                            label="Collected fees native"
                            value={bank.collectedFeesNative.toNumber()}
                          />
                          <KeyValuePair
                            label="Liquidation fee"
                            value={`${(10000 * bank.liquidationFee.toNumber()).toFixed(2)} bps`}
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
                            value={`${bank.avgUtilization.toNumber() * 100}%`}
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
                            value={`${bank.scaledInitAssetWeight().toFixed(4)}/
                              ${bank.scaledInitLiabWeight().toFixed(4)}`
                            }
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
                                {`${(100 * bank.rate0.toNumber()).toFixed(2)}% @ ${
                                  (100 * bank.util0.toNumber()).toFixed()
                                }% util, `}
                                {`${(100 * bank.rate1.toNumber()).toFixed(2)}% @ ${
                                  (100 * bank.util1.toNumber()).toFixed()
                                }% util, `}
                                {`${
                                  (100 * bank.maxRate.toNumber()).toFixed(2)
                                }% @ 100% util`}
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
                              1000 * bank.stablePriceModel.lastUpdateTimestamp.toNumber()
                            ).toUTCString()}
                          />
                          <KeyValuePair
                            label="Stable Price: delay interval"
                            value={`${bank.stablePriceModel.delayIntervalSeconds}s`}
                          />
                          <KeyValuePair
                            label="Stable Price: growth limits"
                            value={`${(100 * bank.stablePriceModel.delayGrowthLimit).toFixed(2)}% delay / ${(100 * bank.stablePriceModel.stableGrowthLimit).toFixed(2)}% stable`}
                          />
                          <KeyValuePair
                            label="Oracle: Conf Filter"
                            value={`${(100 * bank.oracleConfig.confFilter.toNumber()).toFixed(2)}%`}
                          />
                          <KeyValuePair
                            label="Oracle: Max Staleness"
                            value={`${bank.oracleConfig.maxStalenessSlots} slots`}
                          />
                          <KeyValuePair
                            label="netBorrowsInWindow / netBorrowLimitPerWindowQuote"
                            value={`${bank.netBorrowsInWindow.toNumber()} / ${bank.netBorrowLimitPerWindowQuote.toNumber()}`}
                          />
                        </div>
                      )
                    })}
                  </div>
                )
              })}


              <h3 className="mt-6 text-sm text-th-fgd-3">Perp Markets</h3>
              {Array.from(group.perpMarketsMapByOracle).map(([oracle, perpMarket]) => {
                return (
                  <div
                    key={oracle.toString()}
                    className="mt-6 border-b border-th-bkg-3"
                  >
                    <div
                      key={perpMarket.publicKey.toString()}
                      id={perpMarket.name}
                      className="scroll-mt-28"
                    >
                      <div className="mb-3 flex items-center">
                        <h4 className="ml-2 text-lg font-bold text-th-fgd-2">
                          {perpMarket.name} Perp Market
                        </h4>
                      </div>
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
                        value={`$${group.toUiPrice(I80F48.fromNumber(perpMarket.stablePriceModel.stablePrice), perpMarket.baseDecimals)}`}
                      />
                      <KeyValuePair
                        label="Oracle: Conf Filter"
                        value={`${(100 * perpMarket.oracleConfig.confFilter.toNumber()).toFixed(2)}%`}
                      />
                      <KeyValuePair
                        label="Oracle: Max Staleness"
                        value={`${perpMarket.oracleConfig.maxStalenessSlots} slots`}
                      />
                    </div>
                  </div>
                )
              })}


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
    <div className="flex justify-between border-t border-th-bkg-3 py-4 xl:py-1.5">
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
