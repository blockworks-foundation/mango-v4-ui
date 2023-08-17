import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import mangoStore from '@store/mangoStore'
import klinecharts, { init, dispose } from 'klinecharts'
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
import { IconButton } from '@components/shared/Button'
import { ArrowsPointingOutIcon, XMarkIcon } from '@heroicons/react/20/solid'
import spotDataFeed, { SymbolInfo } from 'apis/datafeed'
import perpDataFeed from 'apis/mngo/datafeed'
import { sleep } from 'utils'
import { useKlineChart } from 'hooks/useKlineChart'
import { ResolutionString } from '@public/charting_library/charting_library'

type Props = {
  setIsFullView?: Dispatch<SetStateAction<boolean>>
  isFullView?: boolean
}

const TradingViewChartKline = ({ setIsFullView, isFullView }: Props) => {
  const { styles } = useKlineChart()
  const { width } = useViewport()
  const selectedMarket = mangoStore((s) => s.selectedMarket.current)
  const prevWidth = usePrevious(width)
  const [currentDataFeed, setCurrentDataFeed] = useState(spotDataFeed)
  const previousDataFeed = usePrevious(currentDataFeed)
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
    to?: number,
    firstDataRequest?: boolean,
  ) => {
    try {
      setIsLoading(true)
      const query: CHART_QUERY = {
        ...baseQuery,
        time_from: from,
        time_to: to ? to : baseQuery.time_to,
      }
      let symbolInfo: SymbolInfo | undefined
      currentDataFeed.resolveSymbol(baseQuery.address, (sInfo) => {
        symbolInfo = sInfo
      })
      if (!symbolInfo) return []
      const response = await currentDataFeed.getBars(
        symbolInfo,
        query.type as ResolutionString,
        {
          firstDataRequest: !!firstDataRequest,
          from: query.time_from,
          to: query.time_to,
          countBack: 0,
        },
        () => {
          return null
        },
        (e) => {
          console.log(e)
          return null
        },
      )
      const dataSize = response?.length || 0
      const dataList = []
      for (let i = 0; i < dataSize; i++) {
        const row = response![i]
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

  async function setupSocket(
    kLineChart: klinecharts.Chart,
    baseQuery: BASE_CHART_QUERY,
  ) {
    await sleep(1500)
    setSocketConnected(true)
    let symbolInfo: SymbolInfo | undefined
    currentDataFeed.resolveSymbol(baseQuery.address, (symbolInf) => {
      symbolInfo = symbolInf
    })
    previousDataFeed.unsubscribeBars()
    if (!symbolInfo) return
    currentDataFeed.subscribeBars(
      symbolInfo,
      baseQuery.type,
      (bar) => {
        kLineChart.updateData(bar)
      },
      '',
      () => {
        return null
      },
    )
  }
  const fetchFreshData = async (daysToSubtractFromToday: number) => {
    const from =
      Math.floor(Date.now() / 1000) - ONE_DAY_SECONDS * daysToSubtractFromToday
    const data = await fetchData(baseChartQuery!, from, undefined, true)
    if (chart) {
      chart.applyNewData(data)
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
      //because bird eye send only 1k records at one time
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
      chart.loadMore(async (timestamp: number) => {
        try {
          const unixTime = timestamp / 1000
          const from = unixTime - ONE_DAY_SECONDS * daysToSub
          const data = await fetchData(baseChartQuery!, from, unixTime)
          if (!data.length) {
            chart.loadMore(() => null)
          }
          chart.applyMoreData(data)
        } catch (e) {
          console.error('Error fetching new data')
        }
      })
    }
  }, [baseChartQuery, currentDataFeed.name])

  //change query based on market and resolution
  useEffect(() => {
    let dataFeed = spotDataFeed
    const group = mangoStore.getState().group
    let address = ''

    if (!selectedMarketName?.toLowerCase().includes('perp') && group) {
      address = group!
        .getSerum3MarketByName(selectedMarketName!)
        .serumMarketExternal.toString()
    } else if (group) {
      dataFeed = perpDataFeed

      address = group!
        .getPerpMarketByName(selectedMarketName!)
        .publicKey.toString()
    }
    setCurrentDataFeed(dataFeed)
    setQuery({
      type: resolution.val,
      address: address,
      time_to: Math.floor(Date.now() / 1000),
    })
  }, [selectedMarketName, resolution])

  // init default technical indicators after init of chart
  useEffect(() => {
    if (chart !== null && previousChart === null) {
      if (DEFAULT_SUB_INDICATOR) {
        const subId = chart.createTechnicalIndicator(
          DEFAULT_SUB_INDICATOR,
          true,
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
      kLineChart.setStyleOptions({ ...styles })
      setChart(kLineChart)
    }
    initKline()

    return () => {
      dispose('update-k-line')
      if (socketConnected) {
        currentDataFeed.unsubscribeBars('')
        currentDataFeed.closeSocket()
      }
    }
  }, [])

  return (
    <div
      className={clsx(
        'h-full w-full',
        isFullView
          ? 'fixed bottom-0 left-0 right-0 top-0 z-40 bg-th-bkg-1 text-th-fgd-1'
          : '',
      )}
    >
      <div className="mb-1 flex w-full items-center justify-between border-b border-th-bkg-3 p-1 text-th-fgd-2">
        <div className="flex text-th-fgd-3">
          {Object.keys(RES_NAME_TO_RES_VAL).map((key) => (
            <button
              className={clsx(
                'px-2 md:hover:text-th-fgd-2',
                resolution === RES_NAME_TO_RES_VAL[key] && 'text-th-active',
              )}
              key={key}
              onClick={() => setResolution(RES_NAME_TO_RES_VAL[key])}
            >
              {key}
            </button>
          ))}
          <button
            className="px-2 md:hover:text-th-fgd-2"
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
                      type,
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
