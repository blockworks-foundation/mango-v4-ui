import { PerpMarket } from '@blockworks-foundation/mango-v4'
import { IconButton, LinkButton } from '@components/shared/Button'
import ConnectEmptyState from '@components/shared/ConnectEmptyState'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import SheenLoader from '@components/shared/SheenLoader'
import SideBadge from '@components/shared/SideBadge'
import {
  SortableColumnHeader,
  Table,
  TableDateDisplay,
  Td,
  Th,
  TrBody,
  TrHead,
} from '@components/shared/TableElements'
import Tooltip from '@components/shared/Tooltip'
import {
  EyeSlashIcon,
  NoSymbolIcon,
  UsersIcon,
} from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import dayjs from 'dayjs'
import useMangoAccount from 'hooks/useMangoAccount'
import useSelectedMarket from 'hooks/useSelectedMarket'
import useTradeHistory from 'hooks/useTradeHistory'
import { useViewport } from 'hooks/useViewport'
import { useTranslation } from 'next-i18next'
import { PAGINATION_PAGE_LENGTH } from 'utils/constants'
import { abbreviateAddress } from 'utils/formatting'
import { breakpoints } from 'utils/theme'
import MarketLogos from './MarketLogos'
import PerpSideBadge from './PerpSideBadge'
import TableMarketName from './TableMarketName'
import { useSortableData } from 'hooks/useSortableData'
import { useCallback } from 'react'
import { useHiddenMangoAccounts } from 'hooks/useHiddenMangoAccounts'

