import {
  Group,
  ParsedFillEvent,
  PerpMarket,
  Serum3Market,
} from '@blockworks-foundation/mango-v4'
import { IconButton, LinkButton } from '@components/shared/Button'
import ConnectEmptyState from '@components/shared/ConnectEmptyState'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import SheenLoader from '@components/shared/SheenLoader'
import SideBadge from '@components/shared/SideBadge'
import {
  Table,
  TableDateDisplay,
  Td,
  Th,
  TrBody,
  TrHead,
} from '@components/shared/TableElements'
import Tooltip from '@components/shared/Tooltip'
import { NoSymbolIcon, UsersIcon } from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import dayjs from 'dayjs'
import useMangoAccount from 'hooks/useMangoAccount'
import useSelectedMarket from 'hooks/useSelectedMarket'
import useTradeHistory from 'hooks/useTradeHistory'
import { useViewport } from 'hooks/useViewport'
import { useTranslation } from 'next-i18next'
import { useMemo } from 'react'
import { SerumEvent, PerpTradeHistory, SpotTradeHistory } from 'types'
import { PAGINATION_PAGE_LENGTH } from 'utils/constants'
import { abbreviateAddress } from 'utils/formatting'
import { breakpoints } from 'utils/theme'
import MarketLogos from './MarketLogos'
import PerpSideBadge from './PerpSideBadge'
import TableMarketName from './TableMarketName'

type PerpFillEvent = ParsedFillEvent

const parsePerpEvent = (mangoAccountAddress: string, event: PerpFillEvent) => {
  const maker = event.maker.toString() === mangoAccountAddress
  const orderId = maker ? event.makerOrderId : event.takerOrderId
  const value = event.quantity * event.price
  const feeRate = maker ? event.makerFee : event.takerFee
  const takerSide = event.takerSide === 0 ? 'buy' : 'sell'
  const side = maker ? (takerSide === 'buy' ? 'sell' : 'buy') : takerSide

  return {
    ...event,
    key: orderId?.toString(),
    liquidity: maker ? 'Maker' : 'Taker',
    size: event.quantity,
    price: event.price,
    value,
    feeCost: feeRate * value,
    side,
  }
}

const parseSerumEvent = (event: SerumEvent) => {
  let liquidity
  if (event.eventFlags) {
    liquidity = event?.eventFlags?.maker ? 'Maker' : 'Taker'
  }

  return {
    ...event,
    liquidity,
    key: `${liquidity}-${event.price}`,
    value: event.price * event.size,
    side: event.side,
  }
}

const isApiSpotTradeHistory = (
  t: SpotTradeHistory | PerpTradeHistory
): t is SpotTradeHistory => {
  if ('open_orders' in t) return true
  else return false
}

type CombinedTradeHistoryTypes =
  | SpotTradeHistory
  | PerpTradeHistory
  | PerpFillEvent
  | SerumEvent

export const isSerumFillEvent = (
  t: CombinedTradeHistoryTypes
): t is SerumEvent => {
  if ('eventFlags' in t) return true
  else return false
}

export const isPerpFillEvent = (
  t: CombinedTradeHistoryTypes
): t is PerpFillEvent => {
  if ('takerSide' in t) return true
  else return false
}

const parseApiTradeHistory = (
  mangoAccountAddress: string,
  trade: SpotTradeHistory | PerpTradeHistory
) => {
  let side: 'buy' | 'sell'
  let size
  let feeCost
  let liquidity
  if (isApiSpotTradeHistory(trade)) {
    side = trade.side
    size = trade.size
    feeCost = trade.fee_cost
    liquidity = trade.maker ? 'Maker' : 'Taker'
  } else {
    liquidity =
      trade.taker && trade.taker === mangoAccountAddress ? 'Taker' : 'Maker'
    if (liquidity == 'Taker') {
      side = trade.taker_side == 'bid' ? 'buy' : 'sell'
    } else {
      side = trade.taker_side == 'bid' ? 'sell' : 'buy'
    }
    size = trade.quantity
    const feeRate =
      trade.maker === mangoAccountAddress ? trade.maker_fee : trade.taker_fee
    feeCost = (trade.price * trade.quantity * feeRate).toFixed(5)
  }

  return {
    ...trade,
    liquidity,
    side,
    size,
    feeCost,
  }
}

