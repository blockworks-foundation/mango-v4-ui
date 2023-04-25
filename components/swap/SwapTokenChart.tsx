import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Text,
  ReferenceDot,
  ReferenceDotProps,
} from 'recharts'
import FlipNumbers from 'react-flip-numbers'
import ContentBox from '../shared/ContentBox'
import { formatNumericValue } from '../../utils/numbers'
import SheenLoader from '../shared/SheenLoader'
import { COLORS } from '../../styles/colors'
import { useTheme } from 'next-themes'
import Change from '../shared/Change'
import ChartRangeButtons from '../shared/ChartRangeButtons'
import { useViewport } from 'hooks/useViewport'
import { formatTokenSymbol } from 'utils/tokens'
import { useQuery } from '@tanstack/react-query'
import { ChartDataItem, fetchChartData } from 'apis/coingecko'
import mangoStore from '@store/mangoStore'
import useJupiterSwapData from './useJupiterSwapData'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { ANIMATION_SETTINGS_KEY } from 'utils/constants'
import { INITIAL_ANIMATION_SETTINGS } from '@components/settings/AnimationSettings'
import { useTranslation } from 'next-i18next'
import {
  ArrowsRightLeftIcon,
  EyeIcon,
  EyeSlashIcon,
  NoSymbolIcon,
} from '@heroicons/react/20/solid'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { CategoricalChartFunc } from 'recharts/types/chart/generateCategoricalChart'
import { interpolateNumber } from 'd3-interpolate'
import { IconButton } from '@components/shared/Button'
import Tooltip from '@components/shared/Tooltip'
import { SwapHistoryItem } from 'types'

dayjs.extend(relativeTime)

