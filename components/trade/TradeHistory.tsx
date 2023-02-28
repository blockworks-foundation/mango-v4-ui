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
import useMangoAccount from 'hooks/useMangoAccount'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useViewport } from 'hooks/useViewport'
import { useTranslation } from 'next-i18next'
import { useCallback, useMemo, useState } from 'react'
import { SerumEvent, PerpTradeHistory, SpotTradeHistory } from 'types'
import { PAGINATION_PAGE_LENGTH } from 'utils/constants'
import { abbreviateAddress } from 'utils/formatting'
import { breakpoints } from 'utils/theme'
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
    let time = 'Recent'
    if (isSerumFillEvent(event)) {
      trade = parseSerumEvent(event)
    } else if (isPerpFillEvent(event)) {
      trade = parsePerpEvent(mangoAccountAddress, event)
      market = selectedMarket
      time = trade.timestamp.toString()
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

const TradeHistory = () => {
  const { t } = useTranslation(['common', 'trade'])
  const group = mangoStore.getState().group
  const { selectedMarket } = useSelectedMarket()
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const actions = mangoStore((s) => s.actions)
  const fills = mangoStore((s) => s.selectedMarket.fills)
  const tradeHistoryFromApi = mangoStore(
    (s) => s.mangoAccount.tradeHistory.data
  )
  const loadingTradeHistory = mangoStore(
    (s) => s.mangoAccount.tradeHistory.loading
  )
  const [offset, setOffset] = useState(0)
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
    let newFills: (SerumEvent | PerpFillEvent)[] = []
    if (eventQueueFillsForOwner?.length) {
      newFills = eventQueueFillsForOwner.filter((fill) => {
        return !tradeHistoryFromApi.find((t) => {
          if ('order_id' in t && isSerumFillEvent(fill)) {
            return t.order_id === fill.orderId.toString()
          } else if ('seq_num' in t && isPerpFillEvent(fill)) {
            return t.seq_num === fill.seqNum.toNumber()
          }
        })
      })
    }
    return formatTradeHistory(group, selectedMarket, mangoAccountAddress, [
      ...newFills,
      ...tradeHistoryFromApi,
    ])
  }, [
    eventQueueFillsForOwner,
    mangoAccountAddress,
    tradeHistoryFromApi,
    selectedMarket,
  ])

  const handleShowMore = useCallback(() => {
    const set = mangoStore.getState().set
    set((s) => {
      s.mangoAccount.tradeHistory.loading = true
    })
    setOffset(offset + PAGINATION_PAGE_LENGTH)
    actions.fetchTradeHistory(offset + PAGINATION_PAGE_LENGTH)
  }, [actions, offset])

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
                return (
                  <TrBody
                    key={`${trade.side}${trade.size}${trade.price}${trade.time}${index}`}
                    className="my-1 p-2"
                  >
                    <Td className="">
                      <TableMarketName market={trade.market} />
                    </Td>
                    <Td className="text-right">
                      <SideBadge side={trade.side} />
                    </Td>
                    <Td className="text-right font-mono">{trade.size}</Td>
                    <Td className="text-right font-mono">
                      <FormatNumericValue value={trade.price} />
                    </Td>
                    <Td className="text-right font-mono">
                      <FormatNumericValue
                        value={trade.price * trade.size}
                        decimals={2}
                        isUsd
                      />
                    </Td>
                    <Td className="text-right">
                      <span className="font-mono">
                        <FormatNumericValue roundUp value={trade.feeCost} />
                      </span>
                      <p className="font-body text-xs text-th-fgd-4">
                        {trade.liquidity}
                      </p>
                    </Td>
                    <Td className="whitespace-nowrap text-right">
                      {trade.time ? (
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
            return (
              <div
                className="flex items-center justify-between border-b border-th-bkg-3 p-4"
                key={`${trade.price}${trade.size}${trade.side}${trade.time}${index}`}
              >
                <div>
                  <TableMarketName market={selectedMarket} />
                  <div className="mt-1 flex items-center space-x-1">
                    <SideBadge side={trade.side} />
                    <p className="text-th-fgd-4">
                      <span className="font-mono text-th-fgd-2">
                        {trade.size}
                      </span>
                      {' at '}
                      <span className="font-mono text-th-fgd-2">
                        <FormatNumericValue value={trade.price} />
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2.5">
                  <div className="flex flex-col items-end">
                    <span className="mb-0.5 flex items-center space-x-1.5">
                      {trade.time ? (
                        <TableDateDisplay date={trade.time} showSeconds />
                      ) : (
                        'Recent'
                      )}
                    </span>
                    <p className="font-mono text-th-fgd-2">
                      <FormatNumericValue
                        value={trade.price * trade.size}
                        decimals={2}
                        isUsd
                      />
                    </p>
                  </div>
                  {'taker' in trade ? (
                    <a
                      className=""
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`/?address=${
                        trade.liquidity === 'Taker' ? trade.maker : trade.taker
                      }`}
                    >
                      <IconButton size="medium">
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
          <LinkButton onClick={handleShowMore}>Show More</LinkButton>
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