const formatTradeHistory = (
  group: Group,
  selectedMarket: Serum3Market | PerpMarket,
  mangoAccountAddress: string,
  tradeHistory: Array<CombinedTradeHistoryTypes>
) => {
  return tradeHistory.flat().map((event) => {
    let trade
    let market = selectedMarket
    let time: string | number = ''
    if (isSerumFillEvent(event)) {
      trade = parseSerumEvent(event)
    } else if (isPerpFillEvent(event)) {
      trade = parsePerpEvent(mangoAccountAddress, event)
      market = selectedMarket

      time = trade.timestamp.toNumber() * 1000
    } else {
      trade = parseApiTradeHistory(mangoAccountAddress, event)
      time = trade.block_datetime
      if ('market' in trade) {
        market = group.getSerum3MarketByExternalMarket(
          new PublicKey(trade.market)
        )
      } else if ('perp_market' in trade) {
        market = group.getPerpMarketByMarketIndex(trade.market_index)
      }
    }

    return {
      ...trade,
      market,
      time,
    }
  })
}

const filterNewFills = (
  eventQueueFills: (SerumEvent | PerpFillEvent)[],
  apiTradeHistory: (SpotTradeHistory | PerpTradeHistory)[]
): (SerumEvent | PerpFillEvent)[] => {
  return eventQueueFills.filter((fill) => {
    return !apiTradeHistory.find((trade) => {
      if ('order_id' in trade && isSerumFillEvent(fill)) {
        return trade.order_id === fill.orderId.toString()
      } else if ('seq_num' in trade && isPerpFillEvent(fill)) {
        const fillTimestamp = new Date(
          fill.timestamp.toNumber() * 1000
        ).getTime()
        const lastApiTradeTimestamp = new Date(
          apiTradeHistory[apiTradeHistory.length - 1].block_datetime
        ).getTime()
        if (fillTimestamp < lastApiTradeTimestamp) return true
        return trade.seq_num === fill.seqNum.toNumber()
      }
    })
  })
}

