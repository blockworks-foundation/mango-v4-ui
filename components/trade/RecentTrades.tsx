import useInterval from '@components/shared/useInterval'
import mangoStore, { CLUSTER } from '@store/mangoStore'
import { useCallback, useEffect, useMemo, useState } from 'react'
import isEqual from 'lodash/isEqual'
import { floorToDecimal, getDecimalCount } from 'utils/numbers'
import Decimal from 'decimal.js'
import { ChartTradeType } from 'types'
import { useTranslation } from 'next-i18next'

const RecentTrades = () => {
  const { t } = useTranslation('common')
  const [trades, setTrades] = useState<any[]>([])
  const selectedMarket = mangoStore((s) => s.selectedMarket.current)
  const selectedMarketPk = selectedMarket?.serumMarketExternal.toBase58()

  const serum3MarketExternal = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !selectedMarketPk) return
    return group.serum3MarketExternalsMap.get(selectedMarketPk)
  }, [selectedMarketPk])

  const baseSymbol = useMemo(() => {
    return selectedMarket?.name.split('/')[0]
  }, [selectedMarket])

  const quoteSymbol = useMemo(() => {
    return selectedMarket?.name.split('/')[1]
  }, [selectedMarket])

  const fetchTradesForChart = useCallback(async () => {
    if (!selectedMarketPk) return

    try {
      const response = await fetch(
        `https://event-history-api-candles.herokuapp.com/trades/address/${selectedMarketPk}`
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
  }, [selectedMarketPk, trades])

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
    <div className="h-full overflow-y-scroll ">
      <div className={`mb-1 grid grid-cols-3 px-4 pt-2 text-xxs text-th-fgd-4`}>
        <div className="text-right">{`${t('price')} (${quoteSymbol})`} </div>
        <div className={`text-right`}>
          {t('size')} ({baseSymbol})
        </div>
        <div className={`text-right`}>{t('time')}</div>
      </div>
      {!!trades.length && (
        <div className="px-4 font-mono text-xs">
          {trades.map((trade: ChartTradeType, i: number) => {
            const formattedPrice = serum3MarketExternal?.tickSize
              ? floorToDecimal(
                  trade.price,
                  getDecimalCount(serum3MarketExternal.tickSize)
                )
              : new Decimal(trade?.price || 0)

            const formattedSize = serum3MarketExternal?.minOrderSize
              ? floorToDecimal(
                  trade.size,
                  getDecimalCount(serum3MarketExternal.minOrderSize)
                )
              : new Decimal(trade?.size || 0)
            return (
              <div key={i} className={`grid grid-cols-3 leading-6`}>
                <div
                  className={`text-right ${
                    trade.side === 'buy' ? `text-th-green` : `text-th-red`
                  }`}
                >
                  {formattedPrice.toFixed()}
                </div>
                <div className={`text-right text-th-fgd-2`}>
                  {formattedSize.toFixed()}
                </div>
                <div className={`text-right text-th-fgd-4`}>
                  {trade.time && new Date(trade.time).toLocaleTimeString()}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default RecentTrades
