import useInterval from '@components/shared/useInterval'
import mangoStore from '@store/mangoStore'
import { useEffect, useMemo, useState } from 'react'
import { floorToDecimal, getDecimalCount } from 'utils/numbers'
import Decimal from 'decimal.js'
import { ChartTradeType } from 'types'
import { useTranslation } from 'next-i18next'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { Howl } from 'howler'
import { IconButton } from '@components/shared/Button'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { SOUND_SETTINGS_KEY, TRADE_VOLUME_ALERT_KEY } from 'utils/constants'
import { BellAlertIcon, BellSlashIcon } from '@heroicons/react/20/solid'
import Tooltip from '@components/shared/Tooltip'
import { INITIAL_SOUND_SETTINGS } from '@components/settings/SoundSettings'
import TradeVolumeAlertModal, {
  DEFAULT_VOLUME_ALERT_SETTINGS,
} from '@components/modals/TradeVolumeAlertModal'
import dayjs from 'dayjs'

const volumeAlertSound = new Howl({
  src: ['/sounds/trade-buy.mp3'],
  volume: 0.8,
})

const RecentTrades = () => {
  const { t } = useTranslation(['common', 'trade'])
  const fills = mangoStore((s) => s.selectedMarket.fills)
  const [latestFillId, setLatestFillId] = useState('')
  const [soundSettings] = useLocalStorageState(
    SOUND_SETTINGS_KEY,
    INITIAL_SOUND_SETTINGS
  )
  const [alertSettings] = useLocalStorageState(
    TRADE_VOLUME_ALERT_KEY,
    DEFAULT_VOLUME_ALERT_SETTINGS
  )
  const [showVolumeAlertModal, setShowVolumeAlertModal] = useState(false)

  const {
    selectedMarket,
    serumOrPerpMarket: market,
    baseSymbol,
    quoteBank,
    quoteSymbol,
  } = useSelectedMarket()

  useEffect(() => {
    if (!fills.length) return
    if (!latestFillId) {
      setLatestFillId(fills[0].orderId.toString())
    }
  }, [fills])

  useInterval(() => {
    if (!soundSettings['recent-trades'] || !quoteBank) return
    setLatestFillId(fills[0].orderId.toString())
    const fillsLimitIndex = fills.findIndex(
      (f) => f.orderId.toString() === latestFillId
    )
    const newFillsVolumeValue = fills
      .slice(0, fillsLimitIndex)
      .reduce((a, c) => a + c.size * c.price, 0)
    if (newFillsVolumeValue * quoteBank.uiPrice > Number(alertSettings.value)) {
      volumeAlertSound.play()
    }
  }, alertSettings.seconds * 1000)

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
    <>
      <div className="thin-scroll h-full overflow-y-scroll">
        <div className="flex items-center justify-between border-b border-th-bkg-3 py-1 px-2">
          <Tooltip content={t('trade:tooltip-volume-alert')} delay={250}>
            <IconButton
              onClick={() => setShowVolumeAlertModal(true)}
              size="small"
              hideBg
            >
              {soundSettings['recent-trades'] ? (
                <BellAlertIcon className="h-4 w-4 text-th-fgd-3" />
              ) : (
                <BellSlashIcon className="h-4 w-4 text-th-fgd-3" />
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
                    trade.side || (trade.takerSide === 0 ? 'bid' : 'ask')

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
                          ? dayjs(trade.timestamp.toNumber() * 1000).format(
                              'hh:mma'
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
      {showVolumeAlertModal ? (
        <TradeVolumeAlertModal
          isOpen={showVolumeAlertModal}
          onClose={() => setShowVolumeAlertModal(false)}
        />
      ) : null}
    </>
  )
}

export default RecentTrades
