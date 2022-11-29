import { useEffect, useRef, useMemo } from 'react'
import { useTheme } from 'next-themes'
import {
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
  ResolutionString,
} from '@public/charting_library'
import mangoStore from '@store/mangoStore'
import { CHART_DATA_FEED } from 'utils/constants'
import { COLORS } from 'styles/colors'
import { init, dispose } from 'klinecharts'
import axios from 'axios'

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

  const selectedMarketName = mangoStore((s) => s.selectedMarket.current?.name)
  const interval = 60
  console.log(selectedMarketName)
  const query = {
    resolution: interval,
    symbol: 'SOL/USDC',
    from: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 14,
    to: Math.floor(Date.now() / 1000),
    countback: 2,
  }
  const defaultProps = useMemo(
    () => ({
      symbol: 'SOL/USDC',
      interval: '60' as ResolutionString,
      theme: 'Dark',
      container: 'tv_chart_container',
      datafeedUrl: CHART_DATA_FEED,
      libraryPath: '/charting_library/',
      fullscreen: false,
      autosize: true,
      studiesOverrides: {
        'volume.volume.color.0': COLORS.RED[theme],
        'volume.volume.color.1': COLORS.GREEN[theme],
        'volume.precision': 4,
      },
    }),
    [theme]
  )
  console.log(defaultProps)
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
      [`mainSeriesProperties.${prop}.upColor`]: COLORS.GREEN[theme],
      [`mainSeriesProperties.${prop}.downColor`]: COLORS.RED[theme],
      [`mainSeriesProperties.${prop}.borderColor`]: COLORS.GREEN[theme],
      [`mainSeriesProperties.${prop}.borderUpColor`]: COLORS.GREEN[theme],
      [`mainSeriesProperties.${prop}.borderDownColor`]: COLORS.RED[theme],
      [`mainSeriesProperties.${prop}.wickUpColor`]: COLORS.GREEN[theme],
      [`mainSeriesProperties.${prop}.wickDownColor`]: COLORS.RED[theme],
    }
  })

  useEffect(() => {
    if (tvWidgetRef.current && selectedMarketName) {
      tvWidgetRef.current.setSymbol(
        selectedMarketName!,
        tvWidgetRef.current.activeChart().resolution(),
        () => {
          return
        }
      )
    }
  }, [selectedMarketName])

  //   useEffect(() => {
  //     if (window) {
  //       const widgetOptions: ChartingLibraryWidgetOptions = {
  //         // debug: true,
  //         symbol: defaultProps.symbol,
  //         // BEWARE: no trailing slash is expected in feed URL
  //         // tslint:disable-next-line:no-any
  //         datafeed: new (window as any).Datafeeds.UDFCompatibleDatafeed(
  //           defaultProps.datafeedUrl
  //         ),
  //         interval:
  //           defaultProps.interval as ChartingLibraryWidgetOptions['interval'],
  //         container:
  //           defaultProps.container as ChartingLibraryWidgetOptions['container'],
  //         library_path: defaultProps.libraryPath as string,
  //         locale: 'en',
  //         enabled_features: ['hide_left_toolbar_by_default'],
  //         disabled_features: [
  //           'use_localstorage_for_settings',
  //           'timeframes_toolbar',
  //           isMobile ? 'left_toolbar' : '',
  //           'show_logo_on_all_charts',
  //           'caption_buttons_text_if_possible',
  //           'header_settings',
  //           // 'header_chart_type',
  //           'header_compare',
  //           'compare_symbol',
  //           'header_screenshot',
  //           // 'header_widget_dom_node',
  //           // 'header_widget',
  //           'header_saveload',
  //           'header_undo_redo',
  //           'header_interval_dialog_button',
  //           'show_interval_dialog_on_key_press',
  //           'header_symbol_search',
  //           'popup_hints',
  //         ],
  //         fullscreen: defaultProps.fullscreen,
  //         autosize: defaultProps.autosize,
  //         studies_overrides: defaultProps.studiesOverrides,
  //         theme: theme === 'Light' ? 'Light' : 'Dark',
  //         custom_css_url: '/styles/tradingview.css',
  //         loading_screen: {
  //           backgroundColor:
  //             theme === 'Dark'
  //               ? COLORS.BKG1.Dark
  //               : theme === 'Light'
  //               ? COLORS.BKG1.Light
  //               : COLORS.BKG1.Mango,
  //         },
  //         overrides: {
  //           timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

  //           ...chartStyleOverrides,
  //         },
  //       }

  //       const tvWidget = new widget(widgetOptions)
  //       tvWidgetRef.current = tvWidget

  //       tvWidgetRef.current.onChartReady(function () {
  //         setChartReady(true)
  //       })
  //       //eslint-disable-next-line
  //     }
  //   }, [theme, isMobile, defaultProps])

  const generatedKLineDataList = async (dataSize = 336) => {
    const response = await axios.get(`${CHART_DATA_FEED}/history`, {
      params: query,
    })
    const newData = response.data as any

    const dataList = []
    for (let i = 0; i < dataSize; i++) {
      const kLineModel = {
        open: parseFloat(newData.o[i]),
        low: parseFloat(newData.l[i]),
        high: parseFloat(newData.h[i]),
        close: parseFloat(newData.c[i]),
        volume: parseFloat(newData.v[i]),
        timestamp: newData.t[i],
      }
      dataList.unshift(kLineModel)
    }
    return dataList
  }

  function updateData(kLineChart: any) {
    setTimeout(async () => {
      if (kLineChart) {
        const newData = (await generatedKLineDataList(1))[0]
        newData.timestamp += 30000 * 60
        kLineChart.updateData(newData)
      }
      updateData(kLineChart)
    }, 30000)
  }

  useEffect(() => {
    const initKline = async () => {
      const kLineChart = init('update-k-line')
      const data = await generatedKLineDataList()
      kLineChart.applyNewData(data)
      updateData(kLineChart)
    }
    initKline()
    return () => {
      dispose('update-k-line')
    }
  }, [])
  return (
    <>
      <div
        style={{ height: '300px' }}
        id="update-k-line"
        className="k-line-chart"
      />
    </>
  )
}

export default TradingViewChart
