import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'
import { Cell, Pie, PieChart, Tooltip } from 'recharts'
import { COLORS } from 'styles/colors'
import { formatCurrencyValue } from 'utils/numbers'
import { formatTokenSymbol } from 'utils/tokens'
import { HealthContribution } from './HealthContributions'

interface CustomTooltipProps {
  active?: boolean
  contributions: HealthContribution[]
  payload?: { payload: HealthContribution }[]
  label?: string | number
}

const HealthContributionsChart = ({ data }: { data: HealthContribution[] }) => {
  const { t } = useTranslation('account')
  const { theme } = useTheme()

  const pieSizes = { size: 160, outerRadius: 80, innerRadius: 64 }
  const { size, outerRadius, innerRadius } = pieSizes

  const CustomTooltip = ({
    active,
    contributions,
    payload,
  }: CustomTooltipProps) => {
    if (active && payload) {
      const isActivePayload = payload[0].payload.asset
      const total = contributions.reduce((a, c) => {
        const assetOrLiability = c.isAsset ? 1 : -1
        return a + c.contribution * assetOrLiability
      }, 0)

      return (
        <div className="rounded-md bg-th-bkg-2 p-4 focus:outline-none">
          <div className="space-y-1">
            {contributions
              .sort((a, b) => b.contribution - a.contribution)
              .map((asset) => {
                const assetOrLiability = asset.isAsset ? 1 : -1
                return (
                  <div
                    className="flex items-center justify-between"
                    key={asset.asset + asset.contribution}
                  >
                    <p
                      className={`whitespace-nowrap ${
                        isActivePayload === asset.asset ? 'text-th-active' : ''
                      }`}
                    >
                      {formatTokenSymbol(asset.asset)}
                    </p>
                    <p
                      className={`pl-4 font-mono ${
                        asset.isAsset ? 'text-th-up' : 'text-th-down'
                      }`}
                    >
                      {formatCurrencyValue(
                        asset.contribution * assetOrLiability
                      )}
                    </p>
                  </div>
                )
              })}
          </div>
          <div className="mt-3 flex justify-between border-t border-th-bkg-4 pt-3">
            <p>{t('total')}</p>
            <p className="pl-4 font-mono text-th-fgd-2">
              {formatCurrencyValue(total)}
            </p>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="flex flex-col items-center pt-4 md:flex-row md:space-x-4">
      {data.length ? (
        <PieChart width={size} height={size}>
          <Tooltip
            cursor={{
              fill: 'var(--bkg-2)',
              opacity: 0.5,
            }}
            content={<CustomTooltip contributions={data} />}
            position={{ x: 88, y: 0 }}
          />
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
          >
            {data.map((entry, index) => {
              const fillColor = entry.isAsset
                ? COLORS.UP[theme]
                : COLORS.DOWN[theme]
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={fillColor}
                  stroke={COLORS.BKG1[theme]}
                  strokeWidth={1}
                />
              )
            })}
          </Pie>
        </PieChart>
      ) : (
        <div className="h-20 w-20 rounded-full ring-[8px] ring-inset ring-th-bkg-3" />
      )}
    </div>
  )
}

export default HealthContributionsChart
