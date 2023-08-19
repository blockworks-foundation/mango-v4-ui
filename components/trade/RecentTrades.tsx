import useInterval from '@components/shared/useInterval'
import mangoStore from '@store/mangoStore'
import { useEffect, useMemo, useState } from 'react'
import { formatNumericValue, getDecimalCount } from 'utils/numbers'
import { useTranslation } from 'next-i18next'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { Howl } from 'howler'
import useLocalStorageState from 'hooks/useLocalStorageState'
import {
  MANGO_DATA_API_URL,
  SOUND_SETTINGS_KEY,
  TRADE_VOLUME_ALERT_KEY,
} from 'utils/constants'
import { IconButton } from '@components/shared/Button'
import { BellAlertIcon, BellSlashIcon } from '@heroicons/react/20/solid'
import Tooltip from '@components/shared/Tooltip'
import { INITIAL_SOUND_SETTINGS } from '@components/settings/SoundSettings'
import TradeVolumeAlertModal, {
  DEFAULT_VOLUME_ALERT_SETTINGS,
} from '@components/modals/TradeVolumeAlertModal'
import dayjs from 'dayjs'
import ErrorBoundary from '@components/ErrorBoundary'
import { useQuery } from '@tanstack/react-query'
import { PerpMarket } from '@blockworks-foundation/mango-v4'
import { EmptyObject, isPerpFillEvent, PerpTradeHistory } from 'types'
import { Market } from '@project-serum/serum'

const volumeAlertSound = new Howl({
  src: ['/sounds/trade-buy.mp3'],
  volume: 0.8,
})

type Test = { buys: number; sells: number }

const formatPrice = (
  market: Market | PerpMarket | undefined,
  price: number | string,
) => {
  return market?.tickSize
    ? formatNumericValue(price, getDecimalCount(market.tickSize))
    : 0
}

const formatSize = (
  market: Market | PerpMarket | undefined,
  size: number | string,
) => {
  return market?.minOrderSize
    ? formatNumericValue(size, getDecimalCount(market.minOrderSize))
    : 0
}

const fetchMarketTradeHistory = async (marketAddress: string) => {
  const response = await fetch(
    `${MANGO_DATA_API_URL}/stats/perp-market-history?perp-market=${marketAddress}`,
  )
  return response.json()
}

