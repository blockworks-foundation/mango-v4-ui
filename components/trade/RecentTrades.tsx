import useInterval from '@components/shared/useInterval'
import mangoStore, { CLUSTER } from '@store/mangoStore'
import { useCallback, useEffect, useMemo, useState } from 'react'
import isEqual from 'lodash/isEqual'
import { floorToDecimal, getDecimalCount } from 'utils/numbers'
import Decimal from 'decimal.js'
import { ChartTradeType } from 'types'
import { useTranslation } from 'next-i18next'
import { Serum3Market } from '@blockworks-foundation/mango-v4'

const RecentTrades = () => {
  const { t } = useTranslation(['common', 'trade'])
  const [trades, setTrades] = useState<any[]>([])
  const selectedMarket = mangoStore((s) => s.selectedMarket.current)

  const market = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !selectedMarket) return

    if (selectedMarket instanceof Serum3Market) {
      return group?.getSerum3ExternalMarket(selectedMarket.serumMarketExternal)
    } else {
      return selectedMarket
    }
  }, [selectedMarket])

  const baseSymbol = useMemo(() => {
    return selectedMarket?.name.split('/')[0]
  }, [selectedMarket])

  const quoteSymbol = useMemo(() => {
    return selectedMarket?.name.split('/')[1]
  }, [selectedMarket])

  const fetchTradesForChart = useCallback(async () => {
    if (!market) return

    try {
      const response = await fetch(
        `https://event-history-api-candles.herokuapp.com/trades/address/${market.publicKey}`
      )
      const parsedResp = await response.json()
      const newTrades = parsedResp.data
      if (!newTrades) return null

      if (newTrades.length && trades.length === 0) {
        setTrades(newTrades)
      } else if (newTrades?.length && !isEqual(newTrades[0], trades[0])) {
        setTrades(newTrades)
      }
    } catch (e) {
      console.error('Unable to fetch recent trades', e)
    }
  }, [market, trades])

  useEffect(() => {
    if (CLUSTER === 'mainnet-beta') {
      fetchTradesForChart()
    }
  }, [fetchTradesForChart])

  useInterval(async () => {
    if (CLUSTER === 'mainnet-beta') {
      fetchTradesForChart()
    }
  }, 5000)
  return (
    <div className="thin-scroll h-full overflow-y-scroll px-2">
      <table className="min-w-full">
        <thead>
          <tr className="text-right text-xxs text-th-fgd-4">
            <th className="py-2 font-normal">{`${t(
              'price'
            )} (${quoteSymbol})`}</th>
            <th className="py-2 font-normal">
              {t('trade:size')} ({baseSymbol})
            </th>
            <th className="py-2 font-normal">{t('time')}</th>
          </tr>
        </thead>
        <tbody>
          {!!trades.length &&
            trades.map((trade: ChartTradeType, i: number) => {
              const formattedPrice = market?.tickSize
                ? floorToDecimal(trade.price, getDecimalCount(market.tickSize))
                : new Decimal(trade?.price || 0)

              const formattedSize = market?.minOrderSize
                ? floorToDecimal(
                    trade.size,
                    getDecimalCount(market.minOrderSize)
                  )
                : new Decimal(trade?.size || 0)
              return (
                <tr className="font-mono text-xs" key={i}>
                  <td
                    className={`pb-1.5 text-right ${
                      trade.side === 'buy' ? `text-th-green` : `text-th-red`
                    }`}
                  >
                    {formattedPrice.toFixed()}
                  </td>
                  <td className="pb-1.5 text-right">
                    {formattedSize.toFixed()}
                  </td>
                  <td className="pb-1.5 text-right text-th-fgd-4">
                    {trade.time && new Date(trade.time).toLocaleTimeString()}
                  </td>
                </tr>
              )
            })}
        </tbody>
      </table>
    </div>
  )
}

export default RecentTrades
