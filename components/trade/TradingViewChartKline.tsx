import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import mangoStore from '@store/mangoStore'
import klinecharts, { init, dispose, KLineData } from 'klinecharts'
import { useViewport } from 'hooks/useViewport'
import usePrevious from '@components/shared/usePrevious'
import Modal from '@components/shared/Modal'
import Switch from '@components/forms/Switch'
import {
  BASE_CHART_QUERY,
  CHART_QUERY,
  DEFAULT_MAIN_INDICATORS,
  DEFAULT_SUB_INDICATOR,
  mainTechnicalIndicatorTypes,
  MAIN_INDICATOR_CLASS,
  ONE_DAY_SECONDS,
  RES_NAME_TO_RES_VAL,
  subTechnicalIndicatorTypes,
} from 'utils/kLineChart'
import Loading from '@components/shared/Loading'
import clsx from 'clsx'
import { useTheme } from 'next-themes'
import { COLORS } from 'styles/colors'
import { IconButton } from '@components/shared/Button'
import { ArrowsPointingOutIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { queryBars } from 'apis/birdeye/datafeed'
import {
  getNextBarTime,
  parseResolution,
  socketUrl,
} from 'apis/birdeye/helpers'

type Props = {
  setIsFullView?: Dispatch<SetStateAction<boolean>>
  isFullView?: boolean
}

const TradingViewChartKline = ({ setIsFullView, isFullView }: Props) => {
  const socket = new WebSocket(socketUrl, 'echo-protocol')
  const unsub_msg = {
    type: 'UNSUBSCRIBE_PRICE',
  }
  const { width } = useViewport()
  const { theme } = useTheme()
  const prevWidth = usePrevious(width)
  const selectedMarket = mangoStore((s) => s.selectedMarket.current)
  const [socketConnected, setSocketConnected] = useState(false)
  const selectedMarketName = selectedMarket?.name
  const [isTechnicalModalOpen, setIsTechnicalModalOpen] = useState(false)
  const [mainTechnicalIndicators, setMainTechnicalIndicators] = useState<
    string[]
  >([])
  const [subTechnicalIndicators, setSubTechnicalIndicators] = useState<{
    //indicatorName: class
    [indicatorName: string]: string
  }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [resolution, setResolution] = useState(RES_NAME_TO_RES_VAL['1H'])
  const [chart, setChart] = useState<klinecharts.Chart | null>(null)
  const previousChart = usePrevious(chart)
  const [baseChartQuery, setQuery] = useState<BASE_CHART_QUERY | null>(null)
  const fetchData = async (
    baseQuery: BASE_CHART_QUERY,
    from: number,
    to?: number
  ) => {
    try {
      setIsLoading(true)
      const query: CHART_QUERY = {
        ...baseQuery,
        time_from: from,
        time_to: to ? to : baseQuery.time_to,
      }
      const response = await queryBars(query.address, query.type, {
        firstDataRequest: false,
        from: query.time_from,
        to: query.time_to,
      })
      const dataSize = response.length
      const dataList = []
      for (let i = 0; i < dataSize; i++) {
        const row = response[i]
        const kLineModel = {
          ...row,
        }
        dataList.push(kLineModel)
      }
      setIsLoading(false)
      return dataList
    } catch (e) {
      setIsLoading(false)
      console.error(e)
      return []
    }
  }

  //update data every 10 secs
  function setupSocket(
    kLineChart: klinecharts.Chart,
    baseQuery: BASE_CHART_QUERY
  ) {
    // Connection opened
    socket.addEventListener('open', (_event) => {
      console.log('[socket] Connected')
    })
    socket.addEventListener('message', (msg) => {
      const data = JSON.parse(msg.data)
      if (data.type === 'WELLCOME') {
        setSocketConnected(true)
        socket.send(JSON.stringify(unsub_msg))
        const msg = {
          type: 'SUBSCRIBE_PRICE',
          data: {
            chartType: parseResolution(baseQuery.type),
            address: baseQuery.address,
            currency: 'pair',
          },
        }
        socket.send(JSON.stringify(msg))
      }
      if (data.type === 'PRICE_DATA') {
        const dataList = kLineChart.getDataList()
        const currTime = data.data.unixTime * 1000
        const lastBar = dataList[dataList.length - 1] as any
        lastBar.time = lastBar.timestamp
        const resolution = parseResolution(baseQuery.type)
        const nextBarTime = getNextBarTime(lastBar, resolution)
        let bar: KLineData

        if (currTime >= nextBarTime) {
          bar = {
            timestamp: nextBarTime,
            open: data.data.o,
            high: data.data.h,
            low: data.data.l,
            close: data.data.c,
            volume: data.data.v,
          }
        } else {
          bar = {
            ...lastBar,
            high: Math.max(lastBar.high, data.data.h),
            low: Math.min(lastBar.low, data.data.l),
            close: data.data.c,
            volume: data.data.v,
          }
        }
        kLineChart.updateData(bar)
      }
    })
  }
  const fetchFreshData = async (daysToSubtractFromToday: number) => {
    const from =
      Math.floor(Date.now() / 1000) - ONE_DAY_SECONDS * daysToSubtractFromToday
    const data = await fetchData(baseChartQuery!, from)
    if (chart) {
      chart.applyNewData(data)
      //after we fetch fresh data start to update data every x seconds
      setupSocket(chart, baseChartQuery!)
    }
  }

  //size change
  useEffect(() => {
    if (width !== prevWidth && chart) {
      //wait for event que to be empty
      //to have current width
      setTimeout(() => {
        chart?.resize()
      }, 0)
    }
  }, [width])

  //when base query change we refetch with fresh data
  useEffect(() => {
    if (chart && baseChartQuery) {
      //becuase bird eye send onlu 1k records at one time
      //we query for lower amounts of days at the start
      const halfDayThreshold = ['1', '3']
      const twoDaysThreshold = ['5', '15', '30']
      const daysToSub = halfDayThreshold.includes(baseChartQuery.type)
        ? 0.5
        : twoDaysThreshold.includes(baseChartQuery.type)
        ? 2
        : 5
      fetchFreshData(daysToSub)
      //add callback to fetch more data when zoom out
      chart.loadMore(async (timestap) => {
        try {
          const unixTime = timestap / 1000
          const from = unixTime - ONE_DAY_SECONDS * daysToSub
          const data = await fetchData(baseChartQuery!, from, unixTime)
          chart.applyMoreData(data)
        } catch (e) {
          console.error('Error fetching new data')
        }
      })
    }
  }, [baseChartQuery])

  //change query based on market and resolution
  useEffect(() => {
    if (selectedMarketName && resolution) {
      setQuery({
        type: resolution.val,
        address: '8BnEgHoWFysVcuFFX7QztDmzuH8r5ZFvyP3sYwn1XTh6',
        time_to: Math.floor(Date.now() / 1000),
      })
    }
  }, [selectedMarketName, resolution])

  // init default technical indicators after init of chart
  useEffect(() => {
    if (chart !== null && previousChart === null) {
      if (DEFAULT_SUB_INDICATOR) {
        const subId = chart.createTechnicalIndicator(
          DEFAULT_SUB_INDICATOR,
          true
        )
        setSubTechnicalIndicators({ [DEFAULT_SUB_INDICATOR]: subId })
      }
      if (DEFAULT_MAIN_INDICATORS?.length) {
        for (const type of DEFAULT_MAIN_INDICATORS) {
          chart?.createTechnicalIndicator(type, true, {
            id: MAIN_INDICATOR_CLASS,
          })
        }
        setMainTechnicalIndicators(DEFAULT_MAIN_INDICATORS)
      }
    }
  }, [chart !== null])

  //init chart without data
  useEffect(() => {
    const initKline = async () => {
      const kLineChart = init('update-k-line')
      kLineChart.setStyleOptions({
        grid: {
          show: false,
        },
        candle: {
          bar: {
            upColor: COLORS.UP[theme],
            downColor: COLORS.DOWN[theme],
          },
          tooltip: {
            labels: ['', 'O:', 'C:', 'H:', 'L:', 'V:'],
            text: {
              size: 12,
              family: 'TT Mono',
              weight: 'normal',
              color: COLORS.FGD4[theme],
              marginLeft: 8,
              marginTop: 6,
              marginRight: 8,
              marginBottom: 0,
            },
          },
          priceMark: {
            show: true,
            high: {
              show: true,
              color: COLORS.FGD4[theme],
              textMargin: 5,
              textSize: 10,
              textFamily: 'TT Mono',
              textWeight: 'normal',
            },
            low: {
              show: true,
              color: COLORS.FGD4[theme],
              textMargin: 5,
              textSize: 10,
              textFamily: 'TT Mono',
              textWeight: 'normal',
            },
            last: {
              show: true,
              upColor: COLORS.BKG4[theme],
              downColor: COLORS.BKG4[theme],
              noChangeColor: COLORS.BKG4[theme],
              line: {
                show: true,
                // 'solid'|'dash'
                style: 'dash',
                dashValue: [4, 4],
                size: 1,
              },
              text: {
                show: true,
                size: 10,
                paddingLeft: 2,
                paddingTop: 2,
                paddingRight: 2,
                paddingBottom: 2,
                color: '#FFFFFF',
                family: 'TT Mono',
                weight: 'normal',
                borderRadius: 2,
              },
            },
          },
        },
        xAxis: {
          axisLine: {
            show: true,
            color: COLORS.BKG4[theme],
            size: 1,
          },
          tickLine: {
            show: true,
            size: 1,
            length: 3,
            color: COLORS.BKG4[theme],
          },
          tickText: {
            show: true,
            color: COLORS.FGD4[theme],
            family: 'TT Mono',
            weight: 'normal',
            size: 10,
          },
        },
        yAxis: {
          axisLine: {
            show: true,
            color: COLORS.BKG4[theme],
            size: 1,
          },
          tickLine: {
            show: true,
            size: 1,
            length: 3,
            color: COLORS.BKG4[theme],
          },
          tickText: {
            show: true,
            color: COLORS.FGD4[theme],
            family: 'TT Mono',
            weight: 'normal',
            size: 10,
          },
        },
        crosshair: {
          show: true,
          horizontal: {
            show: true,
            line: {
              show: true,
              style: 'dash',
              dashValue: [4, 2],
              size: 1,
              color: COLORS.FGD4[theme],
            },
            text: {
              show: true,
              color: '#FFFFFF',
              size: 10,
              family: 'TT Mono',
              weight: 'normal',
              paddingLeft: 2,
              paddingRight: 2,
              paddingTop: 2,
              paddingBottom: 2,
              borderSize: 1,
              borderColor: COLORS.FGD4[theme],
              borderRadius: 2,
              backgroundColor: COLORS.FGD4[theme],
            },
          },
          vertical: {
            show: true,
            line: {
              show: true,
              style: 'dash',
              dashValue: [4, 2],
              size: 1,
              color: COLORS.FGD4[theme],
            },
            text: {
              show: true,
              color: '#FFFFFF',
              size: 10,
              family: 'TT Mono',
              weight: 'normal',
              paddingLeft: 2,
              paddingRight: 2,
              paddingTop: 2,
              paddingBottom: 2,
              borderSize: 1,
              borderColor: COLORS.FGD4[theme],
              borderRadius: 2,
              backgroundColor: COLORS.FGD4[theme],
            },
          },
        },
        technicalIndicator: {
          margin: {
            top: 0.2,
            bottom: 0.1,
          },
          bar: {
            upColor: COLORS.UP[theme],
            downColor: COLORS.DOWN[theme],
            noChangeColor: '#888888',
          },
          line: {
            size: 1,
            colors: ['#FF9600', '#9D65C9', '#2196F3', '#E11D74', '#01C5C4'],
          },
          circle: {
            upColor: '#26A69A',
            downColor: '#EF5350',
            noChangeColor: '#888888',
          },
          lastValueMark: {
            show: false,
            text: {
              show: false,
              color: '#ffffff',
              size: 12,
              family: 'Helvetica Neue',
              weight: 'normal',
              paddingLeft: 3,
              paddingTop: 2,
              paddingRight: 3,
              paddingBottom: 2,
              borderRadius: 2,
            },
          },
          tooltip: {
            // 'always' | 'follow_cross' | 'none'
            showRule: 'always',
            // 'standard' | 'rect'
            showType: 'standard',
            showName: true,
            showParams: true,
            defaultValue: 'n/a',
            text: {
              size: 12,
              family: 'TT Mono',
              weight: 'normal',
              color: COLORS.FGD4[theme],
              marginTop: 6,
              marginRight: 8,
              marginBottom: 0,
              marginLeft: 8,
            },
          },
        },
        separator: {
          size: 2,
          color: COLORS.BKG4[theme],
        },
      })
      setChart(kLineChart)
    }
    initKline()

    return () => {
      dispose('update-k-line')
      if (socketConnected) {
        console.log('[socket] disconnected')
        socket.send(JSON.stringify(unsub_msg))
        socket.close()
      }
    }
  }, [])

  return (
    <div
      className={clsx(
        'h-full w-full',
        isFullView
          ? 'fixed left-0 top-0 right-0 bottom-0 z-40 bg-th-bkg-1 text-th-fgd-1'
          : ''
      )}
    >
      <div className="mb-1 flex w-full items-center justify-between border-b border-th-bkg-3 p-1 text-th-fgd-2">
        <div className="flex text-th-fgd-3">
          {Object.keys(RES_NAME_TO_RES_VAL).map((key) => (
            <button
              className={clsx(
                'default-transition px-2 md:hover:text-th-fgd-2',
                resolution === RES_NAME_TO_RES_VAL[key] && 'text-th-active'
              )}
              key={key}
              onClick={() => setResolution(RES_NAME_TO_RES_VAL[key])}
            >
              {key}
            </button>
          ))}
          <button
            className="default-transition px-2 md:hover:text-th-fgd-2"
            onClick={() => setIsTechnicalModalOpen(true)}
          >
            Indicator
          </button>
          <div className="px-2">
            {isLoading && <Loading className="w-4"></Loading>}
          </div>
        </div>
        {setIsFullView ? (
          <IconButton
            className="text-th-fgd-3"
            size="small"
            hideBg
            onClick={() => setIsFullView(!isFullView)}
          >
            {isFullView ? (
              <XMarkIcon className="h-5 w-5" />
            ) : (
              <ArrowsPointingOutIcon className="h-5 w-5" />
            )}
          </IconButton>
        ) : null}
      </div>
      <div
        style={{ height: 'calc(100% - 48px)', width: '100%' }}
        id="update-k-line"
        className="k-line-chart"
      />
      <Modal
        isOpen={isTechnicalModalOpen}
        onClose={() => setIsTechnicalModalOpen(false)}
      >
        <div className="hide-scroll flex max-h-96 flex-col overflow-auto text-left">
          <h2 className="py-4 text-base">Main Indicator</h2>
          {mainTechnicalIndicatorTypes.map((type) => {
            return (
              <IndicatorSwitch
                key={type}
                type={type}
                checked={!!mainTechnicalIndicators.find((x) => x === type)}
                onChange={(check) => {
                  if (check) {
                    chart?.createTechnicalIndicator(type, true, {
                      id: MAIN_INDICATOR_CLASS,
                    })
                    setMainTechnicalIndicators([
                      ...mainTechnicalIndicators,
                      type,
                    ])
                  } else {
                    chart?.removeTechnicalIndicator(MAIN_INDICATOR_CLASS, type)
                    setMainTechnicalIndicators([
                      ...mainTechnicalIndicators.filter((x) => x !== type),
                    ])
                  }
                }}
              ></IndicatorSwitch>
            )
          })}
          <h2 className="py-4 text-base">Bottom Indicator</h2>
          {subTechnicalIndicatorTypes.map((type) => {
            return (
              <IndicatorSwitch
                key={type}
                type={type}
                checked={
                  !!Object.keys(subTechnicalIndicators).find((x) => x === type)
                }
                onChange={(check) => {
                  if (check) {
                    const subId = chart?.createTechnicalIndicator(type, true)
                    setSubTechnicalIndicators({
                      ...subTechnicalIndicators,
                      [type]: subId!,
                    })
                  } else {
                    chart?.removeTechnicalIndicator(
                      subTechnicalIndicators[type],
                      type
                    )
                    const newItems = { ...subTechnicalIndicators }
                    delete newItems[type] // or whichever key you want
                    setSubTechnicalIndicators(newItems)
                  }
                }}
              ></IndicatorSwitch>
            )
          })}
        </div>
      </Modal>
    </div>
  )
}

const IndicatorSwitch = ({
  type,
  onChange,
  checked,
}: {
  type: string
  onChange: (checked: boolean) => void
  checked: boolean
}) => {
  return (
    <div
      className="flex justify-between border-t border-th-bkg-3 p-4 text-th-fgd-4"
      key={type}
    >
      {type}
      <Switch checked={checked} onChange={onChange} />
    </div>
  )
}

export default TradingViewChartKline
