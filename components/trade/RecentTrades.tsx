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
    <>
      <div className={`mb-2 grid grid-cols-3 text-xs text-th-fgd-4`}>
        <div>{`${t('price')} (${quoteSymbol})`} </div>
        <div className={`text-right`}>
          {t('size')} ({baseSymbol})
        </div>
        <div className={`text-right`}>{t('time')}</div>
      </div>
      {!!trades.length && (
        <div className="text-xs">
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
                  className={`${
                    trade.side === 'buy' ? `text-th-green` : `text-th-red`
                  }`}
                >
                  {formattedPrice.toFixed()}
                </div>
                <div className={`text-right text-th-fgd-3`}>
                  {formattedSize.toFixed()}
                </div>
                <div className={`text-right text-th-fgd-3`}>
                  {trade.time && new Date(trade.time).toLocaleTimeString()}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

export default RecentTrades
