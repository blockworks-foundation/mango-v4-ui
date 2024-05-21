import {
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
  Fragment,
} from 'react'
import {
  widget,
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
  ResolutionString,
  IOrderLineAdapter,
  AvailableSaveloadVersions,
  IExecutionLineAdapter,
  Direction,
} from '@public/charting_library'
import mangoStore from '@store/mangoStore'
import { useViewport } from 'hooks/useViewport'
import { SHOW_ORDER_LINES_KEY, TV_USER_ID_KEY } from 'utils/constants'
import { COLORS } from 'styles/colors'
import { useTranslation } from 'next-i18next'
import { notify } from 'utils/notifications'
import {
  PerpMarket,
  PerpOrder,
  Serum3Market,
  Serum3Side,
  TokenConditionalSwap,
} from '@blockworks-foundation/mango-v4'
import { Order } from '@project-serum/serum/lib/market'
import { PublicKey } from '@solana/web3.js'
import useLocalStorageState from 'hooks/useLocalStorageState'
import {
  floorToDecimal,
  formatNumericValue,
  getDecimalCount,
} from 'utils/numbers'
import { BN } from '@coral-xyz/anchor'
import Datafeed from 'apis/datafeed'
// import PerpDatafeed from 'apis/mngo/datafeed'
import { CombinedTradeHistory, isMangoError } from 'types'
import { formatPrice } from 'apis/birdeye/helpers'
import useTradeHistory from 'hooks/useTradeHistory'
import dayjs from 'dayjs'
import ModifyTvOrderModal from '@components/modals/ModifyTvOrderModal'
import { findSerum3MarketPkInOpenOrders } from './OpenOrders'
import { Transition } from '@headlessui/react'
import useThemeWrapper from 'hooks/useThemeWrapper'
import { handleCancelTriggerOrder } from '@components/swap/SwapTriggerOrders'
import useAnalytics from 'hooks/useAnalytics'

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
        16,
      )})`
    : null
}

const getTriggerOrders = () => {
  const mangoAccount = mangoStore.getState().mangoAccount.current
  if (!mangoAccount) return []
  const triggerOrders = mangoAccount.tokenConditionalSwaps.filter(
    (tcs) => tcs.isConfigured,
  )
  return triggerOrders
}

const TradingViewChart = () => {
  const { t } = useTranslation(['common', 'tv-chart', 'trade'])
  const { theme } = useThemeWrapper()
  const { isMobile } = useViewport()
  const [chartReady, setChartReady] = useState(false)
  const [orderToModify, setOrderToModify] = useState<Order | PerpOrder | null>(
    null,
  )

  const { sendAnalytics } = useAnalytics()
  const [modifiedPrice, setModifiedPrice] = useState('')
  const [showOrderLinesLocalStorage, toggleShowOrderLinesLocalStorage] =
    useLocalStorageState(SHOW_ORDER_LINES_KEY, true)
  const [showOrderLines, toggleShowOrderLines] = useState(
    showOrderLinesLocalStorage,
  )
  const tradeExecutions = mangoStore((s) => s.tradingView.tradeExecutions)
  const themeData = mangoStore((s) => s.themeData)
  const { data: combinedTradeHistory, isLoading: loadingTradeHistory } =
    useTradeHistory()
  const [showTradeExecutions, toggleShowTradeExecutions] = useState(false)
  const [showThemeEasterEgg, toggleShowThemeEasterEgg] = useState(false)
  const [cachedTradeHistory, setCachedTradeHistory] =
    useState(combinedTradeHistory)
  const [userId] = useLocalStorageState(TV_USER_ID_KEY, '')
  const selectedMarketName = mangoStore((s) => s.selectedMarket.current?.name)

  const defaultProps = useMemo(() => {
    const initialMktName = mangoStore.getState().selectedMarket.current?.name
    return {
      symbol: initialMktName,
      interval: '60' as ResolutionString,
      theme: 'Dark',
      container: 'tv_chart_container',
      libraryPath: '/charting_library/',
      chartsStorageUrl: 'https://tv-backend-v4.herokuapp.com',
      chartsStorageApiVersion: '1.1' as AvailableSaveloadVersions,
      clientId: 'mango.markets',
      fullscreen: false,
      autosize: true,
      studiesOverrides: {
        'volume.volume.color.0': COLORS.DOWN[theme],
        'volume.volume.color.1': COLORS.UP[theme],
        'volume.precision': 4,
      },
    }
  }, [theme])

  const tvWidgetRef = useRef<IChartingLibraryWidget>()
  const orderLinesButtonRef = useRef<HTMLElement>()

  // Sets the "symbol" in trading view which is used to fetch chart data via the datafeed
  useEffect(() => {
    const group = mangoStore.getState().group
    let mktAddress = 'So11111111111111111111111111111111111111112'

    if (
      group &&
      selectedMarketName &&
      !selectedMarketName?.toLowerCase().includes('perp')
    ) {
      mktAddress = group
        .getSerum3MarketByName(selectedMarketName)
        .serumMarketExternal.toString()
    } else if (group && selectedMarketName) {
      mktAddress = group
        .getPerpMarketByName(selectedMarketName)
        .publicKey.toString()
    }

    if (tvWidgetRef.current && chartReady && mktAddress && group) {
      try {
        tvWidgetRef.current.setSymbol(
          mktAddress,
          tvWidgetRef.current.activeChart().resolution(),
          () => {
            if (showOrderLinesLocalStorage) {
              const { openOrders } = mangoStore.getState().mangoAccount
              deleteLines()
              const triggerOrders = getTriggerOrders()
              drawLinesForMarket(openOrders, triggerOrders)
            }
            return
          },
        )
      } catch (e) {
        console.warn('Trading View change symbol error: ', e)
      }
    }
  }, [chartReady, selectedMarketName, showOrderLinesLocalStorage])

  useEffect(() => {
    sendAnalytics({ selectedMarketName: selectedMarketName }, 'chart_page')
  }, [selectedMarketName, sendAnalytics])

  useEffect(() => {
    if (showOrderLines !== showOrderLinesLocalStorage) {
      toggleShowOrderLinesLocalStorage(showOrderLines)
    }
  }, [
    showOrderLines,
    showOrderLinesLocalStorage,
    toggleShowOrderLinesLocalStorage,
    theme,
  ])

  const deleteLines = useCallback(() => {
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
  }, [])

  const getOrderDecimals = useCallback(() => {
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
        selectedMarket.serumMarketExternal,
      )
      if (market) {
        minOrderDecimals = getDecimalCount(market.minOrderSize)
        tickSizeDecimals = getDecimalCount(market.tickSize)
      }
    }
    return [minOrderDecimals, tickSizeDecimals]
  }, [])

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
        new PublicKey(marketPk),
      )
      try {
        const tx = await client.serum3CancelOrder(
          group,
          mangoAccount,
          market!.serumMarketExternal,
          o.side === 'buy' ? Serum3Side.bid : Serum3Side.ask,
          o.orderId,
        )

        actions.fetchOpenOrders()
        notify({
          type: 'success',
          title: 'Transaction successful',
          txid: tx.signature,
        })
      } catch (e) {
        console.error('Error canceling', e)
        if (!isMangoError(e)) return
        notify({
          title: t('trade:cancel-order-error'),
          description: e.message,
          txid: e.txid,
          type: 'error',
        })
      }
    },
    [t, findSerum3MarketPkInOpenOrders],
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
          o.orderId,
        )
        actions.fetchOpenOrders()
        notify({
          type: 'success',
          title: 'Transaction successful',
          txid: tx.signature,
        })
      } catch (e) {
        console.error('Error canceling', e)
        if (!isMangoError(e)) return
        notify({
          title: t('trade:cancel-order-error'),
          description: e.message,
          txid: e.txid,
          type: 'error',
        })
      }
    },
    [t],
  )

  const drawLine = useCallback(
    (order: Order | PerpOrder) => {
      const side =
        typeof order.side === 'string'
          ? t(order.side)
          : 'bid' in order.side
          ? t('long')
          : t('short')
      const isLong =
        side.toLowerCase() === 'buy' || side.toLowerCase() === 'long'
      const isShort =
        side.toLowerCase() === 'sell' || side.toLowerCase() === 'short'
      const [minOrderDecimals, tickSizeDecimals] = getOrderDecimals()
      const orderSizeUi: string = formatNumericValue(
        order.size,
        minOrderDecimals,
      )
      const sideColor = isLong ? COLORS.UP[theme] : COLORS.DOWN[theme]
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
                      side == 'buy' || side === 'long'
                        ? t('above')
                        : t('below'),
                    selectedMarketPrice: selectedMarketPrice,
                  }) +
                  '<p><p>' +
                  t('tv-chart:slippage-accept'),
                callback: () => {
                  this.setPrice(currentOrderPrice)
                },
              })
            } else {
              setOrderToModify(order)
              setModifiedPrice(
                formatNumericValue(updatedOrderPrice, tickSizeDecimals),
              )
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
          .setBodyTextColor(sideColor)
          .setQuantityTextColor(sideColor)
          .setCancelButtonIconColor(COLORS.FGD4[theme])
          .setBodyBorderColor(sideColor)
          .setQuantityBorderColor(sideColor)
          .setCancelButtonBorderColor(sideColor)
          .setBodyBackgroundColor(COLORS.BKG1[theme])
          .setQuantityBackgroundColor(COLORS.BKG1[theme])
          .setCancelButtonBackgroundColor(COLORS.BKG1[theme])
          .setLineColor(sideColor)
          .setLineLength(3)
          .setLineWidth(1)
          .setLineStyle(1)
      )
    },
    [
      cancelPerpOrder,
      cancelSpotOrder,
      selectedMarketName,
      t,
      theme,
      getOrderDecimals,
    ],
  )

  const drawTriggerOrderLine = useCallback(
    (order: TokenConditionalSwap) => {
      const { group } = mangoStore.getState()
      const selectedMarket = mangoStore.getState().selectedMarket.current
      if (!group) return
      const buyBank = group.getFirstBankByTokenIndex(order.buyTokenIndex)
      const sellBank = group.getFirstBankByTokenIndex(order.sellTokenIndex)
      const maxBuy = floorToDecimal(
        order.getMaxBuyUi(group),
        buyBank.mintDecimals,
      ).toNumber()
      const maxSell = floorToDecimal(
        order.getMaxSellUi(group),
        sellBank.mintDecimals,
      ).toNumber()
      let side: string
      let orderSizeUi: number
      if (maxBuy === 0 || maxBuy > maxSell) {
        orderSizeUi = maxSell
        side = 'sell'
      } else {
        orderSizeUi = maxBuy
        side = 'buy'
      }
      const price = order.getThresholdPriceUi(group)
      const isReducingShort = side.toLowerCase() === 'buy'
      let orderType
      if (selectedMarket && selectedMarket instanceof Serum3Market) {
        const baseBank =
          selectedMarket.baseTokenIndex === buyBank.tokenIndex
            ? buyBank
            : sellBank
        const quoteBank =
          selectedMarket.quoteTokenIndex === buyBank.tokenIndex
            ? buyBank
            : sellBank
        const currentPrice = baseBank.uiPrice / quoteBank.uiPrice
        orderType =
          (isReducingShort && price > currentPrice) ||
          (!isReducingShort && price < currentPrice)
            ? t('trade:stop-loss')
            : t('trade:take-profit')
      }
      const [
        // minOrderDecimals,
        tickSizeDecimals,
      ] = getOrderDecimals()
      const sideColor = isReducingShort ? COLORS.UP[theme] : COLORS.DOWN[theme]

      if (!tvWidgetRef?.current?.chart()) return
      return (
        tvWidgetRef.current
          .chart()
          .createOrderLine({ disableUndo: false })
          .onMove(function (this: IOrderLineAdapter) {
            tvWidgetRef.current?.showNoticeDialog({
              title: 'Edit trigger order',
              body: 'Editing trigger orders is coming soon',
              callback: () => this.setPrice(price),
            })
          })
          .onCancel(function () {
            tvWidgetRef.current?.showConfirmDialog({
              title: t('tv-chart:cancel-order'),
              body: t('tv-chart:cancel-order-details', {
                marketName: selectedMarketName,
                orderSize: orderSizeUi,
                orderSide: side.toUpperCase(),
                orderPrice: formatNumericValue(price, tickSizeDecimals),
              }),
              callback: (res) => {
                if (res) {
                  handleCancelTriggerOrder(order.id)
                }
              },
            })
          })
          .setPrice(price)
          .setQuantity(orderSizeUi.toString())
          .setText(orderType ? orderType.toUpperCase() : side.toUpperCase())
          // .setTooltip(
          //   order.perpTrigger?.clientOrderId
          //     ? `${order.orderType} Order #: ${order.orderId}`
          //     : `Order #: ${order.orderId}`
          // )
          .setBodyTextColor(sideColor)
          .setQuantityTextColor(sideColor)
          .setCancelButtonIconColor(COLORS.FGD4[theme])
          .setBodyBorderColor(sideColor)
          .setQuantityBorderColor(sideColor)
          .setCancelButtonBorderColor(sideColor)
          .setBodyBackgroundColor(COLORS.BKG1[theme])
          .setQuantityBackgroundColor(COLORS.BKG1[theme])
          .setCancelButtonBackgroundColor(COLORS.BKG1[theme])
          .setLineColor(sideColor)
          .setLineLength(3)
          .setLineWidth(1)
          .setLineStyle(1)
      )
    },
    [
      cancelPerpOrder,
      cancelSpotOrder,
      selectedMarketName,
      t,
      theme,
      getOrderDecimals,
    ],
  )

  const drawLinesForMarket = useCallback(
    (
      openOrders: Record<string, Order[] | PerpOrder[]>,
      triggerOrders: TokenConditionalSwap[],
    ) => {
      const set = mangoStore.getState().set
      const newOrderLines = new Map()
      const oOrders = Object.entries(openOrders).map(([marketPk, orders]) => ({
        orders,
        marketPk,
      }))
      const selectedMarket = mangoStore.getState().selectedMarket.current
      if (oOrders?.length) {
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
      if (triggerOrders.length && selectedMarket instanceof Serum3Market) {
        const { baseTokenIndex, quoteTokenIndex } = selectedMarket
        for (const triggerOrder of triggerOrders) {
          const { buyTokenIndex, sellTokenIndex } = triggerOrder

          if (
            (baseTokenIndex === buyTokenIndex ||
              quoteTokenIndex === buyTokenIndex) &&
            (baseTokenIndex === sellTokenIndex ||
              quoteTokenIndex === sellTokenIndex)
          ) {
            newOrderLines.set(
              triggerOrder.id.toString(),
              drawTriggerOrderLine(triggerOrder),
            )
          }
        }
      }
      set((state) => {
        state.tradingView.orderLines = newOrderLines
      })
    },
    [drawLine],
  )

  const toggleOrderLines = useCallback(
    (el: HTMLElement) => {
      toggleShowOrderLines((prevState: boolean) => !prevState)
      if (el.style.color === hexToRgb(COLORS.ACTIVE[theme])) {
        deleteLines()
        el.style.color = COLORS.FGD4[theme]
      } else {
        const openOrders = mangoStore.getState().mangoAccount.openOrders
        const triggerOrders = getTriggerOrders()
        drawLinesForMarket(openOrders, triggerOrders)
        el.style.color = COLORS.ACTIVE[theme]
      }
    },
    [drawLinesForMarket, deleteLines, theme],
  )

  const closeModifyOrderModal = useCallback(() => {
    const openOrders = mangoStore.getState().mangoAccount.openOrders
    const triggerOrders = getTriggerOrders()
    setOrderToModify(null)
    deleteLines()
    drawLinesForMarket(openOrders, triggerOrders)
  }, [deleteLines, drawLinesForMarket])

  const toggleTradeExecutions = useCallback(
    (el: HTMLElement) => {
      toggleShowTradeExecutions((prevState) => !prevState)
      if (el.style.color === hexToRgb(COLORS.ACTIVE[theme])) {
        el.style.color = COLORS.FGD4[theme]
      } else {
        el.style.color = COLORS.ACTIVE[theme]
      }
    },
    [theme],
  )

  const toggleThemeEasterEgg = useCallback(
    (el: HTMLElement) => {
      toggleShowThemeEasterEgg((prevState) => !prevState)
      if (el.style.color === hexToRgb(COLORS.ACTIVE[theme])) {
        el.style.color = COLORS.FGD4[theme]
      } else {
        el.style.color = COLORS.ACTIVE[theme]
      }
    },
    [theme],
  )

  const createOLButton = useCallback(() => {
    if (!tvWidgetRef?.current) return
    const button = tvWidgetRef.current.createButton()
    if (!button) {
      return
    }
    button.textContent = 'OL'
    button.setAttribute('title', t('tv-chart:toggle-order-line'))
    button.addEventListener('click', () => toggleOrderLines(button))
    if (showOrderLinesLocalStorage) {
      button.style.color = COLORS.ACTIVE[theme]
    } else {
      button.style.color = COLORS.FGD4[theme]
    }
    orderLinesButtonRef.current = button
  }, [t, toggleOrderLines, tvWidgetRef, showTradeExecutions, theme])

  const createTEButton = useCallback(() => {
    if (!tvWidgetRef?.current) return
    const button = tvWidgetRef.current.createButton()
    if (!button) {
      return
    }
    button.textContent = 'TE'
    button.setAttribute('title', t('tv-chart:toggle-trade-executions'))
    button.addEventListener('click', () => toggleTradeExecutions(button))
    if (showTradeExecutions) {
      button.style.color = COLORS.ACTIVE[theme]
    } else {
      button.style.color = COLORS.FGD4[theme]
    }
  }, [t, toggleTradeExecutions, tvWidgetRef, showTradeExecutions, theme])

  const createEasterEggButton = useCallback(() => {
    if (!tvWidgetRef?.current) return
    const button = tvWidgetRef.current.createButton()
    if (!button) {
      return
    }
    button.textContent = theme.toUpperCase()
    button.addEventListener('click', () => toggleThemeEasterEgg(button))
    if (showThemeEasterEgg) {
      button.style.color = COLORS.ACTIVE[theme]
    } else {
      button.style.color = COLORS.FGD4[theme]
    }
  }, [toggleThemeEasterEgg, tvWidgetRef, showThemeEasterEgg, theme])

  useEffect(() => {
    if (window) {
      let chartStyleOverrides = {
        'paneProperties.background': COLORS.BKG1[theme],
        'paneProperties.backgroundType': 'solid',
        'paneProperties.legendProperties.showBackground': false,
        'paneProperties.legendProperties.showStudyTitles': false,
        'scalesProperties.showStudyLastValue': false,
        'scalesProperties.fontSize': 11,
        'scalesProperties.lineColor': COLORS.BKG4[theme],
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
      const mkt = mangoStore.getState().selectedMarket.current
      const marketAddress =
        (mkt instanceof Serum3Market
          ? mkt?.serumMarketExternal.toString()
          : mkt?.publicKey.toString()) || 'Loading'

      const widgetOptions: ChartingLibraryWidgetOptions = {
        // debug: true,
        symbol: marketAddress,
        datafeed: Datafeed,
        interval:
          defaultProps.interval as ChartingLibraryWidgetOptions['interval'],
        container:
          defaultProps.container as ChartingLibraryWidgetOptions['container'],
        library_path: defaultProps.libraryPath as string,
        locale: 'en',
        enabled_features: [
          'hide_left_toolbar_by_default',
          // userId ? 'study_templates' : '',
        ],
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
          !userId ? 'header_saveload' : '',
          'header_undo_redo',
          'header_interval_dialog_button',
          'show_interval_dialog_on_key_press',
          'header_symbol_search',
          'popup_hints',
        ],
        // eslint-disable-next-line
        // @ts-ignore
        custom_formatters: {
          priceFormatterFactory: () => {
            return {
              format: (price) => {
                // return the appropriate format
                return formatPrice(price)
              },
            }
          },
        },
        charts_storage_url: defaultProps.chartsStorageUrl,
        charts_storage_api_version: defaultProps.chartsStorageApiVersion,
        client_id: defaultProps.clientId,
        user_id: userId ? userId : undefined,
        fullscreen: defaultProps.fullscreen,
        autosize: defaultProps.autosize,
        studies_overrides: defaultProps.studiesOverrides,
        theme:
          theme === 'Light' || theme === 'Banana' || theme === 'Lychee'
            ? 'Light'
            : themeData.tvChartTheme,
        custom_css_url: '/styles/tradingview.css',
        loading_screen: {
          backgroundColor: COLORS.BKG1[theme],
        },
        overrides: {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          ...chartStyleOverrides,
        },
      }

      console.log('creating new chart')
      const tvWidget = new widget(widgetOptions)
      tvWidget.onChartReady(() => {
        tvWidgetRef.current = tvWidget
        setChartReady(true)
        tvWidget.headerReady().then(() => {
          createOLButton()
          createTEButton()
          if (themeData.tvImagePath) {
            createEasterEggButton()
          }
        })
      })
    }
  }, [theme, themeData, defaultProps, isMobile, userId])

  // set a limit price from right click context menu
  useEffect(() => {
    if (chartReady && tvWidgetRef.current) {
      tvWidgetRef.current.onContextMenu(function (unixtime, price) {
        return [
          {
            position: 'top',
            text: `Set limit price (${formatPrice(price)})`,
            click: function () {
              const set = mangoStore.getState().set
              set((s) => {
                s.tradeForm.price = price.toFixed(12)
              })
            },
          },
          {
            position: 'top',
            text: '-',
            click: function () {
              return
            },
          },
        ]
      })
    }
  }, [chartReady, tvWidgetRef])

  // update order lines if a user's open orders change
  useEffect(() => {
    let subscription
    if (chartReady && tvWidgetRef?.current) {
      subscription = mangoStore.subscribe(
        (state) => state.mangoAccount,
        (account) => {
          if (showOrderLines) {
            const openOrders = account.openOrders
            const triggerOrders =
              account.current?.tokenConditionalSwaps.filter(
                (tcs) => tcs.isConfigured,
              ) || []
            const orderLines = mangoStore.getState().tradingView.orderLines
            tvWidgetRef.current?.onChartReady(() => {
              let matchingOrderLines = 0
              let openOrdersForMarket = 0

              const oOrders = Object.entries(openOrders).map(
                ([marketPk, orders]) => ({
                  orders,
                  marketPk,
                }),
              )

              for (const [key] of orderLines) {
                oOrders?.forEach(({ orders }) => {
                  for (const order of orders) {
                    if (order.orderId == key) {
                      matchingOrderLines += 1
                    }
                  }
                })
                triggerOrders?.forEach((order) => {
                  if (order.id.toString() == key) {
                    matchingOrderLines += 1
                  }
                })
              }

              const selectedMarket =
                mangoStore.getState().selectedMarket.current
              const selectedMarketPk =
                selectedMarket instanceof Serum3Market
                  ? selectedMarket?.serumMarketExternal.toString()
                  : selectedMarket?.publicKey.toString()

              let ordersForMarket = 0
              oOrders?.forEach(({ marketPk, orders }) => {
                if (marketPk === selectedMarketPk) {
                  ordersForMarket = orders.length
                }
              })
              let triggerOrdersForMarket = 0
              triggerOrders.forEach((order) => {
                if (selectedMarket instanceof Serum3Market) {
                  const { baseTokenIndex, quoteTokenIndex } = selectedMarket
                  const { buyTokenIndex, sellTokenIndex } = order
                  if (
                    (baseTokenIndex === buyTokenIndex ||
                      quoteTokenIndex === buyTokenIndex) &&
                    (baseTokenIndex === sellTokenIndex ||
                      quoteTokenIndex === sellTokenIndex)
                  ) {
                    triggerOrdersForMarket += 1
                  }
                }
              })

              openOrdersForMarket = ordersForMarket + triggerOrdersForMarket

              tvWidgetRef.current?.activeChart().dataReady(() => {
                if (
                  matchingOrderLines !== openOrdersForMarket ||
                  orderLines?.size !== matchingOrderLines
                ) {
                  deleteLines()
                  // might need to change
                  const triggerOrders = getTriggerOrders()
                  drawLinesForMarket(openOrders, triggerOrders)
                }
              })
            })
          }
        },
      )
    }
    return subscription
  }, [chartReady, deleteLines, drawLinesForMarket, showOrderLines])

  const drawTradeExecutions = useCallback(
    (trades: CombinedTradeHistory) => {
      const newTradeExecutions = new Map()
      const filteredTrades = trades
        .filter((trade) => {
          return trade.market.name === selectedMarketName
        })
        .slice()
      for (let i = 0; i < filteredTrades.length; i++) {
        const trade = filteredTrades[i]
        const { side, size, price, market, liquidity, time } = trade
        let baseSymbol
        let quoteSymbol
        if (market instanceof Serum3Market) {
          baseSymbol = market.name.split('/')[0]
          quoteSymbol = market.name.split('/')[1]
        } else {
          baseSymbol = market.name.split('-')[0]
        }
        const orderType = liquidity === 'Taker' ? t('market') : t('trade:limit')
        try {
          const arrowID = tvWidgetRef
            .current!.chart()
            .createExecutionShape()
            .setTime(dayjs(time).unix())
            .setDirection(side as Direction)
            .setArrowHeight(6)
            .setArrowColor(
              side === 'buy' ? COLORS.UP[theme] : COLORS.DOWN[theme],
            )
            .setTooltip(
              `${t(side)} ${orderType} ${size} ${baseSymbol} @ ${price}${
                quoteSymbol ? ` ${quoteSymbol}` : ''
              }`,
            )
          if (arrowID) {
            try {
              newTradeExecutions.set(`${trade.time}${i}`, arrowID)
            } catch (error) {
              console.log('could not set newTradeExecution')
            }
          } else {
            console.log(
              `Could not create execution shape for trade ${trade.time}${i}`,
            )
          }
        } catch (error) {
          console.log(`could not draw arrow: ${error}`)
        }
      }
      return newTradeExecutions
    },
    [selectedMarketName, t, theme],
  )

  const removeTradeExecutions = useCallback(
    (tradeExecutions: Map<string, IExecutionLineAdapter>) => {
      const set = mangoStore.getState().set
      if (chartReady && tvWidgetRef?.current) {
        for (const val of tradeExecutions.values()) {
          try {
            val.remove()
          } catch (error) {
            console.log(`arrow ${val} could not be removed`)
          }
        }
      }
      set((s) => {
        s.tradingView.tradeExecutions = new Map()
      })
    },
    [chartReady, tvWidgetRef?.current],
  )

  useEffect(() => {
    if (!loadingTradeHistory && showTradeExecutions) {
      setCachedTradeHistory(combinedTradeHistory)
    }
  }, [loadingTradeHistory, showTradeExecutions])

  useEffect(() => {
    if (cachedTradeHistory.length !== combinedTradeHistory.length) {
      setCachedTradeHistory(combinedTradeHistory)
    }
  }, [combinedTradeHistory])

  useEffect(() => {
    removeTradeExecutions(tradeExecutions)
    if (
      showTradeExecutions &&
      tvWidgetRef &&
      tvWidgetRef.current &&
      chartReady
    ) {
      const set = mangoStore.getState().set
      set((s) => {
        s.tradingView.tradeExecutions = drawTradeExecutions(cachedTradeHistory)
      })
    }
  }, [cachedTradeHistory, selectedMarketName, showTradeExecutions])

  return (
    <>
      <Transition
        show={showThemeEasterEgg}
        as={Fragment}
        enter="transition ease-in duration-500"
        enterFrom="scale-0 opacity-0"
        enterTo="scale-100 rotate-[-370deg] opacity-100"
        leave="transition ease-out duration-500"
        leaveFrom="scale-100 opacity-100"
        leaveTo="scale-0 opacity-0"
      >
        <img
          className="absolute right-20 top-8 h-auto w-36"
          src={themeData.tvImagePath}
        />
      </Transition>
      <div
        id={defaultProps.container as string}
        className="tradingview-chart"
      />
      {orderToModify ? (
        <ModifyTvOrderModal
          isOpen={!!orderToModify}
          onClose={closeModifyOrderModal}
          price={modifiedPrice}
          order={orderToModify}
        />
      ) : null}
    </>
  )
}

export default TradingViewChart