const TradeHistory = () => {
  const { t } = useTranslation(['common', 'trade'])
  const group = mangoStore.getState().group
  const { selectedMarket } = useSelectedMarket()
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const fills = mangoStore((s) => s.selectedMarket.fills)
  const {
    data: tradeHistoryFromApi,
    isLoading: loadingTradeHistory,
    fetchNextPage,
  } = useTradeHistory()
  const { width } = useViewport()
  const { connected } = useWallet()
  const showTableView = width ? width > breakpoints.md : false

  const openOrderOwner = useMemo(() => {
    if (!mangoAccount || !selectedMarket) return
    if (selectedMarket instanceof PerpMarket) {
      return mangoAccount.publicKey
    } else {
      try {
        return mangoAccount.getSerum3OoAccount(selectedMarket.marketIndex)
          .address
      } catch {
        console.warn(
          'Unable to find OO account for mkt index',
          selectedMarket.marketIndex
        )
      }
    }
  }, [mangoAccount, selectedMarket])

  const eventQueueFillsForOwner = useMemo(() => {
    if (!selectedMarket || !openOrderOwner) return []

    return fills.filter((fill) => {
      if (isSerumFillEvent(fill)) {
        // handles serum event queue for spot trades
        return openOrderOwner ? fill.openOrders.equals(openOrderOwner) : false
      } else if (isPerpFillEvent(fill)) {
        // handles mango event queue for perp trades
        return (
          fill.taker.equals(openOrderOwner) || fill.maker.equals(openOrderOwner)
        )
      }
    })
  }, [selectedMarket, openOrderOwner, fills])

  const combinedTradeHistory = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !selectedMarket) return []

    const apiTradeHistory = tradeHistoryFromApi?.pages.flat() ?? []

    const newFills: (SerumEvent | PerpFillEvent)[] =
      eventQueueFillsForOwner?.length
        ? filterNewFills(eventQueueFillsForOwner, apiTradeHistory)
        : []

    const combinedHistory = [...newFills, ...apiTradeHistory]
    return formatTradeHistory(
      group,
      selectedMarket,
      mangoAccountAddress,
      combinedHistory
    )
  }, [
    eventQueueFillsForOwner,
    mangoAccountAddress,
    tradeHistoryFromApi,
    selectedMarket,
  ])

  if (!selectedMarket || !group) return null

  return mangoAccountAddress &&
    (combinedTradeHistory.length || loadingTradeHistory) ? (
    <>
      {showTableView ? (
        <div className="thin-scroll overflow-x-auto">
          <Table>
            <thead>
              <TrHead>
                <Th className="text-left">{t('market')}</Th>
                <Th className="text-right">{t('trade:side')}</Th>
                <Th className="text-right">{t('trade:size')}</Th>
                <Th className="text-right">{t('price')}</Th>
                <Th className="text-right">{t('value')}</Th>
                <Th className="text-right">{t('fee')}</Th>
                <Th className="text-right">{t('date')}</Th>
                <Th />
              </TrHead>
            </thead>
            <tbody>
              {combinedTradeHistory.map((trade, index: number) => {
                const { side, price, market, size, feeCost, liquidity } = trade
                return (
                  <TrBody
                    key={`${side}${size}${price}${index}`}
                    className="my-1 p-2"
                  >
                    <Td className="">
                      <TableMarketName market={market} />
                    </Td>
                    <Td className="text-right">
                      {market instanceof PerpMarket ? (
                        <PerpSideBadge basePosition={side === 'buy' ? 1 : -1} />
                      ) : (
                        <SideBadge side={side} />
                      )}
                    </Td>
                    <Td className="text-right font-mono">{size}</Td>
                    <Td className="text-right font-mono">
                      <FormatNumericValue value={price} />
                    </Td>
                    <Td className="text-right font-mono">
                      <FormatNumericValue
                        value={price * size}
                        decimals={2}
                        isUsd
                      />
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
                          <Tooltip
                            content={`View Counterparty ${abbreviateAddress(
                              trade.liquidity === 'Taker'
                                ? new PublicKey(trade.maker)
                                : new PublicKey(trade.taker)
                            )}`}
                            delay={0}
                          >
                            <a
                              className=""
                              target="_blank"
                              rel="noopener noreferrer"
                              href={`/?address=${
                                trade.liquidity === 'Taker'
                                  ? trade.maker
                                  : trade.taker
                              }`}
                            >
                              <IconButton size="small">
                                <UsersIcon className="h-4 w-4" />
                              </IconButton>
                            </a>
                          </Tooltip>
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
            return (
              <div
                className="flex items-center justify-between border-b border-th-bkg-3 p-4"
                key={`${price}${size}${side}${index}`}
              >
                <div>
                  <p className="text-sm text-th-fgd-1">
                    {dayjs(trade?.time ? trade.time : Date.now()).format(
                      'ddd D MMM'
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
                    <a
                      className=""
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`/?address=${
                        liquidity === 'Taker' ? trade.maker : trade.taker
                      }`}
                    >
                      <IconButton size="small">
                        <UsersIcon className="h-4 w-4" />
                      </IconButton>
                    </a>
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
    <div className="flex flex-col items-center p-8">
      <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
      <p>No trade history</p>
    </div>
  ) : (
    <div className="p-8">
      <ConnectEmptyState text={t('trade:connect-trade-history')} />
    </div>
  )
}

export default TradeHistory
