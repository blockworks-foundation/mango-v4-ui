import { useTranslation } from 'next-i18next'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  SectorProps,
} from 'recharts'
import { COLORS } from 'styles/colors'
import { useMemo } from 'react'
import { formatCurrencyValue } from 'utils/numbers'
import { useViewport } from 'hooks/useViewport'
import { HealthContribution } from 'types'
import useThemeWrapper from 'hooks/useThemeWrapper'

const HealthContributionsChart = ({
  data,
  activeIndex,
  setActiveIndex,
}: {
  data: HealthContribution[]
  activeIndex: number | undefined
  setActiveIndex: (i: number | undefined) => void
}) => {
  const { t } = useTranslation(['common', 'account'])
  const { theme } = useThemeWrapper()
  const { isMobile } = useViewport()

  const handleMouseEnter = (data: HealthContribution, index: number) => {
    setActiveIndex(index)
  }

  const handleMouseLeave = () => {
    setActiveIndex(undefined)
  }

  const pieSizes = isMobile
    ? { size: 160, outerRadius: 80, innerRadius: 64 }
    : { size: 240, outerRadius: 120, innerRadius: 96 }
  const { size, outerRadius, innerRadius } = pieSizes

  const [chartHeroAsset, chartHeroValue] = useMemo(() => {
    if (!data.length) return [undefined, undefined]
    if (activeIndex === undefined) {
      const value = data.reduce((a, c) => {
        const assetOrLiabMultiplier = c.isAsset ? 1 : -1
        return a + c.contribution * assetOrLiabMultiplier
      }, 0)
      return [t('total'), value]
    } else {
      const asset = data[activeIndex]
      const assetOrLiabMultiplier = asset.isAsset ? 1 : -1
      const value = asset.contribution * assetOrLiabMultiplier
      return [asset.asset, value]
    }
  }, [activeIndex, data])

  const renderActiveShape = ({
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
  }: SectorProps) => {
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius! + 4}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    )
  }

  return data.length ? (
    <div className="mt-4 flex h-full w-full flex-col items-center">
      <div className="relative h-[168px] w-[168px] sm:h-[248px] sm:w-[248px]">
        <ResponsiveContainer height="100%" width="100%">
          <PieChart width={size} height={size}>
            <Pie
              cursor="pointer"
              data={data}
              dataKey="contribution"
              cx="50%"
              cy="50%"
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              minAngle={2}
              startAngle={90}
              endAngle={450}
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              // onClick={handleClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {data.map((entry, index) => {
                const fillColor = entry.isAsset
                  ? COLORS.UP[theme]
                  : COLORS.DOWN[theme]

                let opacity

                if (entry.isAsset) {
                  opacity = 1 - index * 0.1
                } else {
                  opacity = 1 - Math.abs((index - (data.length - 1)) * 0.1)
                }
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={fillColor}
                    opacity={opacity}
                    stroke="none"
                  />
                )
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {chartHeroValue !== undefined ? (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <p className="text-xs sm:text-sm">{chartHeroAsset}</p>
            <span className="text-base font-bold sm:text-xl">
              {formatCurrencyValue(chartHeroValue, 2)}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  ) : null
}

export default HealthContributionsChart
