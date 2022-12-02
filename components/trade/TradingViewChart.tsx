import { useEffect, useState } from 'react'
import mangoStore from '@store/mangoStore'
import { CHART_DATA_FEED } from 'utils/constants'
import { init, dispose } from 'klinecharts'
import axios from 'axios'

const ONE_HOUR_MINS = 60
const ONE_H = '1H'

const RESOLUTIONS: {
  [key: string]: string
} = {
  '1m': '1',
  '5m': '5',
  '30m': `${ONE_HOUR_MINS / 2}`,
  [ONE_H]: `${ONE_HOUR_MINS}`,
  '2H': `${2 * ONE_HOUR_MINS}`,
  '4H': `${4 * ONE_HOUR_MINS}`,
  '1D': '1D',
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
  const [resolution, setResultion] = useState(RESOLUTIONS['1H'])
  const [chart, setChart] = useState<klinecharts.Chart | null>(null)
  const query = {
    resolution: resolution,
    symbol: 'SOL/USDC',
    from: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30,
    to: Math.floor(Date.now() / 1000),
  }

  useEffect(() => {
    return
  }, [selectedMarketName])

  const fetchData = async () => {
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

  function updateData(kLineChart: any) {
    setTimeout(async () => {
      if (kLineChart) {
        const newData = (await fetchData())[0]
        newData.timestamp += 60000
        kLineChart.updateData(newData)
      }
      updateData(kLineChart)
    }, 60000)
  }
  useEffect(() => {
    const changeResultion = async () => {
      const data = await fetchData()
      chart?.applyNewData(data)
      updateData(chart)
    }
    if (chart) {
      changeResultion()
    }
  }, [resolution])

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
      const data = await fetchData()
      kLineChart.applyNewData(data)
      setChart(kLineChart)
      updateData(kLineChart)
    }
    initKline()
    return () => {
      dispose('update-k-line')
    }
  }, [])
  return (
    <>
      <div className="flex">
        {Object.keys(RESOLUTIONS).map((key) => (
          <div
            className="cursor-pointer py-1 px-2"
            key={key}
            onClick={() => setResultion(RESOLUTIONS[key])}
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
