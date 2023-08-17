import React, {
  MouseEventHandler,
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
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Text,
  ReferenceDot,
  ReferenceDotProps,
} from 'recharts'
import FlipNumbers from 'react-flip-numbers'
import ContentBox from '../shared/ContentBox'
import { formatCurrencyValue, formatNumericValue } from '../../utils/numbers'
import SheenLoader from '../shared/SheenLoader'
import { COLORS } from '../../styles/colors'
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
import useThemeWrapper from 'hooks/useThemeWrapper'
import FavoriteSwapButton from './FavoriteSwapButton'

dayjs.extend(relativeTime)

const set = mangoStore.getState().set

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
  mouseEnter: (
    swap: SwapHistoryItem | undefined,
    coingeckoPrice: string | number | undefined,
  ) => void
  mouseLeave: MouseEventHandler
}

const SwapHistoryArrows = (props: ExtendedReferenceDotProps) => {
  const {
    cx,
    cy,
    x,
    y,
    swapHistory,
    swapMarketName,
    flipPrices,
    mouseEnter,
    mouseLeave,
  } = props
  const swapDetails = swapHistory.find(
    (swap) => dayjs(swap.block_datetime).unix() * 1000 === x,
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
    yOffset: 0,
  }

  const sell = {
    pathCoords:
      'M11 14.1427L21.1421 0.000533306L0.857865 0.000529886L11 14.1427Z',
    fill: 'var(--down)',
    yOffset: -15,
  }

  const sideArrowProps =
    side === 'buy' ? (!flipPrices ? buy : sell) : !flipPrices ? sell : buy

  const coingeckoPrice = y ? Number(y) : 0
  return cx && cy ? (
    <svg
      className="cursor-pointer"
      width="20"
      height="15"
      viewBox="0 0 20 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      x={cx - 11}
      y={cy + sideArrowProps.yOffset}
      onMouseEnter={() => mouseEnter(swapDetails, coingeckoPrice)}
      onMouseLeave={mouseLeave}
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
  const { inputBank, outputBank, flipPrices } = mangoStore((s) => s.swap)
  const { inputCoingeckoId, outputCoingeckoId } = useJupiterSwapData()
  const [baseTokenId, setBaseTokenId] = useState(inputCoingeckoId)
  const [quoteTokenId, setQuoteTokenId] = useState(outputCoingeckoId)
  const [mouseData, setMouseData] = useState<ChartDataItem>()
  const [daysToShow, setDaysToShow] = useState('1')
  const { theme } = useThemeWrapper()
  const [animationSettings] = useLocalStorageState(
    ANIMATION_SETTINGS_KEY,
    INITIAL_ANIMATION_SETTINGS,
  )
  const swapHistory = mangoStore((s) => s.mangoAccount.swapHistory.data)
  const loadSwapHistory = mangoStore((s) => s.mangoAccount.swapHistory.loading)
  const [showSwaps, setShowSwaps] = useState(true)
  const [swapTooltipData, setSwapTooltipData] =
    useState<SwapHistoryItem | null>(null)
  const [swapTooltipCoingeckoPrice, setSwapTooltipCoingeckoPrice] = useState<
    string | number | undefined
  >(undefined)

  const [inputBankName, outputBankName] = useMemo(() => {
    if (!inputBank || !outputBank) return ['', '']
    return [inputBank.name, outputBank.name]
  }, [inputBank, outputBank])

  const swapMarketName = useMemo(() => {
    if (!inputBankName || !outputBankName) return ''
    const inputSymbol = formatTokenSymbol(inputBankName)
    const outputSymbol = formatTokenSymbol(outputBankName)
    return flipPrices
      ? `${outputSymbol}/${inputSymbol}`
      : `${inputSymbol}/${outputSymbol}`
  }, [flipPrices, inputBankName, outputBankName])

  const handleSwapMouseEnter = useCallback(
    (
      swap: SwapHistoryItem | undefined,
      coingeckoPrice: string | number | undefined,
    ) => {
      if (swap) {
        setSwapTooltipData(swap)
      }
      if (coingeckoPrice) {
        setSwapTooltipCoingeckoPrice(coingeckoPrice)
      }
    },
    [setSwapTooltipData, setSwapTooltipCoingeckoPrice],
  )

  const handleSwapMouseLeave = useCallback(() => {
    setSwapTooltipData(null)
  }, [setSwapTooltipData])

  const renderTooltipContent = useCallback(
    (swap: SwapHistoryItem) => {
      const {
        swap_in_amount,
        swap_in_symbol,
        swap_out_price_usd,
        swap_out_amount,
        swap_out_symbol,
      } = swap

      const swapOutValue = swap_out_price_usd * swap_out_amount

      const baseMarketToken = swapMarketName.split('/')[0]

      const swapSide =
        swap_in_symbol === baseMarketToken
          ? !flipPrices
            ? 'sell'
            : 'buy'
          : !flipPrices
          ? 'buy'
          : 'sell'

      const buy = {
        price: swap_in_amount / swap_out_amount,
        priceSymbol: swap_in_symbol,
        amount: swap_out_amount,
        side: 'buy',
        symbol: swap_out_symbol,
        value: swapOutValue,
      }

      const sell = {
        price: swap_out_amount / swap_in_amount,
        priceSymbol: swap_out_symbol,
        amount: swap_in_amount,
        side: 'sell',
        symbol: swap_in_symbol,
        value: swapOutValue,
      }

      const swapProps =
        swapSide === 'buy'
          ? !flipPrices
            ? buy
            : sell
          : !flipPrices
          ? sell
          : buy

      const { amount, price, priceSymbol, side, symbol, value } = swapProps

      let coingeckoPercentageDifference = 0
      if (
        swapTooltipCoingeckoPrice &&
        typeof swapTooltipCoingeckoPrice === 'number'
      ) {
        const difference = ((price - swapTooltipCoingeckoPrice) / price) * 100
        coingeckoPercentageDifference = difference
      }

      const betterThanCoingecko =
        swapSide === 'buy'
          ? flipPrices
            ? coingeckoPercentageDifference > 0
            : coingeckoPercentageDifference < 0
          : flipPrices
          ? coingeckoPercentageDifference < 0
          : coingeckoPercentageDifference > 0

      return (
        <>
          <p className="text-center text-th-fgd-2">{`${t(
            side,
          )} ${amount} ${symbol} at ${formatNumericValue(
            price,
          )} ${priceSymbol} for ${formatCurrencyValue(value)}`}</p>
          {coingeckoPercentageDifference ? (
            <p
              className={`mt-0.5 text-center text-xs ${
                betterThanCoingecko ? 'text-th-up' : 'text-th-down'
              }`}
            >
              <span className="font-mono">
                {coingeckoPercentageDifference.toFixed(2)}%
              </span>{' '}
              {betterThanCoingecko ? 'better than' : 'worse than'} Coingecko
            </p>
          ) : null}
        </>
      )
    },
    [flipPrices, swapMarketName, swapTooltipCoingeckoPrice],
  )

  const {
    data: coingeckoData,
    isLoading,
    isFetching,
  } = useQuery(
    ['swap-chart-data', baseTokenId, quoteTokenId, daysToShow, flipPrices],
    () =>
      fetchChartData(
        baseTokenId,
        inputBank,
        quoteTokenId,
        outputBank,
        daysToShow,
        flipPrices,
      ),
    {
      cacheTime: 1000 * 60 * 15,
      staleTime: 1000 * 60 * 1,
      enabled: !!(baseTokenId && quoteTokenId),
      refetchOnWindowFocus: false,
    },
  )

  const chartSwapTimes = useMemo(() => {
    if (
      loadSwapHistory ||
      !swapHistory ||
      !swapHistory.length ||
      !inputBankName ||
      !outputBankName
    )
      return []
    const chartSymbols = [
      inputBankName === 'ETH (Portal)' ? 'ETH' : inputBankName,
      outputBankName === 'ETH (Portal)' ? 'ETH' : outputBankName,
    ]
    return swapHistory
      .filter(
        (swap) =>
          chartSymbols.includes(swap.swap_in_symbol) &&
          chartSymbols.includes(swap.swap_out_symbol),
      )
      .map((val) => dayjs(val.block_datetime).unix() * 1000)
  }, [swapHistory, loadSwapHistory, inputBankName, outputBankName])

  const swapHistoryPoints = useMemo(() => {
    if (!coingeckoData || !coingeckoData.length || !chartSwapTimes.length)
      return []
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
    if (!coingeckoData || !coingeckoData.length || coingeckoData.length < 2)
      return []
    const minTime = coingeckoData[0].time
    const maxTime = coingeckoData[coingeckoData.length - 1].time
    if (swapHistoryPoints.length && showSwaps) {
      const swapPoints = swapHistoryPoints.filter(
        (point) => point.time >= minTime && point.time <= maxTime,
      )
      return coingeckoData.concat(swapPoints).sort((a, b) => a.time - b.time)
    } else return coingeckoData
  }, [coingeckoData, swapHistoryPoints, showSwaps])

  const handleMouseMove: CategoricalChartFunc = useCallback(
    (coords) => {
      if (coords.activePayload) {
        setMouseData(coords.activePayload[0].payload)
      }
    },
    [setMouseData],
  )

  const handleMouseLeave = useCallback(() => {
    setMouseData(undefined)
  }, [setMouseData])

  useEffect(() => {
    if (!inputCoingeckoId || !outputCoingeckoId) return
    setBaseTokenId(inputCoingeckoId)
    setQuoteTokenId(outputCoingeckoId)
  }, [inputCoingeckoId, outputCoingeckoId])

  const calculateChartChange = useCallback(() => {
    if (!chartData?.length) return 0
    if (mouseData) {
      const index = chartData.findIndex((d) => d.time === mouseData.time)
      if (index === -1) return 0
      return (
        ((chartData[index]['price'] - chartData[0]['price']) /
          chartData[0]['price']) *
        100
      )
    } else {
      return (
        ((chartData[chartData.length - 1]['price'] - chartData[0]['price']) /
          chartData[0]['price']) *
        100
      )
    }
  }, [chartData, mouseData])

  return (
    <ContentBox hideBorder hidePadding className="h-full px-6 py-3">
      {isLoading || isFetching ? (
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
        <div className="relative h-full">
          {swapTooltipData ? (
            <div className="absolute bottom-2 left-1/2 z-10 w-full -translate-x-1/2 rounded-md border border-th-bkg-3 bg-th-bkg-1 px-4 py-2">
              {renderTooltipContent(swapTooltipData)}
            </div>
          ) : null}
          <div className="flex items-start justify-between">
            <div>
              {inputBankName && outputBankName ? (
                <div className="mb-0.5 flex items-center">
                  <p className="text-base text-th-fgd-3">{swapMarketName}</p>
                  <IconButton
                    className="px-2 text-th-fgd-3"
                    onClick={() =>
                      set((state) => {
                        state.swap.flipPrices = !flipPrices
                      })
                    }
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
                          chartData[chartData.length - 1].price,
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
                      'DD MMM YY, h:mma',
                    )}
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="mt-2 h-40 w-auto md:h-96">
            <div className="absolute right-0 top-[2px] -mb-2 flex items-center justify-end space-x-4">
              <FavoriteSwapButton
                inputToken={inputBank!.name}
                outputToken={outputBank!.name}
              />
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
                              mouseEnter={handleSwapMouseEnter}
                              mouseLeave={handleSwapMouseLeave}
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

export default React.memo(SwapTokenChart)
