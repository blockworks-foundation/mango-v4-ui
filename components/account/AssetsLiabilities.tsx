import { toUiDecimalsForQuote } from '@blockworks-foundation/mango-v4'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import { useTranslation } from 'next-i18next'
import { useMemo } from 'react'
import { Cell, Pie, PieChart } from 'recharts'
import { COLORS } from 'styles/colors'
import { formatCurrencyValue } from 'utils/numbers'
import FlipNumbers from 'react-flip-numbers'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { ANIMATION_SETTINGS_KEY } from 'utils/constants'
import { INITIAL_ANIMATION_SETTINGS } from '@components/settings/AnimationSettings'
import useThemeWrapper from 'hooks/useThemeWrapper'

const AssetsLiabilities = ({ isMobile }: { isMobile: boolean }) => {
  const { t } = useTranslation('account')
  const { group } = useMangoGroup()
  const { mangoAccount } = useMangoAccount()
  const { theme } = useThemeWrapper()
  const [animationSettings] = useLocalStorageState(
    ANIMATION_SETTINGS_KEY,
    INITIAL_ANIMATION_SETTINGS,
  )

  const [assetsValue, assetsRatio, liabsValue, liabsRatio] = useMemo(() => {
    if (!group || !mangoAccount) return [0, 0, 0, 0]
    const assets = toUiDecimalsForQuote(mangoAccount.getAssetsValue(group))
    const liabs = toUiDecimalsForQuote(mangoAccount.getLiabsValue(group))
    let assetsRatio = 0
    let liabsRatio = 0
    if (assets && liabs) {
      assetsRatio = (assets / (assets + liabs)) * 100
      liabsRatio = 100 - assetsRatio
    }
    return [assets, assetsRatio, liabs, liabsRatio]
  }, [group, mangoAccount])

  const chartData = useMemo(() => {
    if (!assetsValue && !liabsValue) return []
    return [
      { name: 'assets', value: assetsValue },
      { name: 'liabilities', value: liabsValue },
    ]
  }, [assetsValue, liabsValue])

  const pieSizes = isMobile
    ? { size: 160, outerRadius: 80, innerRadius: 64 }
    : { size: 80, outerRadius: 40, innerRadius: 30 }
  const { size, outerRadius, innerRadius } = pieSizes

  return (
    <div className="flex flex-col items-center pt-4 md:flex-row md:space-x-4">
      {mangoAccount && chartData.length ? (
        <PieChart width={size} height={size}>
          <Pie
            cursor="pointer"
            data={chartData}
            dataKey="value"
            cx="50%"
            cy="50%"
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            minAngle={2}
            startAngle={90}
            endAngle={450}
          >
            {chartData.map((entry, index) => {
              const fillColor =
                entry.name === 'assets' ? COLORS.UP[theme] : COLORS.DOWN[theme]
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={fillColor}
                  stroke={COLORS.BKG1[theme]}
                  strokeWidth={2}
                />
              )
            })}
          </Pie>
        </PieChart>
      ) : (
        <div className="h-20 w-20 rounded-full ring-[8px] ring-inset ring-th-bkg-3" />
      )}
      <div className="mt-3 flex space-x-6 md:mt-0">
        <div className="flex flex-col items-center md:items-start">
          <p className="text-base">
            {t('assets')}
            <span className="ml-2 rounded border border-th-up px-1 py-0.5 text-xxs text-th-up">
              {assetsRatio.toFixed()}%
            </span>
          </p>
          {animationSettings['number-scroll'] ? (
            <div className="font-display text-2xl text-th-fgd-1 sm:text-4xl">
              <FlipNumbers
                height={38}
                width={30}
                play
                delay={0.05}
                duration={1}
                numbers={formatCurrencyValue(assetsValue, 2)}
              />
            </div>
          ) : (
            <p className="font-display text-2xl text-th-fgd-1 sm:text-4xl">
              {formatCurrencyValue(assetsValue, 2)}
            </p>
          )}
        </div>
        <div className="flex flex-col items-center md:items-start">
          <p className="text-base">
            {t('liabilities')}
            <span className="ml-2 rounded border border-th-down px-1 py-0.5 text-xxs text-th-down">
              {liabsRatio.toFixed()}%
            </span>
          </p>
          {animationSettings['number-scroll'] ? (
            <div className="font-display text-2xl text-th-fgd-1 sm:text-4xl">
              <FlipNumbers
                height={38}
                width={30}
                play
                delay={0.05}
                duration={1}
                numbers={formatCurrencyValue(liabsValue, 2)}
              />
            </div>
          ) : (
            <p className="font-display text-2xl text-th-fgd-1 sm:text-4xl">
              {formatCurrencyValue(liabsValue, 2)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AssetsLiabilities
