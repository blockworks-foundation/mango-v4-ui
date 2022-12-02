import { useEffect, useRef, useState } from 'react'
import mangoStore from '@store/mangoStore'
import { CHART_DATA_FEED } from 'utils/constants'
import { init, dispose } from 'klinecharts'
import axios from 'axios'

const ONE_HOUR_MINS = 60

const RES_NAME_TO_RES_VAL: {
  [key: string]: {
    val: string
    seconds: number
  }
} = {
  '1m': { val: '1', seconds: 60 },
  '5m': { val: '5', seconds: 5 * 60 },
  '30m': {
    val: `${ONE_HOUR_MINS / 2}`,
    seconds: (ONE_HOUR_MINS / 2) * 60,
  },
  '1H': { val: `${ONE_HOUR_MINS}`, seconds: ONE_HOUR_MINS * 60 },
  '2H': { val: `${2 * ONE_HOUR_MINS}`, seconds: ONE_HOUR_MINS * 2 * 60 },
  '4H': { val: `${4 * ONE_HOUR_MINS}`, seconds: ONE_HOUR_MINS * 4 * 60 },
  '1D': { val: '1D', seconds: 24 * ONE_HOUR_MINS * 60 },
}

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

const TradingViewChart = () => {
  //const { theme } = useTheme()
  const selectedMarketName = mangoStore((s) => s.selectedMarket.current?.name)
  const [resolution, setResultion] = useState(RES_NAME_TO_RES_VAL['1H'])
  const [chart, setChart] = useState<klinecharts.Chart | null>(null)
  const [baseChartQuery, setQuery] = useState<BASE_CHART_QUERY | null>(null)
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null)
  const fetchData = async (baseQuery: BASE_CHART_QUERY, from: number) => {
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
        newData.timestamp += 10000
        kLineChart.updateData(newData)
        updateData(kLineChart, baseQuery)
      }
    }, 10000)
  }

  useEffect(() => {
    const fetchFreshData = async () => {
      const from = Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 365
      const data = await fetchData(baseChartQuery!, from)
      chart?.applyNewData(data)
      updateData(chart!, baseChartQuery!)
    }
    if (chart && baseChartQuery) {
      fetchFreshData()
    }
  }, [baseChartQuery])

  useEffect(() => {
    if (selectedMarketName && resolution) {
      setQuery({
        resolution: resolution.val,
        symbol: selectedMarketName,
        to: Math.floor(Date.now() / 1000),
      })
    }
  }, [selectedMarketName, resolution])

  useEffect(() => {
    const initKline = async () => {
      const style = getComputedStyle(document.body)
      const gridColor = style.getPropertyValue('--bkg-3')
      const kLineChart = init('update-k-line')

      kLineChart.setStyleOptions({
        grid: {
          show: true,
          horizontal: {
            color: gridColor,
          },
          vertical: {
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
            className="cursor-pointer py-1 px-2"
            key={key}
            onClick={() => setResultion(RES_NAME_TO_RES_VAL[key])}
          >
            {key}
          </div>
        ))}
      </div>
      <div
        style={{ height: 'calc(100% - 30px)' }}
        id="update-k-line"
        className="k-line-chart"
      />
    </>
  )
}

export default TradingViewChart
