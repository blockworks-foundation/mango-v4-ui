import { useEffect, useRef, useMemo, useState } from 'react'
import { useTheme } from 'next-themes'
import {
  widget,
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
  ResolutionString,
  EntityId,
} from '@public/charting_library'
import mangoStore from '@store/mangoStore'
import { useViewport } from 'hooks/useViewport'
import {
  CHART_DATA_FEED,
  DEFAULT_MARKET_NAME,
  SHOW_STABLE_PRICE_KEY,
} from 'utils/constants'
import { breakpoints } from 'utils/theme'
import { COLORS } from 'styles/colors'
import Datafeed from 'apis/birdeye/datafeed'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'
import useStablePrice from 'hooks/useStablePrice'

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
  const { t } = useTranslation('tv-chart')
  const { theme } = useTheme()
  const { width } = useViewport()

  const [chartReady, setChartReady] = useState(false)
  const [spotOrPerp, setSpotOrPerp] = useState('spot')
  const [showStablePriceLocalStorage, toggleShowStablePriceLocalStorage] =
    useLocalStorageState(SHOW_STABLE_PRICE_KEY, false)
  const [showStablePrice, toggleShowStablePrice] = useState(
    showStablePriceLocalStorage
  )
  const stablePrice = useStablePrice()
  const stablePriceLine = mangoStore((s) => s.tradingView.stablePriceLine)
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
  }, [selectedMarketName, chartReady])

  const createStablePriceButton = () => {
    const button = tvWidgetRef?.current?.createButton()
    if (!button) {
      return
    }
    button.textContent = 'SP'
    if (showStablePriceLocalStorage) {
      button.style.color = COLORS.ACTIVE[theme]
    } else {
      button.style.color = COLORS.FGD4[theme]
    }
    button.setAttribute('title', t('tv-chart:toggle-stable-price'))
    button.addEventListener('click', toggleStablePrice)
  }

  function toggleStablePrice(this: HTMLElement) {
    toggleShowStablePrice((prevState: boolean) => !prevState)
    if (this.style.color === hexToRgb(COLORS.ACTIVE[theme])) {
      this.style.color = COLORS.FGD4[theme]
    } else {
      this.style.color = COLORS.ACTIVE[theme]
    }
  }

  useEffect(() => {
    if (showStablePrice !== showStablePriceLocalStorage) {
      toggleShowStablePriceLocalStorage(showStablePrice)
    }
  }, [showStablePrice])

  useEffect(() => {
    if (tvWidgetRef.current && chartReady) {
      if (stablePriceLine) {
        removeStablePrice(stablePriceLine)
      }
      if (showStablePrice && stablePrice) {
        const set = mangoStore.getState().set
        set((s) => {
          s.tradingView.stablePriceLine = drawStablePriceLine(stablePrice)
        })
      }
    }
  }, [stablePrice, showStablePrice, chartReady, tvWidgetRef])

  function drawStablePriceLine(price: number) {
    if (!tvWidgetRef?.current?.chart()) return
    const newStablePrice: Map<string, EntityId> = new Map()
    const now = Date.now() / 1000
    try {
      const id = tvWidgetRef.current.chart().createShape(
        { time: now, price: price },
        {
          shape: 'horizontal_line',
          overrides: {
            linecolor: COLORS.FGD4[theme],
            linestyle: 1,
            linewidth: 1,
          },
        }
      )

      if (id) {
        try {
          newStablePrice.set(`${now}${price}`, id)
        } catch (error) {
          console.log('failed to set stable price line')
        }
      } else {
        console.log('failed to create stable price line')
      }
    } catch {
      console.log('failed to create stable price line')
    }
    return newStablePrice
  }

  const removeStablePrice = (stablePrice: Map<string, EntityId>) => {
    if (!tvWidgetRef?.current?.chart()) return
    const set = mangoStore.getState().set
    for (const val of stablePrice.values()) {
      try {
        tvWidgetRef.current.chart().removeEntity(val)
      } catch (error) {
        console.log('stable price could not be removed')
      }
    }
    set((s) => {
      s.tradingView.stablePriceLine = new Map()
    })
  }

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
          backgroundColor:
            theme === 'Dark'
              ? COLORS.BKG1.Dark
              : theme === 'Light'
              ? COLORS.BKG1.Light
              : theme === 'Mango Classic'
              ? COLORS.BKG1['Mango Classic']
              : theme === 'Medium'
              ? COLORS.BKG1.Medium
              : theme === 'Avocado'
              ? COLORS.BKG1.Avocado
              : theme === 'Blueberry'
              ? COLORS.BKG1.Blueberry
              : theme === 'Banana'
              ? COLORS.BKG1.Banana
              : theme === 'Lychee'
              ? COLORS.BKG1.Lychee
              : theme === 'Olive'
              ? COLORS.BKG1.Olive
              : COLORS.BKG1['High Contrast'],
        },
        overrides: {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

          ...chartStyleOverrides,
        },
      }

      const tvWidget = new widget(widgetOptions)
      tvWidgetRef.current = tvWidget

      tvWidgetRef.current.onChartReady(function () {
        if (showStablePrice && stablePrice) {
          const set = mangoStore.getState().set
          set((s) => {
            s.tradingView.stablePriceLine = drawStablePriceLine(stablePrice)
          })
        }
        createStablePriceButton()
        setChartReady(true)
      })
      //eslint-disable-next-line
    }
  }, [theme, isMobile, defaultProps, spotOrPerp])

  return (
    <div id={defaultProps.container as string} className="tradingview-chart" />
  )
}

export default TradingViewChart
