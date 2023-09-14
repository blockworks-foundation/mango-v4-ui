import Slider from '@components/forms/Slider'
import useMarkPrice from 'hooks/useMarkPrice'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useViewport } from 'hooks/useViewport'
import { useCallback, useMemo, useState } from 'react'
import {
  XAxis,
  YAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
  Label,
  LabelProps,
} from 'recharts'
import { CategoricalChartFunc } from 'recharts/types/chart/generateCategoricalChart'
import { COLORS } from 'styles/colors'
import { floorToDecimal, getDecimalCount } from 'utils/numbers'
import { CartesianViewBox } from 'recharts/types/util/types'
import { cumOrderbookSide } from 'types'
import mangoStore from '@store/mangoStore'
import { breakpoints } from 'utils/theme'
import useThemeWrapper from 'hooks/useThemeWrapper'

type LabelPosition =
  | 'left'
  | 'right'
  | 'center'
  | 'bottom'
  | 'insideLeft'
  | 'insideRight'
  | 'insideTop'
  | 'insideBottom'
  | 'insideTopLeft'
  | 'insideTopRight'
  | 'insideBottomLeft'
  | 'insideBottomRight'
  | 'top'

const Y_TICK_COUNT = 10

interface CustomLabel extends LabelProps {
  viewBox?: CartesianViewBox
}

const MarkPriceLabel = ({ value, viewBox }: CustomLabel) => {
  if (typeof value === 'string' && viewBox?.x && viewBox?.y) {
    const { x, y } = viewBox
    const valueLength = value.length
    const valueWidth = valueLength * 6
    return (
      <g>
        <foreignObject x={x - valueWidth} y={y - 10} width="100%" height={20}>
          <div className="w-max rounded bg-th-bkg-3 p-1 font-mono text-[9px] leading-none">
            {value}
          </div>
        </foreignObject>
      </g>
    )
  } else return null
}

type RawOrderbook = number[][]
type DepthOrderbookSide = {
  price: number
  size: number
  cumulativeSize: number
}

