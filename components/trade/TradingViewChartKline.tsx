import { useEffect, useRef, useState } from 'react'
import mangoStore from '@store/mangoStore'
import { CHART_DATA_FEED } from 'utils/constants'
import klinecharts, { init, dispose } from 'klinecharts'
import axios from 'axios'
import { useViewport } from 'hooks/useViewport'
import usePrevious from '@components/shared/usePrevious'
import Modal from '@components/shared/Modal'
import Switch from '@components/forms/Switch'

const ONE_HOUR_MINS = 60
const ONE_MINUTE_SECONDS = 60
const ONE_HOUR_SECONDS = ONE_HOUR_MINS * ONE_MINUTE_SECONDS
const ONE_DAY_SECONDS = ONE_HOUR_SECONDS * 24

type BASE_CHART_QUERY = {
  resolution: string
  symbol: string
  to: number
}

type CHART_QUERY = BASE_CHART_QUERY & {
  from: number
}

type HISTORY = {
  c: string[]
  h: string[]
  l: string[]
  o: string[]
  t: number[]
  v: string[]
}

//Translate values that api accepts to chart seconds
const RES_NAME_TO_RES_VAL: {
  [key: string]: {
    val: string
    seconds: number
  }
} = {
  '1m': { val: '1', seconds: ONE_MINUTE_SECONDS },
  '5m': { val: '5', seconds: 5 * ONE_MINUTE_SECONDS },
  '30m': {
    val: `${ONE_HOUR_MINS / 2}`,
    seconds: (ONE_HOUR_MINS / 2) * ONE_MINUTE_SECONDS,
  },
  '1H': { val: `${ONE_HOUR_MINS}`, seconds: ONE_HOUR_SECONDS },
  '2H': { val: `${2 * ONE_HOUR_MINS}`, seconds: ONE_HOUR_SECONDS * 2 },
  '4H': { val: `${4 * ONE_HOUR_MINS}`, seconds: ONE_HOUR_SECONDS * 4 },
  '1D': { val: '1D', seconds: 24 * ONE_HOUR_SECONDS },
}

const mainTechnicalIndicatorTypes = [
  'MA',
  'EMA',
  'SAR',
  'BOLL',
  'SMA',
  'BBI',
  'TRIX',
]
const subTechnicalIndicatorTypes = [
  'VOL',
  'MACD',
  'RSI',
  'KDJ',
  'OBV',
  'CCI',
  'WR',
  'DMI',
  'MTM',
  'EMV',
]

