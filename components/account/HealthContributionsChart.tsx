import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  SectorProps,
} from 'recharts'
import { COLORS } from 'styles/colors'
import { HealthContribution } from './HealthContributions'
import { useMemo, useState } from 'react'
import { formatCurrencyValue } from 'utils/numbers'
import mangoStore from '@store/mangoStore'
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import TokenLogo from '@components/shared/TokenLogo'
import MarketLogos from '@components/trade/MarketLogos'

const HealthContributionsChart = ({ data }: { data: HealthContribution[] }) => {
  const { t } = useTranslation(['common', 'account'])
  const { theme } = useTheme()
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)

  const handleLegendClick = (entry: HealthContribution, index: number) => {
    setActiveIndex(index)
  }

  const handleMouseEnter = (data: HealthContribution, index: number) => {
    setActiveIndex(index)
  }

  const handleMouseLeave = () => {
    setActiveIndex(undefined)
  }

  const pieSizes = { size: 240, outerRadius: 120, innerRadius: 96 }
  const { size, outerRadius, innerRadius } = pieSizes

  const filteredData = useMemo(() => {
    if (!data.length) return []
    return data
      .filter((cont) => cont.contribution > 0.01)
      .sort((a, b) => {
        const aMultiplier = a.isAsset ? 1 : -1
        const bMultiplier = b.isAsset ? 1 : -1
        return b.contribution * bMultiplier - a.contribution * aMultiplier
      })
  }, [data])

  const [chartHeroAsset, chartHeroValue] = useMemo(() => {
    if (!filteredData.length) return [undefined, undefined]
    if (activeIndex === undefined) {
      const value = filteredData.reduce((a, c) => {
        const assetOrLiabMultiplier = c.isAsset ? 1 : -1
        return a + c.contribution * assetOrLiabMultiplier
      }, 0)
      return [t('total'), value]
    } else {
      const asset = filteredData[activeIndex]
      const assetOrLiabMultiplier = asset.isAsset ? 1 : -1
      const value = asset.contribution * assetOrLiabMultiplier
      return [asset.asset, value]
    }
  }, [activeIndex, filteredData])

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

  const renderLegendLogo = (asset: string) => {
    const group = mangoStore.getState().group
    if (!group)
      return <QuestionMarkCircleIcon className="h-6 w-6 text-th-fgd-3" />
    const isSpotMarket = asset.includes('/')
    if (isSpotMarket) {
      const market = group.getSerum3MarketByName(asset)
      return market ? (
        <MarketLogos market={market} size="small" />
      ) : (
        <QuestionMarkCircleIcon className="h-6 w-6 text-th-fgd-3" />
      )
    } else {
      const bank = group.banksMapByName.get(asset)?.[0]
      return bank ? (
        <div className="mr-1.5">
          <TokenLogo bank={bank} size={16} />
        </div>
      ) : (
        <QuestionMarkCircleIcon className="h-6 w-6 text-th-fgd-3" />
      )
    }
  }

  return filteredData.length ? (
    <div className="flex h-full w-full flex-col items-center">
      <div className="relative h-[248px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart width={size} height={size}>
            <Pie
              cursor="pointer"
              data={filteredData}
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
              onClick={handleLegendClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {filteredData.map((entry, index) => {
                const fillColor = entry.isAsset
                  ? COLORS.UP[theme]
                  : COLORS.DOWN[theme]
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={fillColor}
                    opacity={1 / ((index + 1) / 2.5)}
                    stroke="none"
                  />
                )
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {chartHeroValue ? (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <p>{chartHeroAsset}</p>
            <span className="text-xl font-bold">
              {formatCurrencyValue(chartHeroValue)}
            </span>
          </div>
        ) : null}
      </div>
      <div className="mt-6 flex max-w-[420px] flex-wrap justify-center space-x-4">
        {filteredData.map((d, i) => (
          <div
            key={d.asset + i}
            className={`default-transition flex h-7 cursor-pointer items-center ${
              activeIndex !== undefined && activeIndex !== i ? 'opacity-60' : ''
            }`}
            onClick={() => handleLegendClick(d, i)}
            onMouseEnter={() => handleMouseEnter(d, i)}
            onMouseLeave={handleMouseLeave}
          >
            {renderLegendLogo(d.asset)}
            <p
              className={`default-transition ${
                activeIndex === i ? 'text-th-fgd-1' : ''
              }`}
            >
              {d.asset}
            </p>
          </div>
        ))}
      </div>
    </div>
  ) : null
}

export default HealthContributionsChart
