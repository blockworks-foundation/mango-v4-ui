import { useEffect, useRef, useMemo, useState } from 'react'
import { useTheme } from 'next-themes'
import {
  widget,
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
  ResolutionString,
} from '@public/charting_library'
import mangoStore from '@store/mangoStore'
import { useViewport } from 'hooks/useViewport'
import { CHART_DATA_FEED, DEFAULT_MARKET_NAME } from 'utils/constants'
import { breakpoints } from 'utils/theme'
import { COLORS } from 'styles/colors'
import Datafeed from 'apis/birdeye/datafeed'

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

const TradingViewChart = () => {
  const { theme } = useTheme()
  const { width } = useViewport()

  const [chartReady, setChartReady] = useState(false)
  const [spotOrPerp, setSpotOrPerp] = useState('spot')
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
        'http://redirect-origin.mangomarkets.workers.dev'
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
