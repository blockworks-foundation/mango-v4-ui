import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import mangoStore from '@store/mangoStore'
import klinecharts, { init, dispose } from 'klinecharts'
import axios from 'axios'
import { useViewport } from 'hooks/useViewport'
import usePrevious from '@components/shared/usePrevious'
import Modal from '@components/shared/Modal'
import Switch from '@components/forms/Switch'
import {
  BASE_CHART_QUERY,
  CHART_QUERY,
  DEFAULT_MAIN_INDICATORS,
  DEFAULT_SUB_INDICATOR,
  HISTORY,
  mainTechnicalIndicatorTypes,
  MAIN_INDICATOR_CLASS,
  ONE_DAY_SECONDS,
  RES_NAME_TO_RES_VAL,
  subTechnicalIndicatorTypes,
} from 'utils/kLineChart'
import { ArrowsPointingOutIcon } from '@heroicons/react/24/outline'
import Loading from '@components/shared/Loading'
import clsx from 'clsx'
import { API_URL, BE_API_KEY } from 'apis/birdeye/helpers'

const UPDATE_INTERVAL = 10000

type Props = {
  setIsFullView?: Dispatch<SetStateAction<boolean>>
  isFullView?: boolean
}

const TradingViewChartKline = ({ setIsFullView, isFullView }: Props) => {
  const { width } = useViewport()
  const prevWidth = usePrevious(width)
  const selectedMarket = mangoStore((s) => s.selectedMarket.current)
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
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null)
  const fetchData = async (baseQuery: BASE_CHART_QUERY, from: number) => {
    try {
      setIsLoading(true)
      const query: CHART_QUERY = {
        ...baseQuery,
        time_from: from,
      }
      const response = await axios.get(`${API_URL}defi/ohlcv/pair`, {
        params: query,
        headers: {
          'X-API-KEY': BE_API_KEY,
        },
      })
      const newData = response.data.data.items as HISTORY[]
      const dataSize = newData.length
      const dataList = []
      for (let i = 0; i < dataSize; i++) {
        const row = newData[i]
        const kLineModel = {
          open: row.o,
          low: row.l,
          high: row.h,
          close: row.c,
          volume: row.v,
          timestamp: row.unixTime * 1000,
        }
        dataList.push(kLineModel)
      }
      setIsLoading(false)
      return dataList
    } catch (e) {
      setIsLoading(false)
      console.log(e)
      return []
    }
  }

  //update data every 10 secs
  function updateData(
    kLineChart: klinecharts.Chart,
    baseQuery: BASE_CHART_QUERY
  ) {
    if (clearTimerRef.current) {
      clearInterval(clearTimerRef.current)
    }
    clearTimerRef.current = setTimeout(async () => {
      if (kLineChart) {
        const from = baseQuery.time_to - resolution.seconds
        const newData = (await fetchData(baseQuery!, from))[0]
        if (newData) {
          newData.timestamp += UPDATE_INTERVAL
          kLineChart.updateData(newData)
          updateData(kLineChart, baseQuery)
        }
      }
    }, UPDATE_INTERVAL)
  }
  const fetchFreshData = async (daysToSubtractFromToday: number) => {
    const from =
      Math.floor(Date.now() / 1000) - ONE_DAY_SECONDS * daysToSubtractFromToday
    const data = await fetchData(baseChartQuery!, from)
    if (chart) {
      chart.applyNewData(data)
      //after we fetch fresh data start to update data every x seconds
      updateData(chart, baseChartQuery!)
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
      fetchFreshData(14)
      //add callback to fetch more data when zoom out
      chart.loadMore(() => {
        try {
          fetchFreshData(365)
        } catch (e) {
          console.log('Error fetching new data')
        }
        chart.loadMore(() => null)
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

  //init default technical indicators after init of chart
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
      const style = getComputedStyle(document.body)
      const gridColor = style.getPropertyValue('--bkg-3')
      const kLineChart = init('update-k-line')
      kLineChart.setStyleOptions({
        grid: {
          show: true,
          horizontal: {
            style: 'solid',
            color: gridColor,
          },
          vertical: {
            style: 'solid',
            color: gridColor,
          },
        },
        candle: {
          tooltip: {
            labels: ['T: ', 'O: ', 'C: ', 'H: ', 'L: ', 'V: '],
          },
        },
        xAxis: {
          axisLine: {
            show: true,
            color: gridColor,
            size: 1,
          },
        },
        yAxis: {
          axisLine: {
            show: true,
            color: gridColor,
            size: 1,
          },
        },
        separator: {
          size: 2,
          color: gridColor,
        },
      })
      setChart(kLineChart)
    }
    initKline()
    return () => {
      dispose('update-k-line')
    }
  }, [])

  return (
    <div
      className={clsx(
        'fixed h-full w-full',
        isFullView &&
          'left-[64px] top-0 right-0 bottom-0 bg-th-bkg-1 text-th-fgd-1'
      )}
    >
      <div className="flex w-full">
        {Object.keys(RES_NAME_TO_RES_VAL).map((key) => (
          <div
            className={clsx(
              'cursor-pointer py-1 px-2',
              resolution === RES_NAME_TO_RES_VAL[key] && 'text-th-active'
            )}
            key={key}
            onClick={() => setResolution(RES_NAME_TO_RES_VAL[key])}
          >
            {key}
          </div>
        ))}
        <div
          className="cursor-pointer py-1 px-2 "
          onClick={() => setIsTechnicalModalOpen(true)}
        >
          Indicator
        </div>
        {setIsFullView && (
          <div className="cursor-pointer py-1 px-2">
            <ArrowsPointingOutIcon
              onClick={() => setIsFullView(!isFullView)}
              className="w-5"
            ></ArrowsPointingOutIcon>
          </div>
        )}
        <div className="py-1 px-2">
          {isLoading && <Loading className="w-4"></Loading>}
        </div>
      </div>
      <div
        style={{ height: 'calc(100% - 30px)', width: '100%' }}
        id="update-k-line"
        className="k-line-chart"
      />
      <Modal
        isOpen={isTechnicalModalOpen}
        onClose={() => setIsTechnicalModalOpen(false)}
      >
        <div className="hide-scroll flex max-h-96 flex-col overflow-auto text-left">
          <h2 className="py-4">Main Indicator</h2>
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
          <h2 className="py-4">Sub Indicator</h2>
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