const DepthChart = () => {
  const { theme } = useThemeWrapper()
  const { serumOrPerpMarket } = useSelectedMarket()
  const [mouseData, setMouseData] = useState<cumOrderbookSide | null>(null)
  const markPrice = useMarkPrice()
  const orderbook = mangoStore((s) => s.selectedMarket.orderbook)
  const [priceRangePercent, setPriceRangePercentPercent] = useState('10')
  const { isTablet, width } = useViewport()
  const increaseHeight = width ? width > breakpoints['3xl'] : false

  const formatOrderbookData = (orderbook: RawOrderbook, markPrice: number) => {
    const maxPrice = markPrice * 4
    const minPrice = markPrice / 4
    const formattedBook = []

    let cumulativeSize = 0

    for (let i = 0; i < orderbook.length; i++) {
      const [price, size] = orderbook[i]

      cumulativeSize += size

      const object = {
        price: price,
        size: size,
        cumulativeSize: cumulativeSize,
      }

      if (price >= minPrice && price <= maxPrice) {
        formattedBook.push(object)
      }
    }
    return formattedBook
  }

  // format chart data for the bids and asks series
  const mergeCumulativeData = (
    bids: DepthOrderbookSide[],
    asks: DepthOrderbookSide[],
  ) => {
    const bidsWithSide = bids.map((b) => ({ ...b, bids: b.cumulativeSize }))
    const asksWithSide = asks.map((a) => ({ ...a, asks: a.cumulativeSize }))
    return [...bidsWithSide, ...asksWithSide].sort((a, b) => a.price - b.price)
  }

  const chartData = useMemo(() => {
    if (!orderbook || !serumOrPerpMarket || !markPrice) return []
    const formattedBids = formatOrderbookData(orderbook.bids, markPrice)
    const formattedAsks = formatOrderbookData(orderbook.asks, markPrice)
    return mergeCumulativeData(formattedBids, formattedAsks)
  }, [markPrice, orderbook, serumOrPerpMarket])

  // find the max value for the x-axis
  const findXDomainMax = (
    data: DepthOrderbookSide[],
    yMin: number,
    yMax: number,
  ) => {
    let closestItemForYMin = 0
    let minDifferenceForYMin = Infinity

    let closestItemForYMax = 0
    let minDifferenceForYMax = Infinity

    for (const item of data) {
      const differenceForYMin = Math.abs(item.price - yMin)
      const differenceForYMax = Math.abs(item.price - yMax)

      if (differenceForYMin < minDifferenceForYMin) {
        minDifferenceForYMin = differenceForYMin
        closestItemForYMin = item.cumulativeSize
      }

      if (differenceForYMax < minDifferenceForYMax) {
        minDifferenceForYMax = differenceForYMax
        closestItemForYMax = item.cumulativeSize
      }
    }

    return Math.max(closestItemForYMin, closestItemForYMax)
  }

  // calc axis domains
  const [xMax, yMin, yMax] = useMemo(() => {
    let xMax = 100
    let yMin = 0
    let yMax = 100

    if (markPrice) {
      yMin = markPrice / (1 + parseFloat(priceRangePercent) / 100)
      yMax = markPrice * (1 + parseFloat(priceRangePercent) / 100)
    }
    if (chartData.length) {
      xMax = findXDomainMax(chartData, yMin, yMax)
    }

    return [xMax, yMin, yMax]
  }, [chartData, markPrice, priceRangePercent])

  // get nearest data on the opposing side to the mouse
  const opposingMouseReference = useMemo(() => {
    if (!markPrice || !mouseData) return null
    const mousePrice = mouseData.price
    const difference = Math.abs(mousePrice - markPrice) / markPrice
    if (mousePrice >= markPrice) {
      const price = markPrice / (1 + difference)
      let closestItemBelow = null
      let minDifference = Infinity
      for (const item of chartData) {
        const difference = Math.abs(item.price - price)

        if (difference < minDifference) {
          minDifference = difference
          closestItemBelow = item
        }
      }
      return closestItemBelow
    } else {
      const price = markPrice * (1 + difference)
      let closestItemAbove = null
      let minDifference = Infinity
      for (const item of chartData) {
        const difference = Math.abs(item.price - price)

        if (difference < minDifference) {
          minDifference = difference
          closestItemAbove = item
        }
      }
      return closestItemAbove
    }
  }, [markPrice, mouseData])

  const priceFormatter = useCallback(
    (price: number) => {
      if (!serumOrPerpMarket) return price.toFixed()
      const tickDecimals = getDecimalCount(serumOrPerpMarket.tickSize)
      if (tickDecimals >= 7) {
        return price.toExponential(3)
      } else return price.toFixed(tickDecimals)
    },
    [serumOrPerpMarket],
  )

  const xTickFormatter = useCallback(
    (size: number) => {
      if (!serumOrPerpMarket) return size.toFixed()
      const minOrderDecimals = getDecimalCount(serumOrPerpMarket.minOrderSize)
      return size.toFixed(minOrderDecimals)
    },
    [serumOrPerpMarket],
  )

  const isWithinRangeOfTick = useCallback(
    (value: number, baseValue: number) => {
      const difference = Math.abs(value - baseValue)
      const range = (yMax - yMin) / Y_TICK_COUNT

      return difference <= range
    },
    [yMin, yMax],
  )

  const yTickFormatter = useCallback(
    (tick: number) => {
      if ((markPrice && isWithinRangeOfTick(markPrice, tick)) || mouseData) {
        return ''
      }
      return priceFormatter(tick)
    },
    [markPrice, mouseData],
  )

  const getChartReferenceColor = (price: number | undefined) => {
    if (!price || !markPrice) return 'var(--fgd-2)'
    return price > markPrice ? 'var(--down)' : 'var(--up)'
  }

  const getPercentFromMarkPrice = (price: number | undefined) => {
    if (!price || !markPrice) return
    const percentDif = ((price - markPrice) / markPrice) * 100
    return `${percentDif.toFixed(2)}%`
  }

  const getSizeFromMouseData = useCallback(
    (size: number | undefined) => {
      if (!size || !serumOrPerpMarket) return
      return floorToDecimal(
        size,
        getDecimalCount(serumOrPerpMarket.tickSize),
      ).toString()
    },
    [serumOrPerpMarket],
  )

  const getSizeLabelPosition = useCallback(
    (size: number | undefined, price: number | undefined) => {
      if (!xMax || !size || !price || !markPrice) return `insideRight`
      const yPosition = price > markPrice ? 'Top' : 'Bottom'
      const midPoint = xMax / 2
      const xPosition = size > midPoint ? 'Left' : 'Right'
      return `inside${yPosition}${xPosition}` as LabelPosition
    },
    [xMax, markPrice],
  )

  const getPercentLabelPosition = useCallback(
    (price: number | undefined) => {
      if (!markPrice || !price || !yMax || !yMin) return 'bottom'
      const upperMidPoint = (markPrice + yMax) / 2
      const lowerMidPoint = (markPrice + yMin) / 2
      return price > markPrice
        ? price > upperMidPoint
          ? 'bottom'
          : 'top'
        : price > lowerMidPoint
        ? 'bottom'
        : 'top'
    },
    [markPrice, yMax, yMin],
  )

  const handleMouseMove: CategoricalChartFunc = (coords) => {
    if (coords?.activePayload) {
      setMouseData(coords.activePayload[0].payload)
    }
  }

  const handleMouseLeave = () => {
    setMouseData(null)
  }

  return chartData.length ? (
    <>
      <div className="flex h-10 items-center border-b border-th-bkg-3 px-2 py-1">
        <div className="flex w-full items-center">
          <span className="w-16 font-mono text-xs text-th-fgd-3">
            {priceRangePercent}%
          </span>
          <Slider
            amount={parseFloat(priceRangePercent)}
            max="100"
            min="0.5"
            onChange={(p) => setPriceRangePercentPercent(p)}
            step={0.5}
          />
        </div>
      </div>
      <div
        className={
          increaseHeight ? 'h-[570px]' : isTablet ? 'h-[538px]' : 'h-[482px]'
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            layout="vertical"
            margin={{
              top: 8,
              left: -8,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <XAxis
              axisLine={false}
              reversed={true}
              domain={[() => 0, () => xMax]}
              type="number"
              tick={false}
              tickLine={false}
              tickFormatter={(tick) => xTickFormatter(tick)}
            />
            <YAxis
              dataKey="price"
              reversed={true}
              domain={[() => yMin, () => yMax]}
              axisLine={false}
              tick={{
                fill: 'var(--fgd-4)',
                fontSize: 8,
              }}
              tickCount={Y_TICK_COUNT}
              tickLine={false}
              tickFormatter={(tick) => yTickFormatter(tick)}
            />
            <Area
              type="stepBefore"
              dataKey="bids"
              stroke={COLORS.UP[theme]}
              fill="url(#bidsGradient)"
              isAnimationActive={false}
              strokeWidth={1}
            />
            <Area
              type="stepBefore"
              dataKey="asks"
              stroke={COLORS.DOWN[theme]}
              fill="url(#asksGradient)"
              isAnimationActive={false}
              strokeWidth={1}
            />
            <ReferenceLine
              y={mouseData?.price}
              stroke={getChartReferenceColor(mouseData?.price)}
              strokeDasharray="3, 3"
            >
              <Label
                value={mouseData ? priceFormatter(mouseData.price) : ''}
                fontSize={9}
                fill={getChartReferenceColor(mouseData?.price)}
                position="left"
                offset={5}
              />
              <Label
                value={getPercentFromMarkPrice(mouseData?.price)}
                fontSize={9}
                fill={getChartReferenceColor(opposingMouseReference?.price)}
                position={getPercentLabelPosition(mouseData?.price)}
                offset={6}
              />
            </ReferenceLine>
            <ReferenceLine
              y={opposingMouseReference?.price}
              stroke={getChartReferenceColor(opposingMouseReference?.price)}
              strokeDasharray="3, 3"
            >
              <Label
                value={
                  opposingMouseReference
                    ? priceFormatter(opposingMouseReference.price)
                    : ''
                }
                fontSize={9}
                fill={getChartReferenceColor(opposingMouseReference?.price)}
                position="left"
                offset={5}
              />
              <Label
                value={getPercentFromMarkPrice(opposingMouseReference?.price)}
                fontSize={9}
                fill={getChartReferenceColor(mouseData?.price)}
                position={getPercentLabelPosition(
                  opposingMouseReference?.price,
                )}
                offset={6}
              />
            </ReferenceLine>
            <ReferenceLine
              stroke={getChartReferenceColor(mouseData?.price)}
              strokeDasharray="3, 3"
              segment={
                mouseData && mouseData?.price >= markPrice
                  ? [
                      { x: mouseData?.cumulativeSize, y: markPrice },
                      { x: mouseData?.cumulativeSize, y: yMax },
                    ]
                  : [
                      { x: mouseData?.cumulativeSize, y: yMin },
                      { x: mouseData?.cumulativeSize, y: markPrice },
                    ]
              }
            >
              <Label
                value={getSizeFromMouseData(mouseData?.cumulativeSize)}
                fontSize={9}
                fill={getChartReferenceColor(mouseData?.price)}
                position={getSizeLabelPosition(
                  mouseData?.cumulativeSize,
                  mouseData?.price,
                )}
                offset={6}
              />
            </ReferenceLine>
            <ReferenceLine
              stroke={getChartReferenceColor(opposingMouseReference?.price)}
              strokeDasharray="3, 3"
              segment={
                opposingMouseReference &&
                opposingMouseReference?.price >= markPrice
                  ? [
                      {
                        x: opposingMouseReference?.cumulativeSize,
                        y: markPrice,
                      },
                      { x: opposingMouseReference?.cumulativeSize, y: yMax },
                    ]
                  : [
                      { x: opposingMouseReference?.cumulativeSize, y: yMin },
                      {
                        x: opposingMouseReference?.cumulativeSize,
                        y: markPrice,
                      },
                    ]
              }
            >
              <Label
                value={getSizeFromMouseData(
                  opposingMouseReference?.cumulativeSize,
                )}
                fontSize={9}
                fill={getChartReferenceColor(opposingMouseReference?.price)}
                position={getSizeLabelPosition(
                  opposingMouseReference?.cumulativeSize,
                  opposingMouseReference?.price,
                )}
                offset={6}
              />
            </ReferenceLine>
            {markPrice ? (
              <ReferenceLine y={markPrice} stroke="var(--bkg-4)">
                <Label
                  value={priceFormatter(markPrice)}
                  content={<MarkPriceLabel />}
                />
              </ReferenceLine>
            ) : null}
            <defs>
              <linearGradient id="bidsGradient" x1="0" y1="0" x2="1" y2="0">
                <stop
                  offset="0%"
                  stopColor={COLORS.UP[theme]}
                  stopOpacity={0.15}
                />
                <stop
                  offset="99%"
                  stopColor={COLORS.UP[theme]}
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="asksGradient" x1="0" y1="0" x2="1" y2="0">
                <stop
                  offset="0%"
                  stopColor={COLORS.DOWN[theme]}
                  stopOpacity={0.15}
                />
                <stop
                  offset="99%"
                  stopColor={COLORS.DOWN[theme]}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  ) : null
}

export default DepthChart