const TradingViewChartKline = () => {
  const { width } = useViewport()
  const prevWidth = usePrevious(width)
  const selectedMarketName = mangoStore((s) => s.selectedMarket.current?.name)
  const [isTechnicalModalOpen, setIsTechnicalModalOpen] = useState(false)
  const [mainTechnicalIndicators, setMainTechnicalIndicators] = useState<
    string[]
  >([])
  const [resolution, setResultion] = useState(RES_NAME_TO_RES_VAL['1H'])
  const [chart, setChart] = useState<klinecharts.Chart | null>(null)
  const [baseChartQuery, setQuery] = useState<BASE_CHART_QUERY | null>(null)
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null)
  const fetchData = async (baseQuery: BASE_CHART_QUERY, from: number) => {
    try {
      const query: CHART_QUERY = {
        ...baseQuery,
        from,
      }
      const response = await axios.get(`${CHART_DATA_FEED}/history`, {
        params: query,
      })
      const newData = response.data as HISTORY
      const dataSize = newData.t.length
      const dataList = []
      for (let i = 0; i < dataSize; i++) {
        const kLineModel = {
          open: parseFloat(newData.o[i]),
          low: parseFloat(newData.l[i]),
          high: parseFloat(newData.h[i]),
          close: parseFloat(newData.c[i]),
          volume: parseFloat(newData.v[i]),
          timestamp: newData.t[i] * 1000,
        }
        dataList.push(kLineModel)
      }
      return dataList
    } catch (e) {
      console.log(e)
      return []
    }
  }

  function updateData(
    kLineChart: klinecharts.Chart,
    baseQuery: BASE_CHART_QUERY
  ) {
    if (clearTimerRef.current) {
      clearInterval(clearTimerRef.current)
    }
    clearTimerRef.current = setTimeout(async () => {
      if (kLineChart) {
        const from = baseQuery.to - resolution.seconds
        const newData = (await fetchData(baseQuery!, from))[0]
        if (newData) {
          newData.timestamp += 10000
          kLineChart.updateData(newData)
          updateData(kLineChart, baseQuery)
        }
      }
    }, 10000)
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

  useEffect(() => {
    if (width !== prevWidth && chart) {
      //wait for event que to be empty
      //to have current width
      setTimeout(() => {
        chart.resize()
      }, 0)
    }
  }, [width])

  //when base query change we refetch fresh data
  useEffect(() => {
    if (chart && baseChartQuery) {
      fetchFreshData(14)
      //add callback to fetch more data when zoom out
      chart.loadMore(() => {
        fetchFreshData(365)
      })
    }
  }, [baseChartQuery])

  //change query based on market and resolution
  useEffect(() => {
    if (selectedMarketName && resolution) {
      setQuery({
        resolution: resolution.val,
        symbol: selectedMarketName,
        to: Math.floor(Date.now() / 1000),
      })
    }
  }, [selectedMarketName, resolution])

  //init chart without data
  useEffect(() => {
    const initKline = async () => {
      const style = getComputedStyle(document.body)
      const gridColor = style.getPropertyValue('--bkg-3')
      const kLineChart = init('update-k-line')
      kLineChart!.setStyleOptions({
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
      })
      setChart(kLineChart)
    }
    initKline()
    return () => {
      dispose('update-k-line')
    }
  }, [])

  return (
    <>
      <div className="flex">
        {Object.keys(RES_NAME_TO_RES_VAL).map((key) => (
          <div
            className={`cursor-pointer py-1 px-2 ${
              resolution === RES_NAME_TO_RES_VAL[key] ? 'text-th-active' : ''
            }`}
            key={key}
            onClick={() => setResultion(RES_NAME_TO_RES_VAL[key])}
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
        <div className="flex max-h-96 flex-col overflow-auto text-left">
          <h2 className="pb-4">Main Indicator</h2>
          {mainTechnicalIndicatorTypes.map((type) => {
            return (
              <IndicatorSwitch
                key={type}
                type={type}
                chart={chart}
                mainTechnicalIndicators={mainTechnicalIndicators}
                setMainTechnicalIndicators={setMainTechnicalIndicators}
              ></IndicatorSwitch>
            )
          })}
          <h2 className="pb-4">Sub Indicator</h2>
          {subTechnicalIndicatorTypes.map((type) => {
            return (
              <IndicatorSwitch
                key={type}
                type={type}
                chart={chart}
                mainTechnicalIndicators={mainTechnicalIndicators}
                setMainTechnicalIndicators={setMainTechnicalIndicators}
              ></IndicatorSwitch>
            )
          })}
        </div>
      </Modal>
    </>
  )
}

const IndicatorSwitch = ({
  type,
  mainTechnicalIndicators,
  chart,
  setMainTechnicalIndicators,
}: {
  type: string
  mainTechnicalIndicators: string[]
  chart: klinecharts.Chart | null
  setMainTechnicalIndicators: (indicators: string[]) => void
}) => {
  return (
    <div
      className="flex justify-between border-t border-th-bkg-3 p-4 text-th-fgd-4"
      key={type}
    >
      {type}
      <Switch
        checked={!!mainTechnicalIndicators.find((x) => x === type)}
        onChange={(check) => {
          let newInidicatorsArray = [...mainTechnicalIndicators]
          if (check) {
            newInidicatorsArray.push(type)
            chart?.createTechnicalIndicator(type, true, {
              id: 'candle_pane',
            })
          } else {
            newInidicatorsArray = newInidicatorsArray.filter((x) => x !== type)
            chart?.removeTechnicalIndicator('candle_pane', type)
          }
          setMainTechnicalIndicators(newInidicatorsArray)
        }}
      />
    </div>
  )
}

export default TradingViewChartKline
