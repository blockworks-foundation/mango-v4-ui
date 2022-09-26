import { useEffect, useRef, useMemo, useState } from 'react'
import { useTheme } from 'next-themes'
import {
  widget,
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
  ResolutionString,
} from '@public/charting_library'
import mangoStore from '@store/mangoStore'
import { useWallet } from '@solana/wallet-adapter-react'
import { useViewport } from 'hooks/useViewport'
import { CHART_DATA_FEED, DEFAULT_MARKET_NAME } from 'utils/constants'
import { breakpoints } from 'utils/theme'
import { COLORS } from 'styles/colors'

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
  const selectedMarketName = mangoStore((s) => s.selectedMarket.current?.name)
  const isMobile = width ? width < breakpoints.sm : false

  // @ts-ignore
  const defaultProps: ChartContainerProps = useMemo(
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
        'volume.volume.color.0': theme === 'Mango' ? '#E54033' : '#CC2929',
        'volume.volume.color.1': theme === 'Mango' ? '#AFD803' : '#5EBF4D',
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
      [`mainSeriesProperties.${prop}.upColor`]:
        theme === 'Mango' ? '#AFD803' : '#5EBF4D',
      [`mainSeriesProperties.${prop}.downColor`]:
        theme === 'Mango' ? '#E54033' : '#CC2929',
      [`mainSeriesProperties.${prop}.borderColor`]:
        theme === 'Mango' ? '#AFD803' : '#5EBF4D',
      [`mainSeriesProperties.${prop}.borderUpColor`]:
        theme === 'Mango' ? '#AFD803' : '#5EBF4D',
      [`mainSeriesProperties.${prop}.borderDownColor`]:
        theme === 'Mango' ? '#E54033' : '#CC2929',
      [`mainSeriesProperties.${prop}.wickUpColor`]:
        theme === 'Mango' ? '#AFD803' : '#5EBF4D',
      [`mainSeriesProperties.${prop}.wickDownColor`]:
        theme === 'Mango' ? '#E54033' : '#CC2929',
    }
  })

  useEffect(() => {
    if (tvWidgetRef.current && chartReady && selectedMarketName) {
      tvWidgetRef.current.setSymbol(
        selectedMarketName!,
        tvWidgetRef.current.activeChart().resolution(),
        () => {}
      )
    }
  }, [selectedMarketName, chartReady])

  useEffect(() => {
    if (window) {
      const widgetOptions: ChartingLibraryWidgetOptions = {
        // debug: true,
        symbol: defaultProps.symbol,
        // BEWARE: no trailing slash is expected in feed URL
        // tslint:disable-next-line:no-any
        datafeed: new (window as any).Datafeeds.UDFCompatibleDatafeed(
          defaultProps.datafeedUrl
        ),
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
        ],
        fullscreen: defaultProps.fullscreen,
        autosize: defaultProps.autosize,
        studies_overrides: defaultProps.studiesOverrides,
        theme: theme === 'Light' ? 'Light' : 'Dark',
        custom_css_url: '/styles/tradingview.css',
        loading_screen: {
          backgroundColor:
            theme === 'Dark'
              ? COLORS.BKG1.Dark
              : theme === 'Light'
              ? COLORS.BKG1.Light
              : COLORS.BKG1.Mango,
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
  }, [theme, isMobile, defaultProps])

  return (
    <div id={defaultProps.container as string} className="tradingview-chart" />
  )
}

export default TradingViewChart