const RecentTrades = () => {
  const { t } = useTranslation(['common', 'trade'])
  const fills = mangoStore((s) => s.selectedMarket.fills)
  const [latestFillId, setLatestFillId] = useState('')
  const [soundSettings] = useLocalStorageState(
    SOUND_SETTINGS_KEY,
    INITIAL_SOUND_SETTINGS,
  )
  const [alertSettings] = useLocalStorageState(
    TRADE_VOLUME_ALERT_KEY,
    DEFAULT_VOLUME_ALERT_SETTINGS,
  )
  const [showVolumeAlertModal, setShowVolumeAlertModal] = useState(false)

  const {
    selectedMarket,
    serumOrPerpMarket: market,
    baseSymbol,
    quoteBank,
    quoteSymbol,
    selectedMarketAddress,
  } = useSelectedMarket()

  const perpMarketQuery = useQuery<PerpTradeHistory[] | EmptyObject>(
    ['market-trade-history', selectedMarketAddress],
    () => fetchMarketTradeHistory(selectedMarketAddress!),
    {
      cacheTime: 1000 * 60 * 15,
      staleTime: 0,
      enabled: !!selectedMarketAddress && market instanceof PerpMarket,
      refetchOnWindowFocus: true,
      refetchInterval: 1000 * 10,
    },
  )

  useEffect(() => {
    const actions = mangoStore.getState().actions
    if (selectedMarket) {
      actions.loadMarketFills()
    }
  }, [selectedMarket])

  useEffect(() => {
    if (!fills.length) return
    const latesetFill = fills[0]
    if (!latestFillId) {
      const fillId = isPerpFillEvent(latesetFill)
        ? latesetFill.takerClientOrderId
        : latesetFill.orderId
      setLatestFillId(fillId.toString())
    }
  }, [fills])

  useInterval(() => {
    const latesetFill = fills[0]
    if (!soundSettings['recent-trades'] || !quoteBank || !latesetFill) return
    const fillId = isPerpFillEvent(latesetFill)
      ? latesetFill.takerClientOrderId
      : latesetFill.orderId
    setLatestFillId(fillId.toString())
    const fillsLimitIndex = fills.findIndex((f) => {
      const id = isPerpFillEvent(f) ? f.takerClientOrderId : f.orderId
      return id.toString() === fillId.toString()
    })
    const newFillsVolumeValue = fills
      .slice(0, fillsLimitIndex)
      .reduce((a, c) => {
        const size = isPerpFillEvent(c) ? c.quantity : c.size
        return a + size * c.price
      }, 0)
    if (newFillsVolumeValue * quoteBank.uiPrice > Number(alertSettings.value)) {
      volumeAlertSound.play()
    }
  }, alertSettings.seconds * 1000)

  const [buyRatio, sellRatio] = useMemo(() => {
    if (!fills.length) return [0, 0]

    const vol = fills.reduce(
      (acc: Test, fill) => {
        let side
        let size
        if (isPerpFillEvent(fill)) {
          side = fill.takerSide === 0 ? 'buy' : 'sell'
          size = fill.quantity
        } else {
          side = fill.side
          size = fill.size
        }
        if (side === 'buy') {
          acc.buys = acc.buys + size
        } else {
          acc.sells = acc.sells + size
        }
        return acc
      },
      { buys: 0, sells: 0 },
    )
    const totalVol = vol.buys + vol.sells
    return [vol.buys / totalVol, vol.sells / totalVol]
  }, [fills])

  return (
    <ErrorBoundary>
      <div className="hide-scroll h-full overflow-y-scroll">
        <div className="flex items-center justify-between border-b border-th-bkg-3 py-1 pl-0 pr-2">
          <Tooltip
            className="hidden md:block"
            content={t('trade:tooltip-volume-alert')}
            delay={100}
          >
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
          <span className="text-xxs text-th-fgd-4 xl:text-xs">
            {t('trade:buys')}:{' '}
            <span className="text-th-up">{(buyRatio * 100).toFixed(1)}%</span>
            <span className="px-2">|</span>
            {t('trade:sells')}:{' '}
            <span className="text-th-down">
              {(sellRatio * 100).toFixed(1)}%
            </span>
          </span>
        </div>
        <div className="pl-0 pr-2">
          <table className="min-w-full">
            <thead>
              <tr className="text-right text-xxs text-th-fgd-4">
                <th className="py-2 font-normal">{`${t(
                  'price',
                )} (${quoteSymbol})`}</th>
                <th className="py-2 font-normal">
                  {t('trade:size')} ({baseSymbol})
                </th>
                <th className="py-2 font-normal">{t('time')}</th>
              </tr>
            </thead>
            <tbody>
              {selectedMarket instanceof PerpMarket
                ? perpMarketQuery?.data &&
                  Array.isArray(perpMarketQuery?.data) &&
                  perpMarketQuery?.data.map((t) => {
                    return (
                      <tr className="font-mono text-xs" key={`${t.seq_num}`}>
                        <td
                          className={`pb-1.5 text-right tracking-tight ${
                            ['buy', 'bid'].includes(t.taker_side)
                              ? 'text-th-up'
                              : 'text-th-down'
                          }`}
                        >
                          {formatPrice(market, t.price)}
                        </td>
                        <td className="pb-1.5 text-right tracking-normal text-th-fgd-3">
                          {formatSize(market, t.quantity)}
                        </td>
                        <td className="pb-1.5 text-right tracking-tight text-th-fgd-4">
                          {t.block_datetime ? (
                            <Tooltip
                              placement="right"
                              content={new Date(
                                t.block_datetime,
                              ).toLocaleDateString()}
                            >
                              {new Date(t.block_datetime).toLocaleTimeString()}
                            </Tooltip>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    )
                  })
                : !!fills.length &&
                  fills.map((trade, i: number) => {
                    let side
                    let size
                    let time
                    if (isPerpFillEvent(trade)) {
                      side = trade.takerSide === 0 ? 'bid' : 'ask'
                      size = trade.quantity
                      time = trade.timestamp.toString()
                    } else {
                      side = trade.side
                      size = trade.size
                      time = ''
                    }

                    const formattedPrice = formatPrice(market, trade.price)

                    const formattedSize = formatSize(market, size)

                    return (
                      <tr className="font-mono text-xs" key={i}>
                        <td
                          className={`pb-1.5 text-right tracking-tight ${
                            ['buy', 'bid'].includes(side)
                              ? 'text-th-up'
                              : 'text-th-down'
                          }`}
                        >
                          {formattedPrice}
                        </td>
                        <td className="pb-1.5 text-right tracking-normal text-th-fgd-3">
                          {formattedSize}
                        </td>
                        <td className="pb-1.5 text-right tracking-tight text-th-fgd-4">
                          {time
                            ? dayjs(Number(time) * 1000).format('hh:mma')
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
    </ErrorBoundary>
  )
}

export default RecentTrades
