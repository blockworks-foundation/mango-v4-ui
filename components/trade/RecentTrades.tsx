import useInterval from '@components/shared/useInterval'
import mangoStore from '@store/mangoStore'
import { useEffect, useMemo } from 'react'
// import isEqual from 'lodash/isEqual'
import { floorToDecimal, getDecimalCount } from 'utils/numbers'
import Decimal from 'decimal.js'
import { ChartTradeType } from 'types'
import { useTranslation } from 'next-i18next'
import useSelectedMarket from 'hooks/useSelectedMarket'
import usePrevious from '@components/shared/usePrevious'
import { Howl } from 'howler'
import { IconButton } from '@components/shared/Button'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { SOUND_SETTINGS_KEY } from 'utils/constants'
import { INITIAL_SOUND_SETTINGS } from 'pages/settings'
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/20/solid'
import Tooltip from '@components/shared/Tooltip'

const RecentTrades = () => {
  // const [trades, setTrades] = useState<any[]>([])
  const { t } = useTranslation(['common', 'trade'])
  const fills = mangoStore((s) => s.selectedMarket.fills)
  const [soundSettings, setSoundSettings] = useLocalStorageState(
    SOUND_SETTINGS_KEY,
    INITIAL_SOUND_SETTINGS
  )
  const previousLatestFill = usePrevious(fills[0])
  const buySound = new Howl({
    src: ['/sounds/trade-buy.mp3'],
    volume: 0.5,
  })
  const sellSound = new Howl({
    src: ['/sounds/trade-sell.mp3'],
    volume: 0.5,
  })

  const { selectedMarket, serumOrPerpMarket: market } = useSelectedMarket()

  const baseSymbol = useMemo(() => {
    return selectedMarket?.name.split(/-|\//)[0]
  }, [selectedMarket])

  const quoteSymbol = useMemo(() => {
    return selectedMarket?.name.split(/-|\//)[1]
  }, [selectedMarket])

  // not sure if this works properly yet
  useEffect(() => {
    if (!fills.length || !previousLatestFill) return
    if (
      !fills[0].orderId.eq(previousLatestFill.orderId) &&
      fills[0].openOrdersSlot === previousLatestFill.openOrdersSlot
    ) {
      if (soundSettings['recent-trades']) {
        fills[0].side === 'buy' ? buySound.play() : sellSound.play()
      }
    }
  }, [fills, previousLatestFill])

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

  return (
    <div className="thin-scroll h-full overflow-y-scroll">
      <div className="flex justify-end border-b border-th-bkg-3 px-2 py-1">
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
              {/* <th className="py-2 font-normal">{t('time')}</th> */}
            </tr>
          </thead>
          <tbody>
            {!!fills.length &&
              fills.map((trade: ChartTradeType, i: number) => {
                const side = trade.side || Object.keys(trade.takerSide)[0]

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
                          ? `text-th-green`
                          : `text-th-red`
                      }`}
                    >
                      {formattedPrice.toFixed()}
                    </td>
                    <td className="pb-1.5 text-right">
                      {formattedSize.toFixed()}
                    </td>
                    {/* <td className="pb-1.5 text-right text-th-fgd-4">
                    {trade.time && new Date(trade.time).toLocaleTimeString()}
                  </td> */}
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
