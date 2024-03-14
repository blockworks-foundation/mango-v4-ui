import { PerpMarket } from '@blockworks-foundation/mango-v4'
import BankAmountWithValue from '@components/shared/BankAmountWithValue'
import ContentBox from '@components/shared/ContentBox'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import {
  SortableColumnHeader,
  Table,
  Td,
  Th,
  TrBody,
  TrHead,
} from '@components/shared/TableElements'
import TableTokenName from '@components/shared/TableTokenName'
import TableMarketName from '@components/trade/TableMarketName'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import useListedMarketsWithMarketData from 'hooks/useListedMarketsWithMarketData'
import { useSortableData } from 'hooks/useSortableData'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { floorToDecimal, getDecimalCount, numberCompacter } from 'utils/numbers'
import WatchlistButton from './WatchlistButton'
import Change from '@components/shared/Change'
import SimpleAreaChart from '@components/shared/SimpleAreaChart'

export type WatchlistItem = {
  assetName: string
  type: string
  tokenOrMarketIndex: number
}

// type WatchlistDataItem = {
//   assetName: string
//   assetWeight?: number
//   bankOrPerp: Bank | PerpMarket
//   borrowRate?: number
//   change: number
//   depositRate?: number
//   isUp: boolean
//   marketData: PerpMarketWithMarketData | SerumMarketWithMarketData | undefined
//   pnl: number
//   positionSize: number
//   positionValue: number
//   price: number
//   priceHistory: { price: number; time: number }[]
//   tokenOrMarketIndex: number
//   volume: number
//   watchlistItem: WatchlistItem
// }

