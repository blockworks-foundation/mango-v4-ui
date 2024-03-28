import ExplorerLink from '@components/shared/ExplorerLink'
import useMangoGroup from 'hooks/useMangoGroup'
import type { NextPage } from 'next'
import { ChangeEvent, ReactNode, useCallback, useEffect, useState } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import useMangoAccount from 'hooks/useMangoAccount'
import {
  toUiDecimalsForQuote,
  HealthType,
  PerpOrder,
} from '@blockworks-foundation/mango-v4'
import mangoStore from '@store/mangoStore'
import { DashboardNavbar } from '.'
import Input from '@components/forms/Input'
import Button from '@components/shared/Button'
import { useRouter } from 'next/router'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'

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

const MangoAccountDashboard: NextPage = () => {
  const { group } = useMangoGroup()
  const { mangoAccount } = useMangoAccount()
  const client = mangoStore((s) => s.client)
  const [openOrders, setOpenOrders] = useState<Record<string, PerpOrder[]>>()
  const router = useRouter()
  console.log('router.query', router.query)

  const [searchString, setSearchString] = useState<string>(
    router.query['address'] as string,
  )

  const loadOpenOrders = useCallback(async () => {
    if (!mangoAccount || !group) return
    const openOrders: Record<string, PerpOrder[]> = {}
    for (const perpOrder of mangoAccount.perpOrdersActive()) {
      const market = group.getPerpMarketByMarketIndex(perpOrder.orderMarket)
      const orders = await mangoAccount.loadPerpOpenOrdersForMarket(
        client,
        group,
        perpOrder.orderMarket,
        true,
      )
      openOrders[market.publicKey.toString()] = orders
    }
    setOpenOrders(openOrders)
  }, [mangoAccount, client, group])

  useEffect(() => {
    if (mangoAccount) {
      loadOpenOrders()
    }
  }, [mangoAccount, loadOpenOrders])

  return (
    <>
      <DashboardNavbar />
      <div className="grid grid-cols-12">
        <div className="col-span-12 lg:col-span-8 lg:col-start-3">
          <div className="mx-4 mt-4 lg:mx-0">
            <div className="mt-4 flex space-x-2">
              <Input
                type="text"
                name="search"
                id="search"
                value={searchString}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setSearchString(e.target.value)
                }
              />
              <Button
                className="flex items-center"
                onClick={() => {
                  const encodedSearchString = encodeURIComponent(searchString)
                  router.push(
                    `/dashboard/mangoaccount?address=${encodedSearchString}`,
                  )
                }}
                disabled={!searchString}
                size="large"
              >
                <MagnifyingGlassIcon className="mr-2 h-5 w-5" />
                Search
              </Button>
            </div>
          </div>
          {group && mangoAccount ? (
            <div className="mx-4 mt-4 lg:mx-0">
              <h2 className="mb-6">Mango Account</h2>

              <KeyValuePair
                label="Address"
                value={
                  <ExplorerLink address={mangoAccount.publicKey.toString()} />
                }
              />
              <KeyValuePair
                label="Owner"
                value={<ExplorerLink address={mangoAccount.owner.toString()} />}
              />
              <KeyValuePair label="Name" value={mangoAccount.name.toString()} />
              <KeyValuePair
                label="Delegate"
                value={
                  <ExplorerLink address={mangoAccount.delegate.toString()} />
                }
              />
              <KeyValuePair
                label="Account Number"
                value={mangoAccount.accountNum.toString()}
              />
              <KeyValuePair
                label="Being Liquidated"
                value={mangoAccount.beingLiquidated.toString()}
              />
              <KeyValuePair
                label="Init Health"
                value={`$${toUiDecimalsForQuote(
                  mangoAccount.getHealth(group, HealthType.init),
                ).toFixed(4)}`}
              />
              <KeyValuePair
                label="Maint Health"
                value={`$${toUiDecimalsForQuote(
                  mangoAccount.getHealth(group, HealthType.maint),
                ).toFixed(4)}`}
              />
              {/* <KeyValuePair
                label="Perp Settle Health"
                value={`$${toUiDecimalsForQuote(
                  mangoAccount.getPerpSettleHealth(group)
                ).toFixed(4)}`}
              /> */}
              <KeyValuePair
                label="Net Deposits"
                value={`$${toUiDecimalsForQuote(
                  mangoAccount.netDeposits,
                ).toFixed(4)}`}
              />
              <KeyValuePair
                label="Perp Spot Transfers"
                value={mangoAccount.perpSpotTransfers.toNumber()}
              />
              <KeyValuePair
                label="Health Region Begin Init Health"
                value={mangoAccount.healthRegionBeginInitHealth.toNumber()}
              />
              <KeyValuePair
                label="Perp OO Count"
                value={mangoAccount.perpOpenOrders.length}
              />
              <KeyValuePair
                label="Perp Active OO Count"
                value={mangoAccount.perpOrdersActive().length}
              />
              <KeyValuePair
                label="Perp Position Count"
                value={mangoAccount.perps.length}
              />
              <KeyValuePair
                label="Active Perp Position Count"
                value={mangoAccount.perpActive().length}
              />
              <KeyValuePair
                label="Token Position Count"
                value={mangoAccount.tokens.length}
              />
              <KeyValuePair
                label="Active Token Position Count"
                value={mangoAccount.tokensActive().length}
              />
              <KeyValuePair
                label="Serum OO Count"
                value={mangoAccount.serum3.length}
              />
              <KeyValuePair
                label="Active Serum OO Count"
                value={mangoAccount.serum3Active().length}
              />

              <h3 className="mt-4">Token Active Positions</h3>
              {mangoAccount.tokensActive().map((token) => {
                const bank = group.getFirstBankByTokenIndex(token.tokenIndex)
                return (
                  <div key={token.tokenIndex} className="mt-6">
                    <KeyValuePair label="Token's Bank Name" value={bank.name} />
                    <KeyValuePair
                      label="Deposits Native"
                      value={token.deposits(bank).toString()}
                    />
                    <KeyValuePair
                      label="Borrow Native"
                      value={token.borrows(bank).toString()}
                    />
                    <KeyValuePair
                      label="Balance UI"
                      value={token.balanceUi(bank)}
                    />
                    <KeyValuePair
                      label="Value at oracle price"
                      value={`$${token.balanceUi(bank) * bank.uiPrice}`}
                    />
                    <KeyValuePair
                      label="In Use Count"
                      value={`${token.inUseCount}`}
                    />
                  </div>
                )
              })}

              <h3 className="mt-4">Serum3 Active Positions</h3>
              {mangoAccount.serum3Active().map((serum) => {
                const market = group.getSerum3MarketByMarketIndex(
                  serum.marketIndex,
                )
                const extMarket = group.getSerum3ExternalMarket(
                  market.serumMarketExternal,
                )
                return (
                  <div key={serum.marketIndex} className="mt-6">
                    <KeyValuePair
                      label="Serum Market"
                      value={
                        <ExplorerLink address={market.publicKey.toString()} />
                      }
                    />
                    <KeyValuePair
                      label="Serum External Market"
                      value={
                        <ExplorerLink
                          address={extMarket.publicKey.toString()}
                        />
                      }
                    />
                    <KeyValuePair label="Name" value={market.name} />
                    <KeyValuePair
                      label="Market Index"
                      value={serum.marketIndex}
                    />
                    <KeyValuePair
                      label="Open Orders"
                      value={serum.openOrders.toBase58()}
                    />
                  </div>
                )
              })}

              <h3 className="mt-4">Perp Active Positions</h3>
              {mangoAccount.perpActive().map((perp) => {
                const market = group.getPerpMarketByMarketIndex(
                  perp.marketIndex,
                )
                return (
                  <div key={perp.marketIndex} className="mt-6">
                    <KeyValuePair
                      label="Market"
                      value={
                        <ExplorerLink address={market.publicKey.toString()} />
                      }
                    />
                    <KeyValuePair
                      label="Market Index"
                      value={perp.marketIndex}
                    />
                    <KeyValuePair label="Name" value={market.name} />
                    <KeyValuePair
                      label="Base Position Lots"
                      value={perp.basePositionLots.toNumber()}
                    />
                    <KeyValuePair
                      label="Base Position Ui"
                      value={perp.getBasePositionUi(market)}
                    />
                    <KeyValuePair
                      label="Quote Position"
                      value={`$${toUiDecimalsForQuote(
                        perp.quotePositionNative,
                      ).toFixed(4)}`}
                    />
                    <KeyValuePair
                      label="Equity"
                      value={`$${perp.getEquityUi(market).toFixed(6)}`}
                    />
                    <KeyValuePair
                      label="Unsettled Funding"
                      value={`$${toUiDecimalsForQuote(
                        perp.getUnsettledFunding(market),
                      ).toFixed(6)}`}
                    />
                    <KeyValuePair
                      label="Avg Entry Price"
                      value={`$${perp
                        .getAverageEntryPriceUi(market)
                        .toFixed(6)}`}
                    />
                    <KeyValuePair
                      label="Break even price"
                      value={`$${perp.getBreakEvenPriceUi(market).toFixed(6)}`}
                    />
                    <KeyValuePair
                      label="Max Settle"
                      value={`$${toUiDecimalsForQuote(
                        mangoAccount.perpMaxSettle(
                          group,
                          market.settleTokenIndex,
                        ),
                      ).toFixed(6)}`}
                    />
                    <KeyValuePair
                      label="Quote Running"
                      value={`$${toUiDecimalsForQuote(
                        perp.quoteRunningNative,
                      ).toFixed(6)}`}
                    />
                    <KeyValuePair
                      label="Cumulative Funding"
                      value={`$${toUiDecimalsForQuote(
                        -perp.cumulativeLongFunding,
                      ).toFixed(6)} long / $${toUiDecimalsForQuote(
                        perp.cumulativeShortFunding,
                      ).toFixed(6)} short / $${toUiDecimalsForQuote(
                        -perp.cumulativeLongFunding +
                          perp.cumulativeShortFunding,
                      ).toFixed(6)} total`}
                    />
                    <KeyValuePair
                      label="Taker Lots"
                      value={`${perp.takerQuoteLots.toNumber()} quote / ${perp.takerBaseLots.toNumber()} base`}
                    />
                    <KeyValuePair
                      label="Open Orders Lots"
                      value={`${perp.bidsBaseLots.toNumber()} bids / ${perp.asksBaseLots.toNumber()} asks`}
                    />
                    <KeyValuePair
                      label="Has open orders"
                      value={perp.hasOpenOrders().toString()}
                    />
                    <KeyValuePair
                      label="Volume"
                      value={`$${toUiDecimalsForQuote(perp.makerVolume).toFixed(
                        6,
                      )} maker / $${toUiDecimalsForQuote(
                        perp.takerVolume,
                      ).toFixed(6)} taker`}
                    />
                    <KeyValuePair
                      label="Perp-Spot Transfers"
                      value={`$${toUiDecimalsForQuote(
                        perp.perpSpotTransfers,
                      ).toFixed(6)}`}
                    />
                    <KeyValuePair
                      label="Position Lifetime PnL"
                      value={`$${toUiDecimalsForQuote(
                        perp.realizedPnlForPositionNative,
                      ).toFixed(6)} realized / $${toUiDecimalsForQuote(
                        perp.cumulativePnlOverPositionLifetimeUi(market),
                      ).toFixed(6)} total`}
                    />
                  </div>
                )
              })}

              <h3 className="mt-4">Perp Open Orders</h3>
              {openOrders
                ? Object.entries(openOrders).map(
                    ([marketAddress, openOrders]) => {
                      return (
                        <div key={marketAddress} className="mt-4">
                          <KeyValuePair
                            label="Market Address"
                            value={<ExplorerLink address={marketAddress} />}
                          />
                          {openOrders.map((openOrder) => {
                            return (
                              <div
                                key={`${openOrder.orderId}${openOrder.side}${openOrder.seqNum}`}
                                className="mt-4 rounded border border-th-bkg-3 px-2"
                              >
                                <KeyValuePair
                                  label="Side"
                                  value={
                                    openOrder.side
                                      ? 'bid' in openOrder.side
                                        ? 'Bid'
                                        : 'Ask'
                                      : null
                                  }
                                />
                                <KeyValuePair
                                  label="Price"
                                  value={openOrder.price}
                                />
                                <KeyValuePair
                                  label="Size"
                                  value={openOrder.size}
                                />
                              </div>
                            )
                          })}
                        </div>
                      )
                    },
                  )
                : null}
            </div>
          ) : (
            <div className="m-4 flex items-center">Loading account data...</div>
          )}
        </div>
      </div>
    </>
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
    <div className="flex  justify-between border-t border-th-bkg-3 py-4 md:hover:bg-th-bkg-2 xl:py-1.5">
      <span className="mr-4 whitespace-nowrap text-th-fgd-3">{label}</span>
      {value}
    </div>
  )
}

export default MangoAccountDashboard