const CustomizedLabel = ({
  chartData,
  x,
  y,
  value,
  index,
}: {
  chartData: ChartDataItem[]
  x?: number
  y?: string | number
  value?: number
  index?: number
}) => {
  const { width } = useViewport()
  const [min, max] = useMemo(() => {
    if (chartData.length) {
      const prices = chartData.map((d) => d.price)
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
        {formatNumericValue(value)}
      </Text>
    )
  } else return <div />
}

interface ExtendedReferenceDotProps extends ReferenceDotProps {
  swapHistory: SwapHistoryItem[]
  swapMarketName: string
  flipPrices: boolean
}

const SwapHistoryArrows = (props: ExtendedReferenceDotProps) => {
  const { cx, cy, x, swapHistory, swapMarketName, flipPrices } = props
  const swapDetails = swapHistory.find(
    (swap) => dayjs(swap.block_datetime).unix() * 1000 === x
  )
  const side =
    swapDetails?.swap_in_symbol === swapMarketName.split('/')[0]
      ? !flipPrices
        ? 'sell'
        : 'buy'
      : !flipPrices
      ? 'buy'
      : 'sell'

  const buy = {
    pathCoords: 'M11 0.858312L0.857867 15.0004H21.1421L11 0.858312Z',
    fill: 'var(--up)',
    yOffset: 1,
  }

  const sell = {
    pathCoords:
      'M11 14.1427L21.1421 0.000533306L0.857865 0.000529886L11 14.1427Z',
    fill: 'var(--down)',
    yOffset: -11,
  }

  const sideArrowProps =
    side === 'buy' ? (!flipPrices ? buy : sell) : !flipPrices ? sell : buy
  return cx && cy ? (
    <svg
      width="14.67"
      height="10"
      viewBox="0 0 20 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      x={cx - 8}
      y={cy + sideArrowProps.yOffset}
    >
      <path
        d={sideArrowProps.pathCoords}
        fill={sideArrowProps.fill}
        stroke={'var(--bkg-1)'}
        strokeWidth={2}
      />
    </svg>
  ) : (
    <div />
  )
}

const SwapTokenChart = () => {
  const { t } = useTranslation('common')
  const inputBank = mangoStore((s) => s.swap.inputBank)
  const outputBank = mangoStore((s) => s.swap.outputBank)
  const { inputCoingeckoId, outputCoingeckoId } = useJupiterSwapData()
  const [baseTokenId, setBaseTokenId] = useState(inputCoingeckoId)
  const [quoteTokenId, setQuoteTokenId] = useState(outputCoingeckoId)
  const [mouseData, setMouseData] = useState<ChartDataItem>()
  const [daysToShow, setDaysToShow] = useState('1')
  const [flipPrices, setFlipPrices] = useState(false)
  const { theme } = useTheme()
  const [animationSettings] = useLocalStorageState(
    ANIMATION_SETTINGS_KEY,
    INITIAL_ANIMATION_SETTINGS
  )
  const swapHistory = mangoStore((s) => s.mangoAccount.swapHistory.data)
  const loadSwapHistory = mangoStore((s) => s.mangoAccount.swapHistory.loading)
  const [showSwaps, setShowSwaps] = useState(true)

  const coingeckoDataQuery = useQuery(
    ['chart-data', baseTokenId, quoteTokenId, daysToShow],
    () => fetchChartData(baseTokenId, quoteTokenId, daysToShow),
    {
      cacheTime: 1000 * 60 * 15,
      staleTime: 1000 * 60 * 1,
      enabled: !!baseTokenId && !!quoteTokenId,
      refetchOnWindowFocus: false,
    }
  )

  const coingeckoData = useMemo(() => {
    if (!coingeckoDataQuery?.data?.length) return []
    if (!flipPrices) {
      return coingeckoDataQuery.data
    } else {
      return coingeckoDataQuery.data.map((d: ChartDataItem) => {
        const price =
          d.inputTokenPrice / d.outputTokenPrice === d.price
            ? d.outputTokenPrice / d.inputTokenPrice
            : d.inputTokenPrice / d.outputTokenPrice
        return { ...d, price: price }
      })
    }
  }, [flipPrices, coingeckoDataQuery])

  const chartSwapTimes = useMemo(() => {
    if (
      loadSwapHistory ||
      !swapHistory ||
      !swapHistory.length ||
      !inputBank ||
      !outputBank
    )
      return []
    const chartSymbols = [
      formatTokenSymbol(inputBank.name),
      formatTokenSymbol(outputBank.name),
    ]
    return swapHistory
      .filter(
        (swap) =>
          chartSymbols.includes(swap.swap_in_symbol) &&
          chartSymbols.includes(swap.swap_out_symbol)
      )
      .map((val) => dayjs(val.block_datetime).unix() * 1000)
  }, [swapHistory, loadSwapHistory, inputBank, outputBank])

  const swapHistoryPoints = useMemo(() => {
    if (!coingeckoData.length || !chartSwapTimes.length) return []
    return chartSwapTimes.map((x) => {
      const makeChartDataItem = { inputTokenPrice: 1, outputTokenPrice: 1 }
      const index = coingeckoData.findIndex((d) => d.time > x) // find index of data point with x value greater than highlight x
      if (index === 0) {
        return { time: x, price: coingeckoData[0].price, ...makeChartDataItem } // return first data point y value if highlight x is less than first data point x
      } else if (index === -1) {
        return {
          time: x,
          price: coingeckoData[coingeckoData.length - 1].price,
          ...makeChartDataItem,
        } // return last data point y value if highlight x is greater than last data point x
      } else {
        const x0 = coingeckoData[index - 1].time
        const x1 = coingeckoData[index].time
        const y0 = coingeckoData[index - 1].price
        const y1 = coingeckoData[index].price
        const interpolateY = interpolateNumber(y0, y1) // create interpolate function for y values
        const y = interpolateY((x - x0) / (x1 - x0)) // estimate y value at highlight x using interpolate function
        return { time: x, price: y, ...makeChartDataItem }
      }
    })
  }, [coingeckoData, chartSwapTimes])

  const chartData = useMemo(() => {
    if (!coingeckoData.length) return []
    const minTime = coingeckoData[0].time
    const maxTime = coingeckoData[coingeckoData.length - 1].time
    if (swapHistoryPoints.length && showSwaps) {
      const swapPoints = swapHistoryPoints.filter(
        (point) => point.time >= minTime && point.time <= maxTime
      )
      return coingeckoData.concat(swapPoints).sort((a, b) => a.time - b.time)
    } else return coingeckoData
  }, [coingeckoData, swapHistoryPoints, showSwaps])

  const handleMouseMove: CategoricalChartFunc = (coords) => {
    if (coords.activePayload) {
      setMouseData(coords.activePayload[0].payload)
    }
  }

  const handleMouseLeave = () => {
    setMouseData(undefined)
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

  const calculateChartChange = () => {
    if (chartData?.length) {
      if (mouseData) {
        const index = chartData.findIndex((d) => d.time === mouseData.time)
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

  const swapMarketName = useMemo(() => {
    if (!inputBank || !outputBank) return ''
    const inputSymbol = formatTokenSymbol(inputBank.name?.toUpperCase())
    const outputSymbol = formatTokenSymbol(outputBank.name?.toUpperCase())
    return ['usd-coin', 'tether'].includes(inputCoingeckoId || '')
      ? !flipPrices
        ? `${outputSymbol}/${inputSymbol}`
        : `${inputSymbol}/${outputSymbol}`
      : !flipPrices
      ? `${inputSymbol}/${outputSymbol}`
      : `${outputSymbol}/${inputSymbol}`
  }, [flipPrices, inputBank, inputCoingeckoId, outputBank])

  return (
    <ContentBox hideBorder hidePadding className="h-full px-6 py-3">
      {coingeckoDataQuery?.isLoading || coingeckoDataQuery.isFetching ? (
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
                  <p className="text-base text-th-fgd-3">{swapMarketName}</p>
                  <IconButton
                    className="px-2 text-th-fgd-3"
                    onClick={() => setFlipPrices(!flipPrices)}
                    hideBg
                  >
                    <ArrowsRightLeftIcon className="h-5 w-5" />
                  </IconButton>
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
                        numbers={formatNumericValue(mouseData.price)}
                      />
                    ) : (
                      <FormatNumericValue value={mouseData.price} />
                    )}
                    <span
                      className={`ml-0 mt-2 flex items-center text-sm md:ml-3 md:mt-0`}
                    >
                      <Change change={calculateChartChange()} suffix="%" />
                    </span>
                  </div>
                  <p className="text-sm text-th-fgd-4">
                    {dayjs(mouseData.time).format('DD MMM YY, h:mma')}
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
                        numbers={formatNumericValue(
                          chartData[chartData.length - 1].price
                        )}
                      />
                    ) : (
                      <FormatNumericValue
                        value={chartData[chartData.length - 1].price}
                      />
                    )}
                    <span
                      className={`ml-0 mt-2 flex items-center text-sm md:ml-3 md:mt-0`}
                    >
                      <Change change={calculateChartChange()} suffix="%" />
                    </span>
                  </div>
                  <p className="text-sm text-th-fgd-4">
                    {dayjs(chartData[chartData.length - 1].time).format(
                      'DD MMM YY, h:mma'
                    )}
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="mt-2 h-40 w-auto md:h-72">
            <div className="absolute top-[2px] right-0 -mb-2 flex items-center justify-end space-x-4">
              <Tooltip
                content={
                  showSwaps
                    ? t('swap:hide-swap-history')
                    : t('swap:show-swap-history')
                }
              >
                <IconButton
                  className="text-th-fgd-3"
                  hideBg
                  onClick={() => setShowSwaps(!showSwaps)}
                >
                  {showSwaps ? (
                    <EyeIcon className="h-5 w-5" />
                  ) : (
                    <EyeSlashIcon className="h-5 w-5" />
                  )}
                </IconButton>
              </Tooltip>
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
                >
                  <RechartsTooltip
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
                  {showSwaps && swapHistoryPoints.length
                    ? swapHistoryPoints.map((point, index) => (
                        <ReferenceDot
                          key={index}
                          x={point.time}
                          y={point.price}
                          isFront={true}
                          shape={
                            <SwapHistoryArrows
                              swapHistory={swapHistory}
                              swapMarketName={swapMarketName}
                              flipPrices={flipPrices}
                            />
                          }
                        />
                      ))
                    : null}
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
