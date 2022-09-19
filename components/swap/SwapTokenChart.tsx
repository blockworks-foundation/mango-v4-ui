import {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Text,
} from 'recharts'
import FlipNumbers from 'react-flip-numbers'

import LineChartIcon from '../icons/LineChartIcon'
import ContentBox from '../shared/ContentBox'
import { formatFixedDecimals } from '../../utils/numbers'
import SheenLoader from '../shared/SheenLoader'
import { COLORS } from '../../styles/colors'
import { useTheme } from 'next-themes'
import PercentageChange from '../shared/PercentageChange'
import ChartRangeButtons from '../shared/ChartRangeButtons'
import { useViewport } from 'hooks/useViewport'

dayjs.extend(relativeTime)

interface SwapTokenChartProps {
  inputTokenId?: string
  outputTokenId?: string
}

const fetchChartData = async (
  baseTokenId: string,
  quoteTokenId: string,
  daysToShow: number
) => {
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
  return formattedData.filter((d: any) => d.price)
}

const fetchTokenInfo = async (tokenId: string) => {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/${tokenId}?localization=false&tickers=false&developer_data=false&sparkline=false
    `
  )
  const data = await response.json()
  return data
}

const CustomizedLabel = ({
  chartData,
  x,
  y,
  value,
}: {
  chartData: any[]
  x?: number
  y?: string | number
  value?: number
}) => {
  const { width } = useViewport()
  const { theme } = useTheme()
  const [min, max] = useMemo(() => {
    if (chartData.length) {
      const prices = chartData.map((d: any) => d.price)
      return [Math.min(...prices), Math.max(...prices)]
    }
    return ['', '']
  }, [chartData])

  if (value === min || value === max) {
    return (
      <Text
        x={x}
        y={y}
        dy={value === min ? 16 : -8}
        fill={theme === 'Light' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)'}
        fontSize={10}
        fontFamily="Roboto Mono"
        textAnchor={x && y && x > width / 3 ? 'end' : 'start'}
      >
        {formatFixedDecimals(value)}
      </Text>
    )
  } else return <div />
}

const SwapTokenChart: FunctionComponent<SwapTokenChartProps> = ({
  inputTokenId,
  outputTokenId,
}) => {
  const [chartData, setChartData] = useState([])
  const [loadChartData, setLoadChartData] = useState(true)
  const [baseTokenId, setBaseTokenId] = useState('')
  const [quoteTokenId, setQuoteTokenId] = useState('')
  const [inputTokenInfo, setInputTokenInfo] = useState<any>(null)
  const [outputTokenInfo, setOutputTokenInfo] = useState<any>(null)
  const [mouseData, setMouseData] = useState<any>(null)
  const [daysToShow, setDaysToShow] = useState(1)
  const { theme } = useTheme()

  const handleMouseMove = (coords: any) => {
    if (coords.activePayload) {
      setMouseData(coords.activePayload[0].payload)
    }
  }

  const handleMouseLeave = () => {
    setMouseData(null)
  }

  useEffect(() => {
    if (!inputTokenId || !outputTokenId) return

    if (['usd-coin', 'tether'].includes(outputTokenId)) {
      setBaseTokenId(inputTokenId)
      setQuoteTokenId(outputTokenId)
    } else {
      setBaseTokenId(outputTokenId)
      setQuoteTokenId(inputTokenId)
    }
  }, [inputTokenId, outputTokenId])

  // const handleFlipChart = useCallback(() => {
  //   if (!baseTokenId || !quoteTokenId) return
  //   setBaseTokenId(quoteTokenId)
  //   setQuoteTokenId(baseTokenId)
  // }, [baseTokenId, quoteTokenId])

  // Use ohlc data
  const getChartData = useCallback(async () => {
    if (!baseTokenId || !quoteTokenId) return
    try {
      const chartData = await fetchChartData(
        baseTokenId,
        quoteTokenId,
        daysToShow
      )
      setChartData(chartData)
      setLoadChartData(false)
    } catch (e) {
      console.warn('Unable to load chart data')
      setLoadChartData(false)
    }
  }, [baseTokenId, quoteTokenId, daysToShow])

  const getInputTokenInfo = useCallback(async () => {
    if (!inputTokenId) return
    try {
      const response = await fetchTokenInfo(inputTokenId)
      setInputTokenInfo(response)
    } catch (e) {
      console.error(e)
    }
  }, [inputTokenId])

  const getOutputTokenInfo = useCallback(async () => {
    if (!outputTokenId) return
    try {
      const response = await fetchTokenInfo(outputTokenId)
      setOutputTokenInfo(response)
    } catch (e) {
      console.error(e)
    }
  }, [outputTokenId])

  useEffect(() => {
    getChartData()
  }, [getChartData])

  useEffect(() => {
    getInputTokenInfo()
    getOutputTokenInfo()
  }, [getInputTokenInfo, getOutputTokenInfo])

  const calculateChartChange = () => {
    if (chartData.length) {
      if (mouseData) {
        const index = chartData.findIndex((d: any) => d.time === mouseData.time)
        return (
          ((chartData[index]['price'] - chartData[0]['price']) /
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
    <ContentBox hideBorder hidePadding className="h-full px-6 py-3 md:pb-6">
      {loadChartData ? (
        <>
          <SheenLoader className="w-[148px] rounded-md">
            <div className="h-[18px] bg-th-bkg-2" />
          </SheenLoader>
          <SheenLoader className="mt-2 w-[148px] rounded-md">
            <div className="h-[48px] bg-th-bkg-2" />
          </SheenLoader>
          <SheenLoader className="mt-2 w-[148px] rounded-md">
            <div className="h-[18px] bg-th-bkg-2" />
          </SheenLoader>
          <SheenLoader className="mt-4 w-full rounded-md">
            <div className="h-[328px] bg-th-bkg-2" />
          </SheenLoader>
        </>
      ) : chartData.length && baseTokenId && quoteTokenId ? (
        <div className="relative flex justify-between md:block">
          <div className="flex items-start justify-between">
            <div>
              {inputTokenInfo && outputTokenInfo ? (
                <div className="mb-0.5 flex items-center">
                  <p className="text-base text-th-fgd-3">
                    {['usd-coin', 'tether'].includes(inputTokenId || '')
                      ? `${outputTokenInfo?.symbol?.toUpperCase()}/${inputTokenInfo?.symbol?.toUpperCase()}`
                      : `${inputTokenInfo?.symbol?.toUpperCase()}/${outputTokenInfo?.symbol?.toUpperCase()}`}
                  </p>
                  {/* <div
                    className="px-2 hover:cursor-pointer hover:text-th-primary"
                    onClick={handleFlipChart}
                  >
                    <SwitchHorizontalIcon className="h-4 w-4" />
                  </div> */}
                </div>
              ) : null}
              {mouseData ? (
                <>
                  <div className="mb-1 flex flex-col text-4xl font-bold text-th-fgd-1 md:flex-row md:items-end">
                    <FlipNumbers
                      height={40}
                      width={26}
                      play
                      numbers={formatFixedDecimals(mouseData['price'])}
                    />
                    <span
                      className={`ml-0 mt-2 flex items-center text-sm md:ml-3 md:mt-0`}
                    >
                      <PercentageChange change={calculateChartChange()} />
                    </span>
                  </div>
                  <p className="text-sm text-th-fgd-4">
                    {dayjs(mouseData['time']).format('DD MMM YY, h:mma')}
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-1 flex flex-col text-4xl font-bold text-th-fgd-1 md:flex-row md:items-end">
                    <FlipNumbers
                      height={40}
                      width={26}
                      play
                      numbers={formatFixedDecimals(
                        chartData[chartData.length - 1]['price']
                      )}
                    />
                    <span
                      className={`ml-0 mt-2 flex items-center text-sm md:ml-3 md:mt-0`}
                    >
                      <PercentageChange change={calculateChartChange()} />
                    </span>
                  </div>
                  <p className="text-sm text-th-fgd-4">
                    {dayjs(chartData[chartData.length - 1]['time']).format(
                      'DD MMM YY, h:mma'
                    )}
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="mt-2 h-28 w-1/2 md:h-80 md:w-auto">
            <div className="-mb-2 flex justify-end md:absolute md:top-[2px] md:right-0">
              <ChartRangeButtons
                activeValue={daysToShow}
                names={['24H', '7D', '30D']}
                values={[1, 7, 30]}
                onChange={(v) => setDaysToShow(v)}
              />
            </div>
            <div className="h-full md:-mx-2 md:mt-4">
              <ResponsiveContainer>
                <AreaChart
                  data={chartData}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  // margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
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
                        stopColor={
                          calculateChartChange() >= 0
                            ? COLORS.GREEN[theme]
                            : COLORS.RED[theme]
                        }
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="99%"
                        stopColor={
                          calculateChartChange() >= 0
                            ? COLORS.GREEN[theme]
                            : COLORS.RED[theme]
                        }
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="price"
                    stroke={
                      calculateChartChange() >= 0
                        ? COLORS.GREEN[theme]
                        : COLORS.RED[theme]
                    }
                    strokeWidth={1.5}
                    fill="url(#gradientArea)"
                    label={<CustomizedLabel chartData={chartData} />}
                  />
                  <XAxis dataKey="time" hide padding={{ left: 0, right: 0 }} />
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
        <div className="mt-4 flex h-full items-center justify-center rounded-lg bg-th-bkg-2 p-4 text-th-fgd-3 md:mt-0">
          <div className="">
            <LineChartIcon className="mx-auto h-10 w-10 text-th-fgd-4" />
            <p className="text-th-fgd-4">Chart not available</p>
          </div>
        </div>
      )}
    </ContentBox>
  )
}

export default SwapTokenChart
