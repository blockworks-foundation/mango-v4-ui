import { useEffect, useMemo, useState } from 'react'
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
import ContentBox from '../shared/ContentBox'
import { formatFixedDecimals } from '../../utils/numbers'
import SheenLoader from '../shared/SheenLoader'
import { COLORS } from '../../styles/colors'
import { useTheme } from 'next-themes'
import Change from '../shared/Change'
import ChartRangeButtons from '../shared/ChartRangeButtons'
import { useViewport } from 'hooks/useViewport'
import { formatTokenSymbol } from 'utils/tokens'
import { useQuery } from '@tanstack/react-query'
import { fetchChartData } from 'apis/coingecko'
import mangoStore from '@store/mangoStore'
import useJupiterSwapData from './useJupiterSwapData'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { ANIMATION_SETTINGS_KEY } from 'utils/constants'
import { INITIAL_ANIMATION_SETTINGS } from '@components/settings/AnimationSettings'
import { useTranslation } from 'next-i18next'
import { NoSymbolIcon } from '@heroicons/react/20/solid'

dayjs.extend(relativeTime)

const CustomizedLabel = ({
  chartData,
  x,
  y,
  value,
  index,
}: {
  chartData: any[]
  x?: number
  y?: string | number
  value?: number
  index?: number
}) => {
  const { width } = useViewport()
  const [min, max] = useMemo(() => {
    if (chartData.length) {
      const prices = chartData.map((d: any) => d.price)
      return [Math.min(...prices), Math.max(...prices)]
    }
    return ['', '']
  }, [chartData])

  const [minIndex, maxIndex] = useMemo(() => {
    const minIndex = chartData.findIndex((d) => d.price === min)
    const maxIndex = chartData.findIndex((d) => d.price === max)
    return [minIndex, maxIndex]
  }, [min, max, chartData])

  if (value && (minIndex === index || maxIndex === index)) {
    return (
      <Text
        x={x}
        y={y}
        dy={value === min ? 16 : -8}
        fill="var(--fgd-4)"
        fontSize={10}
        textAnchor={x && y && x > width / 3 ? 'end' : 'start'}
        className="font-mono"
      >
        {formatFixedDecimals(value)}
      </Text>
    )
  } else return <div />
}

