import { FunctionComponent, useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import LineChartIcon from '../icons/LineChartIcon'
import ContentBox from '../shared/ContentBox'
import { GREEN, RED } from '../../styles/colors'
import { DownTriangle, UpTriangle } from '../shared/DirectionTriangles'

dayjs.extend(relativeTime)

interface SwapTokenChartProps {
  inputTokenId?: string
  outputTokenId?: string
}

export const numberFormatter = Intl.NumberFormat('en', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 5,
})

export const numberCompacter = Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 2,
})

const SwapTokenChart: FunctionComponent<SwapTokenChartProps> = ({
  inputTokenId,
  outputTokenId,
}) => {
  const [chartData, setChartData] = useState([])
  const [baseTokenId, setBaseTokenId] = useState('')
  const [quoteTokenId, setQuoteTokenId] = useState('')
  const [inputTokenInfo, setInputTokenInfo] = useState<any>(null)
  const [outputTokenInfo, setOutputTokenInfo] = useState<any>(null)
  const [mouseData, setMouseData] = useState<any>(null)
  const [daysToShow, setDaysToShow] = useState(1)

  const handleMouseMove = (coords: any) => {
    if (coords.activePayload) {
      setMouseData(coords.activePayload[0].payload)
    }
  }

  const handleMouseLeave = () => {
    setMouseData(null)
  }

  useEffect(() => {
    if (!inputTokenId || !outputTokenId) {
      return
    }
    if (['usd-coin', 'tether'].includes(inputTokenId)) {
      setBaseTokenId(outputTokenId)
      setQuoteTokenId(inputTokenId)
    } else {
      setBaseTokenId(inputTokenId)
      setQuoteTokenId(outputTokenId)
    }
  }, [inputTokenId, outputTokenId])

  // Use ohlc data

  const getChartData = async () => {
    const inputResponse = await fetch(
      `https://api.coingecko.com/api/v3/coins/${baseTokenId}/ohlc?vs_currency=usd&days=${daysToShow}`
    )
    const outputResponse = await fetch(
      `https://api.coingecko.com/api/v3/coins/${quoteTokenId}/ohlc?vs_currency=usd&days=${daysToShow}`
    )
    const inputData = await inputResponse.json()
    const outputData = await outputResponse.json()

    let data: any[] = []
    if (Array.isArray(inputData)) {
      data = data.concat(inputData)
    }
    if (Array.isArray(outputData)) {
      data = data.concat(outputData)
    }

    const formattedData = data.reduce((a, c) => {
      const found = a.find((price: any) => price.time === c[0])
      if (found) {
        if (['usd-coin', 'tether'].includes(quoteTokenId)) {
          found.price = found.inputPrice / c[4]
        } else {
          found.price = c[4] / found.inputPrice
        }
      } else {
        a.push({ time: c[0], inputPrice: c[4] })
      }
      return a
    }, [])
    formattedData[formattedData.length - 1].time = Date.now()
    setChartData(formattedData.filter((d: any) => d.price))
  }

  const getInputTokenInfo = async () => {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${inputTokenId}?localization=false&tickers=false&developer_data=false&sparkline=false
      `
    )
    const data = await response.json()
    setInputTokenInfo(data)
  }

  const getOutputTokenInfo = async () => {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${outputTokenId}?localization=false&tickers=false&developer_data=false&sparkline=false
      `
    )
    const data = await response.json()
    setOutputTokenInfo(data)
  }

  useMemo(() => {
    if (baseTokenId && quoteTokenId) {
      getChartData()
    }
  }, [daysToShow, baseTokenId, quoteTokenId])

  useMemo(() => {
    if (baseTokenId) {
      getInputTokenInfo()
    }
    if (quoteTokenId) {
      getOutputTokenInfo()
    }
  }, [baseTokenId, quoteTokenId])

  const calculateChartChange = () => {
    if (chartData.length) {
      if (mouseData) {
        const index = chartData.findIndex((d: any) => d.time === mouseData.time)
        return (
          ((chartData[chartData.length - 1]['price'] -
            chartData[index]['price']) /
            chartData[0]['price']) *
          100
        )
      } else
        return (
          ((chartData[chartData.length - 1]['price'] - chartData[0]['price']) /
            chartData[0]['price']) *
          100
        )
    }
    return 0
  }

  return (
    <ContentBox hideBorder hidePadding>
      {chartData.length && baseTokenId && quoteTokenId ? (
        <div className="relative flex justify-between md:block">
          <div className="flex items-start justify-between">
            <div>
              {inputTokenInfo && outputTokenInfo ? (
                <p className="mb-0.5 text-base text-th-fgd-3">
                  {['usd-coin', 'tether'].includes(inputTokenId || '')
                    ? `${outputTokenInfo?.symbol?.toUpperCase()}/${inputTokenInfo?.symbol?.toUpperCase()}`
                    : `${inputTokenInfo?.symbol?.toUpperCase()}/${outputTokenInfo?.symbol?.toUpperCase()}`}
                </p>
              ) : null}
              {mouseData ? (
                <>
                  <div className="mb-0.5 flex flex-col text-4xl font-bold text-th-fgd-1 md:flex-row md:items-end">
                    {numberFormatter.format(mouseData['price'])}
                    <span
                      className={`ml-0 mt-2 flex items-center text-sm md:ml-3 md:mt-0 ${
                        calculateChartChange() >= 0
                          ? 'text-th-green'
                          : 'text-th-red'
                      }`}
                    >
                      {calculateChartChange() >= 0 ? (
                        <UpTriangle />
                      ) : (
                        <DownTriangle />
                      )}
                      <span className="ml-1">
                        {calculateChartChange().toFixed(2)}%
                      </span>
                    </span>
                  </div>
                  <p className="text-th-fgd-4">
                    {dayjs(mouseData['time']).format('DD MMM YY, h:mma')}
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-0.5 flex flex-col text-4xl font-bold text-th-fgd-1 md:flex-row md:items-end">
                    {numberFormatter.format(
                      chartData[chartData.length - 1]['price']
                    )}
                    <span
                      className={`ml-0 mt-2 flex items-center text-sm md:ml-3 md:mt-0 ${
                        calculateChartChange() >= 0
                          ? 'text-th-green'
                          : 'text-th-red'
                      }`}
                    >
                      {calculateChartChange() >= 0 ? (
                        <UpTriangle />
                      ) : (
                        <DownTriangle />
                      )}
                      <span className="ml-1">
                        {calculateChartChange().toFixed(2)}%
                      </span>
                    </span>
                  </div>
                  <p className="text-th-fgd-4">
                    {dayjs(chartData[chartData.length - 1]['time']).format(
                      'DD MMM YY, h:mma'
                    )}
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="-mt-1 h-28 w-1/2 md:h-72 md:w-auto">
            <div className="-mb-2 flex justify-end md:absolute md:-top-1 md:right-0 md:mb-0 md:mb-12">
              <button
                className={`rounded-md px-3 py-2 font-bold text-th-fgd-4 focus:outline-none md:hover:text-th-primary ${
                  daysToShow === 1 && 'text-th-primary'
                }`}
                onClick={() => setDaysToShow(1)}
              >
                24H
              </button>
              <button
                className={`rounded-md px-3 py-2 font-bold text-th-fgd-4 focus:outline-none md:hover:text-th-primary ${
                  daysToShow === 7 && 'text-th-primary'
                }`}
                onClick={() => setDaysToShow(7)}
              >
                7D
              </button>
              <button
                className={`rounded-md px-3 py-2 font-bold text-th-fgd-4 focus:outline-none md:hover:text-th-primary ${
                  daysToShow === 30 && 'text-th-primary'
                }`}
                onClick={() => setDaysToShow(30)}
              >
                30D
              </button>
            </div>
            <div className="-mx-6 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <Tooltip
                    cursor={{
                      strokeOpacity: 0.09,
                    }}
                    content={<></>}
                  />
                  <defs>
                    <linearGradient
                      id="gradientArea"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={calculateChartChange() >= 0 ? GREEN : RED}
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="99%"
                        stopColor={calculateChartChange() >= 0 ? GREEN : RED}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    isAnimationActive={true}
                    type="monotone"
                    dataKey="price"
                    stroke={calculateChartChange() >= 0 ? GREEN : RED}
                    strokeWidth={1.5}
                    fill="url(#gradientArea)"
                  />
                  <XAxis
                    dataKey="time"
                    hide
                    padding={{ left: 20, right: 20 }}
                  />
                  <YAxis
                    dataKey="price"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    hide
                    padding={{ top: 20, bottom: 20 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-md bg-th-bkg-3 p-4 text-center text-th-fgd-3 md:mt-0">
          <LineChartIcon className="mx-auto h-6 w-6 text-th-primary" />
          Chart not available
        </div>
      )}
    </ContentBox>
  )
}

export default SwapTokenChart