const TradeHistory = ({ filterForMarket }: { filterForMarket?: boolean }) => {
  const { t } = useTranslation(['common', 'trade'])
  const group = mangoStore.getState().group
  const { selectedMarket } = useSelectedMarket()
  const { mangoAccountAddress } = useMangoAccount()
  const {
    data: combinedTradeHistory,
    isLoading: loadingTradeHistory,
    fetchNextPage,
  } = useTradeHistory()
  const { width } = useViewport()
  const { connected } = useWallet()
  const { hiddenAccounts } = useHiddenMangoAccounts()
  const showTableView = width ? width > breakpoints.md : false

  const formattedTableData = useCallback(() => {
    const formatted = []
    for (const trade of combinedTradeHistory) {
      const marketName = trade.market.name
      const value = trade.price * trade.size
      const sortTime = trade?.time
        ? trade.time
        : dayjs().format('YYYY-MM-DDTHH:mm:ss')
      const data = { ...trade, marketName, value, sortTime }
      formatted.push(data)
    }
    if (!filterForMarket) {
      return formatted
    } else {
      return formatted.filter(
        (trade) => trade.marketName === selectedMarket?.name,
      )
    }
  }, [combinedTradeHistory, filterForMarket, selectedMarket])

  const {
    items: tableData,
    requestSort,
    sortConfig,
  } = useSortableData(formattedTableData())

  if (!selectedMarket || !group) return null

  return mangoAccountAddress && (tableData?.length || loadingTradeHistory) ? (
    <>
      {showTableView ? (
        <div className="thin-scroll overflow-x-auto">
          <Table>
            <thead>
              <TrHead>
                <Th className="text-left">
                  <SortableColumnHeader
                    sortKey="marketName"
                    sort={() => requestSort('marketName')}
                    sortConfig={sortConfig}
                    title={t('market')}
                  />
                </Th>
                <Th>
                  <div className="flex justify-end">
                    <SortableColumnHeader
                      sortKey="size"
                      sort={() => requestSort('size')}
                      sortConfig={sortConfig}
                      title={t('trade:size')}
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
                      sortKey="value"
                      sort={() => requestSort('value')}
                      sortConfig={sortConfig}
                      title={t('value')}
                    />
                  </div>
                </Th>
                <Th>
                  <div className="flex justify-end">
                    <SortableColumnHeader
                      sortKey="feeCost"
                      sort={() => requestSort('feeCost')}
                      sortConfig={sortConfig}
                      title={t('fee')}
                    />
                  </div>
                </Th>
                <Th>
                  <div className="flex justify-end">
                    <SortableColumnHeader
                      sortKey="sortTime"
                      sort={() => requestSort('sortTime')}
                      sortConfig={sortConfig}
                      title={t('date')}
                    />
                  </div>
                </Th>
                <Th />
              </TrHead>
            </thead>
            <tbody>
              {tableData.map((trade, index: number) => {
                const { side, price, market, size, feeCost, liquidity, value } =
                  trade

                let counterpartyAddress = ''
                if ('taker' in trade) {
                  counterpartyAddress =
                    trade.liquidity === 'Taker'
                      ? trade.maker.toString()
                      : trade.taker.toString()
                }
                return (
                  <TrBody
                    key={`${side}${size}${price}${index}`}
                    className="my-1 p-2"
                  >
                    <Td>
                      <TableMarketName
                        market={market}
                        side={
                          market instanceof PerpMarket
                            ? side === 'buy'
                              ? 'long'
                              : 'short'
                            : side
                        }
                      />
                    </Td>
                    <Td className="text-right font-mono">{size}</Td>
                    <Td className="text-right font-mono">
                      <p>{price}</p>
                    </Td>
                    <Td className="text-right font-mono">
                      <FormatNumericValue value={value} decimals={2} isUsd />
                    </Td>
                    <Td className="text-right">
                      <span className="font-mono">
                        <FormatNumericValue roundUp value={feeCost} />
                      </span>
                      <p className="font-body text-xs text-th-fgd-4">
                        {liquidity}
                      </p>
                    </Td>
                    <Td className="whitespace-nowrap text-right">
                      {trade?.time ? (
                        <TableDateDisplay date={trade.time} showSeconds />
                      ) : (
                        'Recent'
                      )}
                    </Td>
                    <Td className="xl:!pl-0">
                      {'taker' in trade ? (
                        <div className="flex justify-end">
                          {!hiddenAccounts?.includes(counterpartyAddress) ? (
                            <Tooltip
                              content={t('trade:tooltip-view-counterparty', {
                                pk: abbreviateAddress(
                                  trade.liquidity === 'Taker'
                                    ? new PublicKey(trade.maker)
                                    : new PublicKey(trade.taker),
                                ),
                              })}
                              delay={0}
                            >
                              <a
                                className=""
                                target="_blank"
                                rel="noopener noreferrer"
                                href={`/?address=${counterpartyAddress}`}
                              >
                                <IconButton size="small">
                                  <UsersIcon className="h-4 w-4" />
                                </IconButton>
                              </a>
                            </Tooltip>
                          ) : (
                            <Tooltip
                              content={t('trade:tooltip-private-counterparty')}
                            >
                              <IconButton
                                className="bg-th-bkg-1"
                                disabled
                                size="small"
                              >
                                <EyeSlashIcon className="h-4 w-4" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </div>
                      ) : null}
                    </Td>
                  </TrBody>
                )
              })}
            </tbody>
          </Table>
        </div>
      ) : (
        <div>
          {combinedTradeHistory.map((trade, index: number) => {
            const { side, price, market, size, liquidity } = trade
            let counterpartyAddress = ''
            if ('taker' in trade) {
              counterpartyAddress =
                trade.liquidity === 'Taker'
                  ? trade.maker.toString()
                  : trade.taker.toString()
            }
            return (
              <div
                className="flex items-center justify-between border-b border-th-bkg-3 p-4"
                key={`${price}${size}${side}${index}`}
              >
                <div>
                  <p className="text-sm text-th-fgd-1">
                    {dayjs(trade?.time ? trade.time : Date.now()).format(
                      'ddd D MMM',
                    )}
                  </p>
                  <p className="text-xs text-th-fgd-3">
                    {trade?.time ? dayjs(trade.time).format('h:mma') : 'Recent'}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center">
                      <MarketLogos market={market} size="small" />
                      <span className="mr-1 whitespace-nowrap">
                        {market.name}
                      </span>
                      {market instanceof PerpMarket ? (
                        <PerpSideBadge basePosition={side === 'buy' ? 1 : -1} />
                      ) : (
                        <SideBadge side={side} />
                      )}
                    </div>
                    <div className="mt-0.5 flex space-x-1 leading-none text-th-fgd-2">
                      <p className="text-th-fgd-4">
                        <span className="font-mono text-th-fgd-2">{size}</span>
                        {' at '}
                        <span className="font-mono text-th-fgd-2">
                          <FormatNumericValue value={price} />
                        </span>
                      </p>
                    </div>
                  </div>
                  {'taker' in trade ? (
                    !hiddenAccounts?.includes(counterpartyAddress) ? (
                      <Tooltip
                        content={t('trade:tooltip-view-counterparty', {
                          pk: abbreviateAddress(
                            liquidity === 'Taker'
                              ? new PublicKey(trade.maker)
                              : new PublicKey(trade.taker),
                          ),
                        })}
                        delay={0}
                      >
                        <a
                          className=""
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`/?address=${counterpartyAddress}`}
                        >
                          <IconButton size="small">
                            <UsersIcon className="h-4 w-4" />
                          </IconButton>
                        </a>
                      </Tooltip>
                    ) : (
                      <Tooltip
                        content={t('trade:tooltip-private-counterparty')}
                      >
                        <IconButton
                          className="bg-th-bkg-1"
                          disabled
                          size="small"
                        >
                          <EyeSlashIcon className="h-4 w-4" />
                        </IconButton>
                      </Tooltip>
                    )
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {loadingTradeHistory ? (
        <div className="mt-4 space-y-1.5">
          {[...Array(4)].map((x, i) => (
            <SheenLoader className="mx-4 flex flex-1 md:mx-6" key={i}>
              <div className="h-16 w-full bg-th-bkg-2" />
            </SheenLoader>
          ))}
        </div>
      ) : null}
      {combinedTradeHistory.length &&
      combinedTradeHistory.length % PAGINATION_PAGE_LENGTH === 0 ? (
        <div className="flex justify-center py-6">
          <LinkButton onClick={() => fetchNextPage()}>Show More</LinkButton>
        </div>
      ) : null}
    </>
  ) : mangoAccountAddress || connected ? (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="flex flex-col items-center p-8">
        <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
        <p>No trade history</p>
      </div>
    </div>
  ) : (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <ConnectEmptyState text={t('trade:connect-trade-history')} />
    </div>
  )
}

export default TradeHistory