const SwapTokenChart = () => {
  const { t } = useTranslation('common')
  const { inputBank, outputBank } = mangoStore((s) => s.swap)
  const { inputCoingeckoId, outputCoingeckoId } = useJupiterSwapData()
  const [baseTokenId, setBaseTokenId] = useState(inputCoingeckoId)
  const [quoteTokenId, setQuoteTokenId] = useState(outputCoingeckoId)
  const [mouseData, setMouseData] = useState<any>(null)
  const [daysToShow, setDaysToShow] = useState('1')
  const { theme } = useTheme()
  const [animationSettings] = useLocalStorageState(
    ANIMATION_SETTINGS_KEY,
    INITIAL_ANIMATION_SETTINGS
  )

  const chartDataQuery = useQuery(
    ['chart-data', baseTokenId, quoteTokenId, daysToShow],
    () => fetchChartData(baseTokenId, quoteTokenId, daysToShow),
    {
      cacheTime: 1000 * 60 * 15,
      staleTime: 1000 * 60 * 1,
      enabled: !!baseTokenId && !!quoteTokenId,
    }
  )
  const chartData = chartDataQuery.data

  const handleMouseMove = (coords: any) => {
    if (coords.activePayload) {
      setMouseData(coords.activePayload[0].payload)
    }
  }

  const handleMouseLeave = () => {
    setMouseData(null)
  }

  useEffect(() => {
    if (!inputCoingeckoId || !outputCoingeckoId) return

    if (['usd-coin', 'tether'].includes(outputCoingeckoId)) {
      setBaseTokenId(inputCoingeckoId)
      setQuoteTokenId(outputCoingeckoId)
    } else {
      setBaseTokenId(outputCoingeckoId)
      setQuoteTokenId(inputCoingeckoId)
    }
  }, [inputCoingeckoId, outputCoingeckoId])

  // const handleFlipChart = useCallback(() => {
  //   if (!baseTokenId || !quoteTokenId) return
  //   setBaseTokenId(quoteTokenId)
  //   setQuoteTokenId(baseTokenId)
  // }, [baseTokenId, quoteTokenId])

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
    <ContentBox hideBorder hidePadding className="h-full px-6 py-3">
      {chartDataQuery?.isLoading || chartDataQuery.isFetching ? (
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
        </>
      ) : chartData?.length && baseTokenId && quoteTokenId ? (
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              {inputBank && outputBank ? (
                <div className="mb-0.5 flex items-center">
                  <p className="text-base text-th-fgd-3">
                    {['usd-coin', 'tether'].includes(inputCoingeckoId || '')
                      ? `${formatTokenSymbol(
                          outputBank?.name?.toUpperCase()
                        )}/${inputBank?.name?.toUpperCase()}`
                      : `${formatTokenSymbol(
                          inputBank?.name?.toUpperCase()
                        )}/${formatTokenSymbol(
                          outputBank?.name?.toUpperCase()
                        )}`}
                  </p>
                  {/* <div
                    className="px-2 hover:cursor-pointer hover:text-th-active"
                    onClick={handleFlipChart}
                  >
                    <SwitchHorizontalIcon className="h-4 w-4" />
                  </div> */}
                </div>
              ) : null}
              {mouseData ? (
                <>
                  <div className="mb-1 flex flex-col font-display text-5xl text-th-fgd-1 md:flex-row md:items-end">
                    {animationSettings['number-scroll'] ? (
                      <FlipNumbers
                        height={48}
                        width={35}
                        play
                        numbers={formatFixedDecimals(mouseData['price'])}
                      />
                    ) : (
                      <span>{formatFixedDecimals(mouseData['price'])}</span>
                    )}
                    <span
                      className={`ml-0 mt-2 flex items-center text-sm md:ml-3 md:mt-0`}
                    >
                      <Change change={calculateChartChange()} suffix="%" />
                    </span>
                  </div>
                  <p className="text-sm text-th-fgd-4">
                    {dayjs(mouseData['time']).format('DD MMM YY, h:mma')}
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-1 flex flex-col font-display text-5xl text-th-fgd-1 md:flex-row md:items-end">
                    {animationSettings['number-scroll'] ? (
                      <FlipNumbers
                        height={48}
                        width={35}
                        play
                        numbers={formatFixedDecimals(
                          chartData[chartData.length - 1]['price']
                        )}
                      />
                    ) : (
                      <span>
                        {formatFixedDecimals(
                          chartData[chartData.length - 1]['price']
                        )}
                      </span>
                    )}
                    <span
                      className={`ml-0 mt-2 flex items-center text-sm md:ml-3 md:mt-0`}
                    >
                      <Change change={calculateChartChange()} suffix="%" />
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
          <div className="mt-2 h-40 w-auto md:h-72">
            <div className="absolute top-[2px] right-0 -mb-2 flex justify-end">
              <ChartRangeButtons
                activeValue={daysToShow}
                names={['24H', '7D', '30D']}
                values={['1', '7', '30']}
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
                            ? COLORS.UP[theme]
                            : COLORS.DOWN[theme]
                        }
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="99%"
                        stopColor={
                          calculateChartChange() >= 0
                            ? COLORS.UP[theme]
                            : COLORS.DOWN[theme]
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
                        ? COLORS.UP[theme]
                        : COLORS.DOWN[theme]
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
        <div className="mt-4 flex h-full items-center justify-center p-4 text-th-fgd-3 md:mt-0">
          <div className="">
            <NoSymbolIcon className="mx-auto mb-1 h-6 w-6 text-th-fgd-4" />
            <p className="text-th-fgd-4">{t('chart-unavailable')}</p>
          </div>
        </div>
      )}
    </ContentBox>
  )
}

export default SwapTokenChart
