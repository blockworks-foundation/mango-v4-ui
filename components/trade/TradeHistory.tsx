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

const byTimestamp = (a: any, b: any) => {
  return (
    new Date(b.loadTimestamp || b.timestamp * 1000).getTime() -
    new Date(a.loadTimestamp || a.timestamp * 1000).getTime()
  )
}

const reverseSide = (side: string) => (side === 'long' ? 'short' : 'long')

type PerpFillEvent = ParsedFillEvent

const parsePerpEvent = (mangoAccountAddress: string, event: PerpFillEvent) => {
  const maker = event.maker.toString() === mangoAccountAddress
  const orderId = maker ? event.makerOrderId : event.takerOrderId
  const value = event.quantity * event.price
  const feeRate = maker ? event.makerFee : event.takerFee
  const takerSide = event.takerSide === 0 ? 'long' : 'short'
  const side = maker ? reverseSide(takerSide) : takerSide

  return {
    ...event,
    key: orderId?.toString(),
    liquidity: maker ? 'Maker' : 'Taker',
    size: event.quantity,
    price: event.price,
    value,
    feeCost: (feeRate * value).toFixed(4),
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

const isSerumFillEvent = (
  t: PerpFillEvent | SerumEvent | SpotTradeHistory | PerpTradeHistory
): t is SerumEvent => {
  if ('eventFlags' in t) return true
  else return false
}

const isPerpFillEvent = (
  t: PerpFillEvent | SerumEvent | SpotTradeHistory | PerpTradeHistory
): t is PerpFillEvent => {
  if ('takerSide' in t) return true
  else return false
}

const parseApiTradeHistory = (
  mangoAccountAddress: string,
  trade: SpotTradeHistory | PerpTradeHistory
) => {
  let side
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
      trade.taker && trade.taker.toString() === mangoAccountAddress
        ? 'Taker'
        : 'Maker'
    const sideObj: any = {}
    if (liquidity == 'Taker') {
      sideObj[trade.taker_side] = 1
    } else {
      sideObj[trade.taker_side == 'bid' ? 'ask' : 'bid'] = 1
    }
    side = sideObj
    size = trade.quantity
    feeCost =
      trade.maker === mangoAccountAddress ? trade.maker_fee : trade.taker_fee
  }

  return {
    ...trade,
    liquidity,
    side,
    size,
    feeCost,
  }
}

type CombinedTradeHistoryTypes =
  | PerpFillEvent
  | SerumEvent
  | SpotTradeHistory
  | PerpTradeHistory

const formatTradeHistory = (
  group: Group,
  selectedMarket: Serum3Market | PerpMarket | undefined,
  mangoAccountAddress: string,
  tradeHistory: Array<CombinedTradeHistoryTypes>
) => {
  return tradeHistory
    .flat()
    .map((event) => {
      let trade
      if (isSerumFillEvent(event)) {
        trade = parseSerumEvent(event)
      } else if (isPerpFillEvent(event)) {
        trade = parsePerpEvent(mangoAccountAddress, event)
      } else {
        trade = parseApiTradeHistory(mangoAccountAddress, event)
      }

      let market
      if ('market' in trade) {
        market = group.getSerum3MarketByExternalMarket(
          new PublicKey(trade.market)
        )
      } else if ('perp_market' in trade) {
        market = group.getPerpMarketByMarketIndex(trade.market_index)
      } else {
        market = selectedMarket
      }

      return { ...trade, market }
    })
    .sort(byTimestamp)
}

const TradeHistory = () => {
  const { t } = useTranslation(['common', 'trade'])
  const group = mangoStore.getState().group
  const { selectedMarket } = useSelectedMarket()
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const actions = mangoStore((s) => s.actions)
  const fills = mangoStore((s) => s.selectedMarket.fills)
  const tradeHistory = mangoStore((s) => s.mangoAccount.tradeHistory.data)
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

  const eventQueueFillsForAccount = useMemo(() => {
    if (!selectedMarket || !openOrderOwner) return []

    return fills.filter((fill: any) => {
      if (fill.openOrders) {
        // handles serum event queue for spot trades
        return openOrderOwner ? fill.openOrders.equals(openOrderOwner) : false
      } else if (fill.taker) {
        // handles mango event queue for perp trades
        return (
          fill.taker.equals(openOrderOwner) || fill.maker.equals(openOrderOwner)
        )
      }
    })
  }, [selectedMarket, openOrderOwner, fills])

  const combinedTradeHistory = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group) return []
    let newFills = []
    if (eventQueueFillsForAccount?.length) {
      newFills = eventQueueFillsForAccount.filter((fill) => {
        return !tradeHistory.find((t) => {
          if ('order_id' in t) {
            return t.order_id === fill.orderId?.toString()
          } else {
            return t.seq_num === fill.seqNum?.toNumber()
          }
        })
      })
    }
    return formatTradeHistory(group, selectedMarket, mangoAccountAddress, [
      ...newFills,
      ...tradeHistory,
    ])
  }, [
    eventQueueFillsForAccount,
    mangoAccountAddress,
    tradeHistory,
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
              {combinedTradeHistory.map((trade: any, index: number) => {
                return (
                  <TrBody
                    key={`${trade.signature || trade.marketIndex}${index}`}
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
                      {trade.block_datetime ? (
                        <TableDateDisplay
                          date={trade.block_datetime}
                          showSeconds
                        />
                      ) : (
                        'Recent'
                      )}
                    </Td>
                    <Td className="xl:!pl-0">
                      {trade.market.name.includes('PERP') ? (
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
          {combinedTradeHistory.map((trade: any, index: number) => {
            return (
              <div
                className="flex items-center justify-between border-b border-th-bkg-3 p-4"
                key={`${trade.marketIndex}${index}`}
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
                      {trade.block_datetime ? (
                        <TableDateDisplay
                          date={trade.block_datetime}
                          showSeconds
                        />
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
                  {trade.market.name.includes('PERP') ? (
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