const WatchlistTable = ({
  assets,
  isPortfolio,
}: {
  assets: WatchlistItem[]
  isPortfolio?: boolean
}) => {
  const { t } = useTranslation('account')
  const { serumMarketsWithData, perpMarketsWithData } =
    useListedMarketsWithMarketData()

  const formattedTableData = useCallback(
    (assets: WatchlistItem[]) => {
      const group = mangoStore.getState().group
      const mangoAccount = mangoStore.getState().mangoAccount.current
      if (!group || !assets.length) return []
      const formatted = []
      const usdcQuoteMarkets = serumMarketsWithData.filter(
        (market) => market.quoteTokenIndex === 0,
      )
      for (const asset of assets) {
        const { type, tokenOrMarketIndex } = asset
        if (type === 'token') {
          const marketData = usdcQuoteMarkets.find(
            (market) => market.baseTokenIndex === tokenOrMarketIndex,
          )
          const bank = group.getFirstBankByTokenIndex(tokenOrMarketIndex)

          const positionSize = mangoAccount
            ? mangoAccount.getTokenBalanceUi(bank)
            : 0
          const positionValue = Math.abs(positionSize) * bank.uiPrice
          const priceHistory = marketData?.priceHistory?.length
            ? marketData.priceHistory
                ?.sort((a, b) => a.time - b.time)
                .concat([{ price: bank.uiPrice, time: Date.now() }])
            : []
          const volume = marketData?.marketData?.quote_volume_24h || 0
          const change = marketData?.rollingChange || 0
          const price = bank.uiPrice

          const isUp =
            price && priceHistory.length
              ? price >= priceHistory[0].price
              : false

          const depositRate = bank.getDepositRateUi()
          const borrowRate = bank.getBorrowRateUi()
          const assetWeight = bank.scaledInitAssetWeight(bank.price)

          // need a way to get pnl per token
          const pnl = 0

          const data = {
            assetName: bank.name,
            assetWeight,
            bankOrPerp: bank,
            borrowRate,
            change,
            depositRate,
            isUp,
            marketData,
            pnl,
            positionSize,
            positionValue,
            price,
            priceHistory,
            tokenOrMarketIndex,
            volume,
            watchlistItem: asset,
          }

          formatted.push(data)
        } else {
          const market = group.getPerpMarketByMarketIndex(tokenOrMarketIndex)
          const marketData = perpMarketsWithData.find(
            (market) => market.perpMarketIndex === tokenOrMarketIndex,
          )
          const currentDate = new Date()
          const formattedDate = currentDate.toISOString()
          const priceHistory = marketData?.marketData?.price_history?.length
            ? marketData.marketData.price_history
                ?.sort(
                  (a, b) =>
                    new Date(a.time).getTime() - new Date(b.time).getTime(),
                )
                .concat([{ price: market.uiPrice, time: formattedDate }])
            : []
          const volume = marketData?.marketData?.quote_volume_24h || 0
          const change = marketData?.rollingChange || 0
          const price = market.uiPrice

          const isUp =
            price && priceHistory.length
              ? price >= priceHistory[0].price
              : false

          const position = mangoAccount
            ? mangoAccount.getPerpPosition(tokenOrMarketIndex)
            : undefined
          const positionSize = position?.getBasePositionUi(market) || 0
          const positionValue = Math.abs(positionSize) * market.uiPrice
          const pnl = position?.getUnRealizedPnlUi(market) || 0

          const data = {
            assetName: market.name,
            bankOrPerp: market,
            change,
            isUp,
            marketData,
            price,
            pnl,
            positionSize,
            positionValue,
            priceHistory,
            tokenOrMarketIndex,
            volume,
            watchlistItem: asset,
          }

          formatted.push(data)
        }
      }
      return formatted
    },
    [serumMarketsWithData, perpMarketsWithData],
  )

  const {
    items: tableData,
    requestSort,
    sortConfig,
  } = useSortableData(formattedTableData(assets))

  return (
    <ContentBox hideBorder hidePadding>
      <div className="thin-scroll overflow-x-auto">
        <Table>
          <thead>
            <TrHead>
              <Th className="text-left">
                <SortableColumnHeader
                  sortKey="assetName"
                  sort={() => requestSort('assetName')}
                  sortConfig={sortConfig}
                  title={t('asset')}
                />
              </Th>
              <Th>
                <div className="flex justify-end">
                  <SortableColumnHeader
                    sortKey="positionValue"
                    sort={() => requestSort('positionValue')}
                    sortConfig={sortConfig}
                    title={t('position-size')}
                  />
                </div>
              </Th>
              <Th>
                <div className="flex justify-end">
                  <SortableColumnHeader
                    sortKey="pnl"
                    sort={() => requestSort('pnl')}
                    sortConfig={sortConfig}
                    title={t('unrealized-pnl')}
                  />
                </div>
              </Th>
              <Th>
                <div className="flex justify-end">
                  <SortableColumnHeader
                    sortKey="price"
                    sort={() => requestSort('price')}
                    sortConfig={sortConfig}
                    title={t('price')}
                  />
                </div>
              </Th>
              <Th>
                <div className="flex justify-end">
                  <SortableColumnHeader
                    sortKey="change"
                    sort={() => requestSort('change')}
                    sortConfig={sortConfig}
                    title={t('rolling-change')}
                  />
                </div>
              </Th>
              <Th className="hidden text-right md:block"></Th>
              <Th>
                <div className="flex justify-end">
                  <SortableColumnHeader
                    sortKey="volume"
                    sort={() => requestSort('volume')}
                    sortConfig={sortConfig}
                    title={t('trade:24h-volume')}
                  />
                </div>
              </Th>
              <Th />
            </TrHead>
          </thead>
          <tbody className="relative">
            {tableData.map((data) => {
              const {
                assetName,
                bankOrPerp,
                change,
                isUp,
                marketData,
                pnl,
                positionSize,
                positionValue,
                price,
                priceHistory,
                volume,
                watchlistItem,
              } = data

              return (
                <>
                  {!isPortfolio ? (
                    <div className="absolute flex h-16 items-center">
                      <WatchlistButton
                        className="h-full px-6"
                        asset={watchlistItem}
                      />
                    </div>
                  ) : null}
                  <TrBody
                    className="default-transition border-t-0 md:hover:cursor-pointer md:hover:bg-th-bkg-2"
                    key={assetName}
                  >
                    <Td>
                      <div className={!isPortfolio ? 'pl-8' : ''}>
                        {bankOrPerp instanceof PerpMarket ? (
                          <TableMarketName
                            market={bankOrPerp}
                            side={
                              positionSize
                                ? positionSize > 0
                                  ? 'long'
                                  : 'short'
                                : undefined
                            }
                          />
                        ) : (
                          <TableTokenName
                            bank={bankOrPerp}
                            symbol={assetName}
                          />
                        )}
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col items-end">
                        {bankOrPerp instanceof PerpMarket ? (
                          <div className="flex flex-col items-end font-mono text-th-fgd-2">
                            <FormatNumericValue
                              value={Math.abs(positionSize)}
                              decimals={getDecimalCount(
                                bankOrPerp.minOrderSize,
                              )}
                            />
                            <FormatNumericValue
                              classNames="text-th-fgd-4"
                              value={Math.abs(positionValue)}
                              isUsd
                              isPrivate
                            />
                          </div>
                        ) : (
                          <BankAmountWithValue
                            amount={positionSize}
                            decimals={
                              floorToDecimal(
                                positionSize,
                                bankOrPerp.mintDecimals,
                              ).toNumber()
                                ? bankOrPerp.mintDecimals
                                : undefined
                            }
                            bank={bankOrPerp}
                            stacked
                            isPrivate
                            fixDecimals={false}
                          />
                        )}
                      </div>
                    </Td>
                    <Td>
                      <p className="text-right">
                        {pnl ? (
                          <span
                            className={
                              pnl > 0
                                ? 'text-th-up'
                                : pnl < 0
                                ? 'text-th-down'
                                : 'text-th-fgd-4'
                            }
                          >
                            <FormatNumericValue value={pnl} isUsd />
                          </span>
                        ) : (
                          <span className="text-th-fgd-4">–</span>
                        )}
                      </p>
                    </Td>
                    <Td>
                      <div className="flex flex-col items-end">
                        <p>
                          {price ? (
                            <>
                              <FormatNumericValue value={price} isUsd />
                            </>
                          ) : (
                            '–'
                          )}
                        </p>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col items-end">
                        {marketData && price ? (
                          <Change change={change} suffix="%" />
                        ) : (
                          <span>–</span>
                        )}
                      </div>
                    </Td>
                    <Td>
                      {priceHistory.length ? (
                        <div className="h-10 w-24">
                          <SimpleAreaChart
                            color={isUp ? 'var(--up)' : 'var(--down)'}
                            data={priceHistory}
                            name={assetName}
                            xKey="time"
                            yKey="price"
                          />
                        </div>
                      ) : (
                        <p className="mb-0 font-body text-th-fgd-4">
                          {t('unavailable')}
                        </p>
                      )}
                    </Td>
                    <Td>
                      <div className="flex flex-col text-right">
                        <p>
                          {!marketData || !marketData?.marketData ? (
                            '–'
                          ) : volume ? (
                            <span>
                              {numberCompacter.format(volume)}{' '}
                              <span className="font-body text-th-fgd-4">
                                USDC
                              </span>
                            </span>
                          ) : (
                            <span>
                              0{' '}
                              <span className="font-body text-th-fgd-4">
                                USDC
                              </span>
                            </span>
                          )}
                        </p>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex justify-end">
                        <ChevronRightIcon className="h-5 w-5 text-th-fgd-3" />
                      </div>
                    </Td>
                  </TrBody>
                </>
              )
            })}
          </tbody>
        </Table>
      </div>
    </ContentBox>
  )
}

export default WatchlistTable
