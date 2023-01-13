import { I80F48, PerpMarket } from '@blockworks-foundation/mango-v4'
import { LinkButton } from '@components/shared/Button'
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
import { NoSymbolIcon } from '@heroicons/react/20/solid'
import { PublicKey } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useViewport } from 'hooks/useViewport'
import { useTranslation } from 'next-i18next'
import { useCallback, useMemo, useState } from 'react'
import { PAGINATION_PAGE_LENGTH } from 'utils/constants'
import { formatDecimal, formatFixedDecimals } from 'utils/numbers'
import { breakpoints } from 'utils/theme'
import TableMarketName from './TableMarketName'

const byTimestamp = (a: any, b: any) => {
  return (
    new Date(b.loadTimestamp || b.timestamp * 1000).getTime() -
    new Date(a.loadTimestamp || a.timestamp * 1000).getTime()
  )
}

const reverseSide = (side: string) => (side === 'buy' ? 'sell' : 'buy')

const parsedPerpEvent = (mangoAccountAddress: string, event: any) => {
  const maker = event.maker.toString() === mangoAccountAddress
  const orderId = maker ? event.makerOrderId : event.takerOrderId
  const value = event.quantity * event.price
  const feeRate = maker
    ? new I80F48(event.makerFee.val)
    : new I80F48(event.takerFee.val)
  const side = maker ? reverseSide(event.takerSide) : event.takerSide

  return {
    ...event,
    key: orderId?.toString(),
    liquidity: maker ? 'Maker' : 'Taker',
    size: event.size,
    price: event.price,
    value,
    feeCost: (feeRate.toNumber() * value).toFixed(4),
    side,
    marketName: event.marketName,
  }
}

const parsedSerumEvent = (event: any) => {
  let liquidity
  if (event.eventFlags) {
    liquidity = event?.eventFlags?.maker ? 'Maker' : 'Taker'
  } else {
    liquidity = event.maker ? 'Maker' : 'Taker'
  }
  return {
    ...event,
    liquidity,
    key: `${event.maker}-${event.price}`,
    value: event.price * event.size,
    side: event.side,
    marketName: event.marketName,
  }
}

const formatTradeHistory = (
  mangoAccountAddress: string,
  tradeHistory: any[]
) => {
  return tradeHistory
    .flat()
    .map((event) => {
      if (event.eventFlags || event.nativeQuantityPaid) {
        return parsedSerumEvent(event)
      } else if (event.maker) {
        return parsedPerpEvent(mangoAccountAddress, event)
      } else {
        return event
      }
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
    if (!mangoAccountAddress || !selectedMarket) return []

    const mangoAccountFills = fills
      .filter((fill: any) => {
        if (fill.openOrders) {
          // handles serum event queue for spot trades
          return openOrderOwner ? fill.openOrders.equals(openOrderOwner) : false
        } else {
          // handles mango event queue for perp trades
          return (
            fill.taker.equals(openOrderOwner) ||
            fill.maker.equals(openOrderOwner)
          )
        }
      })
      .map((fill: any) => ({ ...fill, marketName: selectedMarket.name }))

    return formatTradeHistory(mangoAccountAddress, mangoAccountFills)
  }, [selectedMarket, mangoAccountAddress, openOrderOwner, fills])

  const combinedTradeHistory = useMemo(() => {
    let newFills = []
    if (eventQueueFillsForAccount?.length) {
      console.log('eventQueueFillsForAccount', eventQueueFillsForAccount)

      newFills = eventQueueFillsForAccount.filter((fill) => {
        return !tradeHistory.find((t) => {
          if (t.order_id) {
            return t.order_id === fill.orderId?.toString()
          }
          // else {
          //   return t.seq_num === fill.seqNum?.toString()
          // }
        })
      })
    }
    return [...newFills, ...tradeHistory]
  }, [eventQueueFillsForAccount, tradeHistory])

  const handleShowMore = useCallback(() => {
    const set = mangoStore.getState().set
    set((s) => {
      s.mangoAccount.tradeHistory.loading = true
    })
    setOffset(offset + PAGINATION_PAGE_LENGTH)
    actions.fetchTradeHistory(offset + PAGINATION_PAGE_LENGTH)
  }, [actions, offset])

  if (!selectedMarket || !group) return null

  return mangoAccount &&
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
              </TrHead>
            </thead>
            <tbody>
              {combinedTradeHistory.map((trade: any, index: number) => {
                let market
                if ('market' in trade) {
                  market = group.getSerum3MarketByExternalMarket(
                    new PublicKey(trade.market)
                  )
                } else if ('perp_market' in trade) {
                  market = group.getPerpMarketByName(trade.perp_market)
                } else {
                  market = selectedMarket
                }
                let makerTaker = trade.liquidity
                if ('maker' in trade) {
                  makerTaker = trade.maker ? 'Maker' : 'Taker'
                  if (trade.taker === mangoAccount.publicKey.toString()) {
                    makerTaker = 'Taker'
                  }
                }
                const size = trade.size || trade.quantity
                let fee
                if (trade.fee_cost || trade.feeCost) {
                  fee = trade.fee_cost || trade.feeCost
                } else {
                  fee =
                    trade.maker === mangoAccount.publicKey.toString()
                      ? trade.maker_fee
                      : trade.taker_fee
                }

                return (
                  <TrBody
                    key={`${trade.signature || trade.marketIndex}${index}`}
                    className="my-1 p-2"
                  >
                    <Td className="">
                      <TableMarketName market={market} />
                    </Td>
                    <Td className="text-right">
                      <SideBadge side={trade.side} />
                    </Td>
                    <Td className="text-right font-mono">{size}</Td>
                    <Td className="text-right font-mono">
                      {formatDecimal(trade.price)}
                    </Td>
                    <Td className="text-right font-mono">
                      {formatFixedDecimals(trade.price * size, true, true)}
                    </Td>
                    <Td className="text-right">
                      <span className="font-mono">{formatDecimal(fee)}</span>
                      <p className="font-body text-xs text-th-fgd-4">
                        {makerTaker}
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
                  </TrBody>
                )
              })}
            </tbody>
          </Table>
        </div>
      ) : (
        <div>
          {combinedTradeHistory.map((trade: any, index: number) => {
            const size = trade.size || trade.quantity
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
                      <span className="font-mono text-th-fgd-2">{size}</span>
                      {' for '}
                      <span className="font-mono text-th-fgd-2">
                        {formatDecimal(trade.price)}
                      </span>
                    </p>
                  </div>
                </div>
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
                    {formatFixedDecimals(trade.price * size, true, true)}
                  </p>
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
  ) : (
    <div className="flex flex-col items-center justify-center p-8 px-6">
      <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
      <p>No trade history</p>
    </div>
  )
}

export default TradeHistory
