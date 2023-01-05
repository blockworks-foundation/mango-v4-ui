import useInterval from '@components/shared/useInterval'
import mangoStore from '@store/mangoStore'
import { useEffect, useMemo } from 'react'
import { floorToDecimal, getDecimalCount } from 'utils/numbers'
import Decimal from 'decimal.js'
import { ChartTradeType } from 'types'
import { useTranslation } from 'next-i18next'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { Howl } from 'howler'
import { IconButton } from '@components/shared/Button'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { SOUND_SETTINGS_KEY } from 'utils/constants'
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/20/solid'
import Tooltip from '@components/shared/Tooltip'
import { INITIAL_SOUND_SETTINGS } from '@components/settings/SoundSettings'
import usePrevious from '@components/shared/usePrevious'

const buySound = new Howl({
  src: ['/sounds/trade-buy.mp3'],
  volume: 0.5,
})
const sellSound = new Howl({
  src: ['/sounds/trade-sell.mp3'],
  volume: 0.5,
})

const RecentTrades = () => {
  const { t } = useTranslation(['common', 'trade'])
  const fills = mangoStore((s) => s.selectedMarket.fills)
  const [soundSettings, setSoundSettings] = useLocalStorageState(
    SOUND_SETTINGS_KEY,
    INITIAL_SOUND_SETTINGS
  )
  const previousFills = usePrevious(fills)

  useEffect(() => {
    if (!soundSettings['recent-trades']) return
    if (fills.length && previousFills && previousFills.length) {
      const latestFill: ChartTradeType = fills[0]
      const previousFill: ChartTradeType = previousFills[0]
      if (previousFill.orderId.toString() !== latestFill.orderId.toString()) {
        const side =
          latestFill.side || (latestFill.takerSide === 1 ? 'bid' : 'ask')
        if (['buy', 'bid'].includes(side)) {
          buySound.play()
        } else {
          sellSound.play()
        }
      }
    }
  }, [fills, previousFills, soundSettings])

  const { selectedMarket, serumOrPerpMarket: market } = useSelectedMarket()

  const baseSymbol = useMemo(() => {
    return selectedMarket?.name.split(/-|\//)[0]
  }, [selectedMarket])

  const quoteSymbol = useMemo(() => {
    return selectedMarket?.name.split(/-|\//)[1]
  }, [selectedMarket])

  // const fetchRecentTrades = useCallback(async () => {
  //   if (!market) return

  //   try {
  //     const response = await fetch(
  //       `https://event-history-api-candles.herokuapp.com/trades/address/${market.publicKey}`
  //     )
  //     const parsedResp = await response.json()
  //     const newTrades = parsedResp.data
  //     if (!newTrades) return null

  //     if (newTrades.length && trades.length === 0) {
  //       setTrades(newTrades)
  //     } else if (newTrades?.length && !isEqual(newTrades[0], trades[0])) {
  //       setTrades(newTrades)
  //     }
  //   } catch (e) {
  //     console.error('Unable to fetch recent trades', e)
  //   }
  // }, [market, trades])

  useEffect(() => {
    // if (CLUSTER === 'mainnet-beta') {
    //   fetchRecentTrades()
    // }
    const actions = mangoStore.getState().actions
    actions.loadMarketFills()
  }, [selectedMarket])

  useInterval(async () => {
    // if (CLUSTER === 'mainnet-beta') {
    //   fetchRecentTrades()
    // }
    const actions = mangoStore.getState().actions
    actions.loadMarketFills()
  }, 5000)

  const [buyRatio, sellRatio] = useMemo(() => {
    if (!fills.length) return [0, 0]
    const total = fills.length
    const buys = fills.filter(
      (f: any) => (f.side && f.side === 'buy') || f.takerSide === 1
    ).length
    const sells = total - buys
    return [buys / total, sells / total]
  }, [fills])

  return (
    <div className="thin-scroll h-full overflow-y-scroll">
      <div className="flex items-center justify-between border-b border-th-bkg-3 py-1 px-2">
        <Tooltip content={t('trade:trade-sounds-tooltip')} delay={250}>
          <IconButton
            onClick={() =>
              setSoundSettings({
                ...soundSettings,
                'recent-trades': !soundSettings['recent-trades'],
              })
            }
            size="small"
            hideBg
          >
            {soundSettings['recent-trades'] ? (
              <SpeakerWaveIcon className="h-4 w-4 text-th-fgd-3" />
            ) : (
              <SpeakerXMarkIcon className="h-4 w-4 text-th-fgd-3" />
            )}
          </IconButton>
        </Tooltip>
        <span className="text-xs text-th-fgd-4">
          {t('trade:buys')}:{' '}
          <span className="font-mono text-th-up">
            {(buyRatio * 100).toFixed(1)}%
          </span>
          <span className="px-2">|</span>
          {t('trade:sells')}:{' '}
          <span className="font-mono text-th-down">
            {(sellRatio * 100).toFixed(1)}%
          </span>
        </span>
      </div>
      <div className="px-2">
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
            {!!fills.length &&
              fills.map((trade: ChartTradeType, i: number) => {
                const side =
                  trade.side || (trade.takerSide === 1 ? 'bid' : 'ask')

                // const price =
                // typeof trade.price === 'number'
                //   ? trade.price
                //   : trade.price.toNumber()
                const formattedPrice = market?.tickSize
                  ? floorToDecimal(
                      trade.price,
                      getDecimalCount(market.tickSize)
                    )
                  : new Decimal(trade?.price || 0)

                // const size = trade?.quantity?.toNumber() || trade?.size
                const formattedSize =
                  market?.minOrderSize && trade.size
                    ? floorToDecimal(
                        trade.size,
                        getDecimalCount(market.minOrderSize)
                      )
                    : new Decimal(trade.size || 0)

                return (
                  <tr className="font-mono text-xs" key={i}>
                    <td
                      className={`pb-1.5 text-right ${
                        ['buy', 'bid'].includes(side)
                          ? 'text-th-up'
                          : 'text-th-down'
                      }`}
                    >
                      {formattedPrice.toFixed()}
                    </td>
                    <td className="pb-1.5 text-right">
                      {formattedSize.toFixed()}
                    </td>
                    <td className="pb-1.5 text-right text-th-fgd-4">
                      {trade.time
                        ? new Date(trade.time).toLocaleTimeString()
                        : trade.timestamp
                        ? new Date(
                            trade.timestamp.toNumber()
                          ).toLocaleTimeString()
                        : '-'}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RecentTrades
