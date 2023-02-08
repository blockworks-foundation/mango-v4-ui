import { useEffect, useRef, useMemo, useState, useCallback } from 'react'
import { useTheme } from 'next-themes'
import {
  widget,
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
  ResolutionString,
  IOrderLineAdapter,
} from '@public/charting_library'
import mangoStore from '@store/mangoStore'
import { useViewport } from 'hooks/useViewport'
import {
  CHART_DATA_FEED,
  DEFAULT_MARKET_NAME,
  SHOW_ORDER_LINES_KEY,
} from 'utils/constants'
import { breakpoints } from 'utils/theme'
import { COLORS } from 'styles/colors'
import Datafeed from 'apis/birdeye/datafeed'
import { useTranslation } from 'next-i18next'
import { notify } from 'utils/notifications'
import {
  PerpMarket,
  PerpOrder,
  PerpOrderType,
  Serum3Market,
  Serum3OrderType,
  Serum3SelfTradeBehavior,
  Serum3Side,
} from '@blockworks-foundation/mango-v4'
import { Order } from '@project-serum/serum/lib/market'
import { PublicKey } from '@solana/web3.js'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { formatNumericValue, getDecimalCount } from 'utils/numbers'
import { BN } from '@project-serum/anchor'

export interface ChartContainerProps {
  container: ChartingLibraryWidgetOptions['container']
  symbol: ChartingLibraryWidgetOptions['symbol']
  interval: ChartingLibraryWidgetOptions['interval']
  datafeedUrl: string
  libraryPath: ChartingLibraryWidgetOptions['library_path']
  chartsStorageUrl: ChartingLibraryWidgetOptions['charts_storage_url']
  chartsStorageApiVersion: ChartingLibraryWidgetOptions['charts_storage_api_version']
  clientId: ChartingLibraryWidgetOptions['client_id']
  userId: ChartingLibraryWidgetOptions['user_id']
  fullscreen: ChartingLibraryWidgetOptions['fullscreen']
  autosize: ChartingLibraryWidgetOptions['autosize']
  studiesOverrides: ChartingLibraryWidgetOptions['studies_overrides']
  theme: string
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
        result[3],
        16
      )})`
    : null
}

const TradingViewChart = () => {
  const { t } = useTranslation(['tv-chart', 'trade'])
  const { theme } = useTheme()
  const { width } = useViewport()
  const [chartReady, setChartReady] = useState(false)
  const [spotOrPerp, setSpotOrPerp] = useState('spot')
  const [showOrderLinesLocalStorage, toggleShowOrderLinesLocalStorage] =
    useLocalStorageState(SHOW_ORDER_LINES_KEY, true)
  const [showOrderLines, toggleShowOrderLines] = useState(
    showOrderLinesLocalStorage
  )
  const selectedMarketName = mangoStore((s) => s.selectedMarket.current?.name)
  const isMobile = width ? width < breakpoints.sm : false

  const defaultProps = useMemo(
    () => ({
      symbol: DEFAULT_MARKET_NAME,
      interval: '60' as ResolutionString,
      theme: 'Dark',
      container: 'tv_chart_container',
      datafeedUrl: CHART_DATA_FEED,
      libraryPath: '/charting_library/',
      fullscreen: false,
      autosize: true,
      studiesOverrides: {
        'volume.volume.color.0': COLORS.DOWN[theme],
        'volume.volume.color.1': COLORS.UP[theme],
        'volume.precision': 4,
      },
    }),
    [theme]
  )

  const tvWidgetRef = useRef<IChartingLibraryWidget | null>(null)

  let chartStyleOverrides = {
    'paneProperties.background': 'rgba(0,0,0,0)',
    'paneProperties.backgroundType': 'solid',
    'paneProperties.legendProperties.showBackground': false,
    'paneProperties.vertGridProperties.color': 'rgba(0,0,0,0)',
    'paneProperties.horzGridProperties.color': 'rgba(0,0,0,0)',
    'paneProperties.legendProperties.showStudyTitles': false,
    'scalesProperties.showStudyLastValue': false,
    'scalesProperties.fontSize': 11,
  }

  const mainSeriesProperties = [
    'candleStyle',
    'hollowCandleStyle',
    'haStyle',
    'barStyle',
  ]

  mainSeriesProperties.forEach((prop) => {
    chartStyleOverrides = {
      ...chartStyleOverrides,
      [`mainSeriesProperties.${prop}.barColorsOnPrevClose`]: true,
      [`mainSeriesProperties.${prop}.drawWick`]: true,
      [`mainSeriesProperties.${prop}.drawBorder`]: true,
      [`mainSeriesProperties.${prop}.upColor`]: COLORS.UP[theme],
      [`mainSeriesProperties.${prop}.downColor`]: COLORS.DOWN[theme],
      [`mainSeriesProperties.${prop}.borderColor`]: COLORS.UP[theme],
      [`mainSeriesProperties.${prop}.borderUpColor`]: COLORS.UP[theme],
      [`mainSeriesProperties.${prop}.borderDownColor`]: COLORS.DOWN[theme],
      [`mainSeriesProperties.${prop}.wickUpColor`]: COLORS.UP[theme],
      [`mainSeriesProperties.${prop}.wickDownColor`]: COLORS.DOWN[theme],
    }
  })

  useEffect(() => {
    const group = mangoStore.getState().group
    if (tvWidgetRef.current && chartReady && selectedMarketName && group) {
      try {
        let symbolName
        if (!selectedMarketName.toLowerCase().includes('PERP')) {
          symbolName = group
            .getSerum3MarketByName(selectedMarketName)
            .serumMarketExternal.toString()
        } else {
          symbolName = selectedMarketName
        }
        tvWidgetRef.current.setSymbol(
          symbolName,
          tvWidgetRef.current.activeChart().resolution(),
          () => {
            return
          }
        )
      } catch (e) {
        console.warn('Trading View change symbol error: ', e)
      }
    }
  }, [selectedMarketName, chartReady, tvWidgetRef])

  useEffect(() => {
    if (
      selectedMarketName?.toLowerCase().includes('perp') &&
      spotOrPerp !== 'perp'
    ) {
      setSpotOrPerp('perp')
    } else if (
      !selectedMarketName?.toLowerCase().includes('perp') &&
      spotOrPerp !== 'spot'
    ) {
      setSpotOrPerp('spot')
    }
  }, [selectedMarketName, spotOrPerp])

  useEffect(() => {
    if (window) {
      // const tempBtcDatafeedUrl = 'https://dex-pyth-price-mainnet.zeta.markets/tv/history?symbol=BTC-USDC&resolution=5&from=1674427748&to=1674430748&countback=2'
      const tempBtcDatafeedUrl =
        'https://redirect-origin.mangomarkets.workers.dev'
      const btcDatafeed = new (window as any).Datafeeds.UDFCompatibleDatafeed(
        tempBtcDatafeedUrl
      )

      const widgetOptions: ChartingLibraryWidgetOptions = {
        // debug: true,
        symbol:
          spotOrPerp === 'spot'
            ? '8BnEgHoWFysVcuFFX7QztDmzuH8r5ZFvyP3sYwn1XTh6'
            : 'BTC-USDC',
        // BEWARE: no trailing slash is expected in feed URL
        // tslint:disable-next-line:no-any
        datafeed: spotOrPerp === 'spot' ? Datafeed : btcDatafeed,
        interval:
          defaultProps.interval as ChartingLibraryWidgetOptions['interval'],
        container:
          defaultProps.container as ChartingLibraryWidgetOptions['container'],
        library_path: defaultProps.libraryPath as string,
        locale: 'en',
        enabled_features: ['hide_left_toolbar_by_default'],
        disabled_features: [
          'use_localstorage_for_settings',
          'timeframes_toolbar',
          isMobile ? 'left_toolbar' : '',
          'show_logo_on_all_charts',
          'caption_buttons_text_if_possible',
          'header_settings',
          // 'header_chart_type',
          'header_compare',
          'compare_symbol',
          'header_screenshot',
          // 'header_widget_dom_node',
          // 'header_widget',
          'header_saveload',
          'header_undo_redo',
          'header_interval_dialog_button',
          'show_interval_dialog_on_key_press',
          'header_symbol_search',
          'popup_hints',
        ],
        fullscreen: defaultProps.fullscreen,
        autosize: defaultProps.autosize,
        studies_overrides: defaultProps.studiesOverrides,
        theme:
          theme === 'Light' || theme === 'Banana' || theme === 'Lychee'
            ? 'Light'
            : 'Dark',
        custom_css_url: '/styles/tradingview.css',
        loading_screen: {
          backgroundColor: COLORS.BKG1[theme],
        },
        overrides: {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

          ...chartStyleOverrides,
        },
      }

      const tvWidget = new widget(widgetOptions)
      tvWidgetRef.current = tvWidget

      tvWidgetRef.current.onChartReady(function () {
        createOLButton()
        if (showOrderLines) {
          const openOrders = mangoStore.getState().mangoAccount.openOrders
          deleteLines()
          drawLinesForMarket(openOrders)
        }
        setChartReady(true)
      })
      //eslint-disable-next-line
    }
  }, [theme, isMobile, defaultProps, spotOrPerp])

  const createOLButton = () => {
    const button = tvWidgetRef?.current?.createButton()
    if (!button) {
      return
    }
    button.textContent = 'OL'
    if (showOrderLinesLocalStorage) {
      button.style.color = COLORS.ACTIVE[theme]
    } else {
      button.style.color = COLORS.FGD4[theme]
    }
    button.setAttribute('title', t('tv-chart:toggle-order-line'))
    button.addEventListener('click', toggleOrderLines)
  }

  function toggleOrderLines(this: HTMLElement) {
    toggleShowOrderLines((prevState: boolean) => !prevState)
    if (this.style.color === hexToRgb(COLORS.ACTIVE[theme])) {
      deleteLines()
      this.style.color = COLORS.FGD4[theme]
    } else {
      const openOrders = mangoStore.getState().mangoAccount.openOrders
      drawLinesForMarket(openOrders)
      this.style.color = COLORS.ACTIVE[theme]
    }
  }

  useEffect(() => {
    if (showOrderLines !== showOrderLinesLocalStorage) {
      toggleShowOrderLinesLocalStorage(showOrderLines)
    }
  }, [showOrderLines])

  // update order lines if a user's open orders change
  useEffect(() => {
    let subscription
    if (chartReady && tvWidgetRef?.current) {
      subscription = mangoStore.subscribe(
        (state) => state.mangoAccount.openOrders,
        (openOrders) => {
          const orderLines = mangoStore.getState().tradingView.orderLines
          tvWidgetRef.current?.onChartReady(() => {
            let matchingOrderLines = 0
            let openOrdersForMarket = 0

            const oOrders = Object.entries(openOrders).map(
              ([marketPk, orders]) => ({
                orders,
                marketPk,
              })
            )

            for (const [key] of orderLines) {
              oOrders?.forEach(({ orders }) => {
                for (const order of orders) {
                  if (order.orderId == key) {
                    matchingOrderLines += 1
                  }
                }
              })
            }
            const selectedMarket = mangoStore.getState().selectedMarket.current
            const selectedMarketPk =
              selectedMarket instanceof Serum3Market
                ? selectedMarket?.serumMarketExternal.toString()
                : selectedMarket?.publicKey.toString()

            oOrders?.forEach(({ marketPk }) => {
              if (marketPk === selectedMarketPk) {
                openOrdersForMarket += 1
              }
            })

            tvWidgetRef.current?.activeChart().dataReady(() => {
              if (
                (showOrderLines &&
                  matchingOrderLines !== openOrdersForMarket) ||
                orderLines?.size != matchingOrderLines
              ) {
                deleteLines()
                drawLinesForMarket(openOrders)
              }
            })
          })
        }
      )
    }
    return subscription
  }, [chartReady, showOrderLines])

  const drawLinesForMarket = (
    openOrders: Record<string, Order[] | PerpOrder[]>
  ) => {
    const set = mangoStore.getState().set
    const newOrderLines = new Map()
    const oOrders = Object.entries(openOrders).map(([marketPk, orders]) => ({
      orders,
      marketPk,
    }))
    if (oOrders?.length) {
      const selectedMarket = mangoStore.getState().selectedMarket.current
      const selectedMarketPk =
        selectedMarket instanceof Serum3Market
          ? selectedMarket?.serumMarketExternal.toString()
          : selectedMarket?.publicKey.toString()
      for (const { orders, marketPk } of oOrders) {
        if (marketPk === selectedMarketPk) {
          for (const order of orders) {
            newOrderLines.set(order.orderId.toString(), drawLine(order))
          }
        }
      }
    }
    set((state) => {
      state.tradingView.orderLines = newOrderLines
    })
  }

  const deleteLines = () => {
    const set = mangoStore.getState().set
    const orderLines = mangoStore.getState().tradingView.orderLines
    if (orderLines.size > 0) {
      orderLines?.forEach((value: IOrderLineAdapter, key: string | BN) => {
        orderLines.get(key)?.remove()
      })

      set((state) => {
        state.tradingView.orderLines = new Map()
      })
    }
  }

  function getOrderDecimals() {
    const selectedMarket = mangoStore.getState().selectedMarket.current
    let minOrderDecimals = 4
    let tickSizeDecimals = 2
    if (!selectedMarket) return [minOrderDecimals, tickSizeDecimals]
    if (selectedMarket instanceof PerpMarket) {
      minOrderDecimals = getDecimalCount(selectedMarket.minOrderSize)
      tickSizeDecimals = getDecimalCount(selectedMarket.tickSize)
    } else {
      const group = mangoStore.getState().group
      const market = group?.getSerum3ExternalMarket(
        selectedMarket.serumMarketExternal
      )
      if (market) {
        minOrderDecimals = getDecimalCount(market.minOrderSize)
        tickSizeDecimals = getDecimalCount(market.tickSize)
      }
    }
    return [minOrderDecimals, tickSizeDecimals]
  }

  function drawLine(order: Order | PerpOrder) {
    const side =
      typeof order.side === 'string'
        ? t(order.side)
        : 'bid' in order.side
        ? t('trade:long')
        : t('trade:short')
    const isLong = side === 'buy' || side === 'long'
    const isShort = side === 'sell' || side === 'short'
    const [minOrderDecimals, tickSizeDecimals] = getOrderDecimals()
    const orderSizeUi: string = formatNumericValue(order.size, minOrderDecimals)
    if (!tvWidgetRef?.current?.chart()) return
    return (
      tvWidgetRef.current
        .chart()
        .createOrderLine({ disableUndo: false })
        .onMove(function (this: IOrderLineAdapter) {
          const currentOrderPrice = order.price
          const updatedOrderPrice = this.getPrice()
          const selectedMarketPrice =
            mangoStore.getState().selectedMarket.markPrice
          if (
            (isLong && updatedOrderPrice > 1.05 * selectedMarketPrice) ||
            (isShort && updatedOrderPrice < 0.95 * selectedMarketPrice)
          ) {
            tvWidgetRef.current?.showNoticeDialog({
              title: t('tv-chart:outside-range'),
              body:
                t('tv-chart:slippage-warning', {
                  updatedOrderPrice: updatedOrderPrice,
                  aboveBelow:
                    side == 'buy' || side === 'long' ? t('above') : t('below'),
                  selectedMarketPrice: selectedMarketPrice,
                }) +
                '<p><p>' +
                t('tv-chart:slippage-accept'),
              callback: () => {
                this.setPrice(currentOrderPrice)
              },
            })
          } else {
            tvWidgetRef.current?.showConfirmDialog({
              title: t('tv-chart:modify-order'),
              body: t('tv-chart:modify-order-details', {
                marketName: selectedMarketName,
                orderSize: orderSizeUi,
                orderSide: side.toUpperCase(),
                currentOrderPrice: formatNumericValue(
                  currentOrderPrice,
                  tickSizeDecimals
                ),
                updatedOrderPrice: formatNumericValue(
                  updatedOrderPrice,
                  tickSizeDecimals
                ),
              }),
              callback: (res) => {
                if (res) {
                  modifyOrder(order, updatedOrderPrice)
                } else {
                  this.setPrice(currentOrderPrice)
                }
              },
            })
          }
        })
        .onCancel(function () {
          tvWidgetRef.current?.showConfirmDialog({
            title: t('tv-chart:cancel-order'),
            body: t('tv-chart:cancel-order-details', {
              marketName: selectedMarketName,
              orderSize: orderSizeUi,
              orderSide: side.toUpperCase(),
              orderPrice: formatNumericValue(order.price, tickSizeDecimals),
            }),
            callback: (res) => {
              if (res) {
                if (order instanceof PerpOrder) {
                  cancelPerpOrder(order)
                } else {
                  cancelSpotOrder(order)
                }
              }
            },
          })
        })
        .setPrice(order.price)
        .setQuantity(orderSizeUi)
        .setText(side.toUpperCase())
        // .setTooltip(
        //   order.perpTrigger?.clientOrderId
        //     ? `${order.orderType} Order #: ${order.orderId}`
        //     : `Order #: ${order.orderId}`
        // )
        .setBodyTextColor(isLong ? COLORS.UP[theme] : COLORS.DOWN[theme])
        .setQuantityTextColor(isLong ? COLORS.UP[theme] : COLORS.DOWN[theme])
        .setCancelButtonIconColor(COLORS.FGD4[theme])
        .setBodyBorderColor(isLong ? COLORS.UP[theme] : COLORS.DOWN[theme])
        .setQuantityBorderColor(isLong ? COLORS.UP[theme] : COLORS.DOWN[theme])
        .setCancelButtonBorderColor(
          isLong ? COLORS.UP[theme] : COLORS.DOWN[theme]
        )
        .setBodyBackgroundColor(COLORS.BKG1[theme])
        .setQuantityBackgroundColor(COLORS.BKG1[theme])
        .setCancelButtonBackgroundColor(COLORS.BKG1[theme])
        .setLineColor(isLong ? COLORS.UP[theme] : COLORS.DOWN[theme])
        .setLineLength(3)
        .setLineWidth(1)
        .setLineStyle(1)
    )
  }

  const modifyOrder = useCallback(
    async (o: PerpOrder | Order, price: number) => {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const mangoAccount = mangoStore.getState().mangoAccount.current
      const actions = mangoStore.getState().actions
      const baseSize = o.size
      if (!group || !mangoAccount) return
      try {
        let tx = ''
        if (o instanceof PerpOrder) {
          tx = await client.modifyPerpOrder(
            group,
            mangoAccount,
            o.perpMarketIndex,
            o.orderId,
            o.side,
            price,
            Math.abs(baseSize),
            undefined, // maxQuoteQuantity
            Date.now(),
            PerpOrderType.limit,
            undefined,
            undefined
          )
        } else {
          const marketPk = findSerum3MarketPkInOpenOrders(o)
          if (!marketPk) return
          const market = group.getSerum3MarketByExternalMarket(
            new PublicKey(marketPk)
          )
          tx = await client.modifySerum3Order(
            group,
            o.orderId,
            mangoAccount,
            market.serumMarketExternal,
            o.side === 'buy' ? Serum3Side.bid : Serum3Side.ask,
            price,
            baseSize,
            Serum3SelfTradeBehavior.decrementTake,
            Serum3OrderType.limit,
            Date.now(),
            10
          )
        }
        actions.fetchOpenOrders()
        notify({
          type: 'success',
          title: 'Transaction successful',
          txid: tx,
        })
      } catch (e: any) {
        console.error('Error canceling', e)
        notify({
          title: 'Unable to modify order',
          description: e.message,
          txid: e.txid,
          type: 'error',
        })
      }
    },
    [t]
  )

  const cancelSpotOrder = useCallback(
    async (o: Order) => {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const mangoAccount = mangoStore.getState().mangoAccount.current
      const actions = mangoStore.getState().actions
      if (!group || !mangoAccount) return
      const marketPk = findSerum3MarketPkInOpenOrders(o)
      if (!marketPk) return
      const market = group.getSerum3MarketByExternalMarket(
        new PublicKey(marketPk)
      )
      try {
        const tx = await client.serum3CancelOrder(
          group,
          mangoAccount,
          market!.serumMarketExternal,
          o.side === 'buy' ? Serum3Side.bid : Serum3Side.ask,
          o.orderId
        )

        actions.fetchOpenOrders()
        notify({
          type: 'success',
          title: 'Transaction successful',
          txid: tx,
        })
      } catch (e: any) {
        console.error('Error canceling', e)
        notify({
          title: t('trade:cancel-order-error'),
          description: e.message,
          txid: e.txid,
          type: 'error',
        })
      }
    },
    [t]
  )

  const cancelPerpOrder = useCallback(
    async (o: PerpOrder) => {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const mangoAccount = mangoStore.getState().mangoAccount.current
      const actions = mangoStore.getState().actions
      if (!group || !mangoAccount) return
      try {
        const tx = await client.perpCancelOrder(
          group,
          mangoAccount,
          o.perpMarketIndex,
          o.orderId
        )
        actions.fetchOpenOrders()
        notify({
          type: 'success',
          title: 'Transaction successful',
          txid: tx,
        })
      } catch (e: any) {
        console.error('Error canceling', e)
        notify({
          title: t('trade:cancel-order-error'),
          description: e.message,
          txid: e.txid,
          type: 'error',
        })
      }
    },
    [t]
  )

  const findSerum3MarketPkInOpenOrders = (o: Order): string | undefined => {
    const openOrders = mangoStore.getState().mangoAccount.openOrders
    let foundedMarketPk: string | undefined = undefined
    for (const [marketPk, orders] of Object.entries(openOrders)) {
      for (const order of orders) {
        if (order.orderId.eq(o.orderId)) {
          foundedMarketPk = marketPk
          break
        }
      }
      if (foundedMarketPk) {
        break
      }
    }
    return foundedMarketPk
  }

  return (
    <div id={defaultProps.container as string} className="tradingview-chart" />
  )
}

export default TradingViewChart
