import Slider from '@components/forms/Slider'
import useMarkPrice from 'hooks/useMarkPrice'
import useOrderbookSubscription, {
  cumOrderbookSide,
} from 'hooks/useOrderbookSubscription'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useViewport } from 'hooks/useViewport'
import { useTheme } from 'next-themes'
import { useCallback, useMemo, useState } from 'react'
import {
  XAxis,
  YAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
  Label,
} from 'recharts'
import { CategoricalChartFunc } from 'recharts/types/chart/generateCategoricalChart'
import { COLORS } from 'styles/colors'
import { floorToDecimal, getDecimalCount } from 'utils/numbers'
import { gridBreakpoints } from './TradeAdvancedPage'

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

const DepthChart = ({ grouping }: { grouping: number }) => {
  const { theme } = useTheme()
  const { serumOrPerpMarket } = useSelectedMarket()
  const [priceRangePercent, setPriceRangePercentPercent] = useState('5')
  const [mouseData, setMouseData] = useState<cumOrderbookSide | null>(null)
  const markPrice = useMarkPrice()
  const orderbook = useOrderbookSubscription(100, grouping)
  const { width } = useViewport()
  const increaseHeight = width ? width > gridBreakpoints.xxxl : false

  const mergeCumulativeData = (
    bids: cumOrderbookSide[],
    asks: cumOrderbookSide[]
  ) => {
    const bidsWithSide = bids.map((b) => ({ ...b, bids: b.cumulativeSize }))
    const asksWithSide = asks.map((a) => ({ ...a, asks: a.cumulativeSize }))
    return [...bidsWithSide, ...asksWithSide].sort((a, b) => a.price - b.price)
  }

  const chartData = useMemo(() => {
    if (!orderbook) return []
    return mergeCumulativeData(orderbook.bids, orderbook.asks)
  }, [orderbook])

  const findXDomainMax = (
    data: cumOrderbookSide[],
    yMin: number,
    yMax: number
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

  const yTickFormatter = useCallback(
    (tick: number | undefined) => {
      if (!tick) return
      if (!serumOrPerpMarket) return tick.toFixed(1)
      const tickDecimals = getDecimalCount(serumOrPerpMarket.tickSize)
      if (tickDecimals >= 7) {
        return tick.toExponential(3)
      } else return tick.toFixed(tickDecimals)
    },
    [serumOrPerpMarket]
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
        getDecimalCount(serumOrPerpMarket.tickSize)
      ).toString()
    },
    [serumOrPerpMarket]
  )

  const getSizeLabelPosition = useCallback(
    (size: number | undefined, price: number | undefined) => {
      if (!xMax || !size || !price || !markPrice) return `insideRight`
      const yPosition = price > markPrice ? 'Top' : 'Bottom'
      const midPoint = xMax / 2
      const xPosition = size > midPoint ? 'Left' : 'Right'
      return `inside${yPosition}${xPosition}` as LabelPosition
    },
    [xMax, markPrice]
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
    [markPrice, yMax, yMin]
  )

  const handleMouseMove: CategoricalChartFunc = (coords) => {
    if (coords?.activePayload) {
      setMouseData(coords.activePayload[0].payload)
    }
  }

  const handleMouseLeave = () => {
    setMouseData(null)
  }

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

  return (
    <>
      <div className="flex h-10 items-center border-b border-th-bkg-3 py-1 px-2">
        <div className="flex items-center">
          <span className="w-16 font-mono text-xs text-th-fgd-3">
            {priceRangePercent}%
          </span>
          <Slider
            amount={parseFloat(priceRangePercent)}
            max="50"
            min="0.5"
            onChange={(p) => setPriceRangePercentPercent(p)}
            step={0.5}
          />
        </div>
      </div>
      <div className={increaseHeight ? 'h-[570px]' : 'h-[482px]'}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            layout="vertical"
            margin={{
              top: 8,
              left: -12,
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
              tickCount={3}
              tickLine={false}
              tickFormatter={(tick) => yTickFormatter(tick) || tick}
            />
            <Area
              type="step"
              dataKey="bids"
              stroke={COLORS.UP[theme]}
              fill="url(#bidsGradient)"
            />
            <Area
              type="step"
              dataKey="asks"
              stroke={COLORS.DOWN[theme]}
              fill="url(#asksGradient)"
            />
            <ReferenceLine y={markPrice} stroke="var(--bkg-4)">
              <Label
                value={yTickFormatter(markPrice)}
                fontSize={8}
                fill="var(--fgd-2)"
                position="left"
                offset={7}
              />
            </ReferenceLine>
            <ReferenceLine
              y={mouseData?.price}
              stroke={getChartReferenceColor(mouseData?.price)}
              strokeDasharray="3, 3"
            >
              <Label
                value={yTickFormatter(mouseData?.price)}
                fontSize={8}
                fill={getChartReferenceColor(mouseData?.price)}
                position="left"
                offset={7}
              />
              <Label
                value={getPercentFromMarkPrice(mouseData?.price)}
                fontSize={8}
                fill={getChartReferenceColor(opposingMouseReference?.price)}
                position={getPercentLabelPosition(mouseData?.price)}
                offset={7}
              />
            </ReferenceLine>
            <ReferenceLine
              y={opposingMouseReference?.price}
              stroke={getChartReferenceColor(opposingMouseReference?.price)}
              strokeDasharray="3, 3"
            >
              <Label
                value={yTickFormatter(opposingMouseReference?.price)}
                fontSize={8}
                fill={getChartReferenceColor(opposingMouseReference?.price)}
                position="left"
                offset={7}
              />
              <Label
                value={getPercentFromMarkPrice(opposingMouseReference?.price)}
                fontSize={8}
                fill={getChartReferenceColor(mouseData?.price)}
                position={getPercentLabelPosition(
                  opposingMouseReference?.price
                )}
                offset={7}
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
                fontSize={8}
                fill="var(--fgd-2)"
                position={getSizeLabelPosition(
                  mouseData?.cumulativeSize,
                  mouseData?.price
                )}
                offset={7}
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
                  opposingMouseReference?.cumulativeSize
                )}
                fontSize={8}
                fill="var(--fgd-2)"
                position={getSizeLabelPosition(
                  opposingMouseReference?.cumulativeSize,
                  opposingMouseReference?.price
                )}
                offset={7}
              />
            </ReferenceLine>
            <defs>
              <linearGradient id="bidsGradient" x1="1" y1="0" x2="0" y2="0">
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
              <linearGradient id="asksGradient" x1="1" y1="0" x2="0" y2="0">
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
  )
}

export default DepthChart
