import useInterval from '@components/shared/useInterval'
import mangoStore from '@store/mangoStore'
import { useEffect, useMemo } from 'react'
import { formatNumericValue, getDecimalCount } from 'utils/numbers'
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
import dayjs from 'dayjs'

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
      if (previousFill.orderId?.toString() !== latestFill.orderId?.toString()) {
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

  const {
    selectedMarket,
    serumOrPerpMarket: market,
    baseSymbol,
    quoteSymbol,
  } = useSelectedMarket()

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

    const vol = fills.reduce(
      (a: { buys: number; sells: number }, c: any) => {
        if (c.side === 'buy' || c.takerSide === 1) {
          a.buys = a.buys + c.size
        } else {
          a.sells = a.sells + c.size
        }
        return a
      },
      { buys: 0, sells: 0 }
    )
    const totalVol = vol.buys + vol.sells
    return [vol.buys / totalVol, vol.sells / totalVol]
  }, [fills])

  return (
    <div className="thin-scroll h-full overflow-y-scroll">
      <div className="flex items-center justify-between border-b border-th-bkg-3 p-1 xl:px-2">
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
        <span className="text-xxs text-th-fgd-4 xl:text-xs">
          {t('trade:buys')}:{' '}
          <span className="text-th-up">{(buyRatio * 100).toFixed(1)}%</span>
          <span className="px-2">|</span>
          {t('trade:sells')}:{' '}
          <span className="text-th-down">{(sellRatio * 100).toFixed(1)}%</span>
        </span>
      </div>
      <div className="px-1 xl:px-2">
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
                  trade.side || (trade.takerSide === 0 ? 'bid' : 'ask')

                const formattedPrice =
                  market?.tickSize && trade.price
                    ? formatNumericValue(
                        trade.price,
                        getDecimalCount(market.tickSize)
                      )
                    : trade?.price || 0

                const formattedSize =
                  market?.minOrderSize && trade.size
                    ? formatNumericValue(
                        trade.size,
                        getDecimalCount(market.minOrderSize)
                      )
                    : trade?.size || 0

                return (
                  <tr className="font-mono text-xs" key={i}>
                    <td
                      className={`pb-1.5 text-right ${
                        ['buy', 'bid'].includes(side)
                          ? 'text-th-up'
                          : 'text-th-down'
                      }`}
                    >
                      {formattedPrice}
                    </td>
                    <td className="pb-1.5 text-right text-th-fgd-3">
                      {formattedSize}
                    </td>
                    <td className="pb-1.5 text-right text-th-fgd-4">
                      {trade.time
                        ? new Date(trade.time).toLocaleTimeString()
                        : trade.timestamp
                        ? dayjs(trade.timestamp.toNumber() * 1000).format(
                            'h:mma'
                          )
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
