/* eslint-disable @typescript-eslint/no-explicit-any */
import { Bank } from '@blockworks-foundation/mango-v4'
import { INITIAL_ANIMATION_SETTINGS } from '@components/settings/AnimationSettings'
import ContentBox from '@components/shared/ContentBox'
import { FadeInFadeOut } from '@components/shared/Transitions'
import useLocalStorageState from 'hooks/useLocalStorageState'
import useThemeWrapper from 'hooks/useThemeWrapper'
import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Label,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { COLORS } from 'styles/colors'
import { ANIMATION_SETTINGS_KEY } from 'utils/constants'
import FlipNumbers from 'react-flip-numbers'
import { floorToDecimal, formatNumericValue } from 'utils/numbers'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { useTranslation } from 'react-i18next'
import { NoSymbolIcon } from '@heroicons/react/20/solid'

type RateCurveData = {
  util: number
  rate: number
}

const RateCurveChart = ({ bank }: { bank: Bank | undefined }) => {
  const { t } = useTranslation(['common', 'token'])
  const { theme } = useThemeWrapper()
  const [animationSettings] = useLocalStorageState(
    ANIMATION_SETTINGS_KEY,
    INITIAL_ANIMATION_SETTINGS,
  )
  const [mouseData, setMouseData] = useState<RateCurveData | null>(null)

  const handleMouseMove = (coords: any) => {
    if (coords.activePayload) {
      setMouseData(coords.activePayload[0].payload)
    }
  }

  const handleMouseLeave = () => {
    setMouseData(null)
  }

  const [currentRate, currentUtil] = useMemo(() => {
    if (!bank) return [0, 0]
    const currentRate = bank.getBorrowRateUi()
    const currentUtil = (bank.uiBorrows() / bank.uiDeposits()) * 100 || 0
    return [currentRate, currentUtil]
  }, [bank])

  const rateCurveChartData = useMemo(() => {
    if (!bank) return []
    const defaults = [
      { util: 0, rate: 0 },
      {
        util: bank.util0.toNumber() * 100,
        rate:
          (bank.rate0.toNumber() * bank.interestCurveScaling +
            bank.loanFeeRate.toNumber()) *
          100,
      },
      {
        util: bank.util1.toNumber() * 100,
        rate:
          (bank.rate1.toNumber() * bank.interestCurveScaling +
            bank.loanFeeRate.toNumber()) *
          100,
      },
      {
        util: 100,
        rate:
          (bank.maxRate.toNumber() * bank.interestCurveScaling +
            bank.loanFeeRate.toNumber()) *
          100,
      },
    ]
    if (currentRate && currentUtil) {
      defaults.push({ util: currentUtil, rate: currentRate })
    }
    return defaults.sort((a, b) => a.util - b.util)
  }, [bank, currentRate, currentUtil])

  return (
    <FadeInFadeOut show={true}>
      <ContentBox hideBorder hidePadding>
        {rateCurveChartData.length && bank ? (
          <>
            <div>
              <p className="mb-0.5 text-base">{t('token:borrow-rate-curve')}</p>
              {mouseData ? (
                <div>
                  <div
                    className={`flex h-8 items-end font-display text-2xl text-th-fgd-1`}
                  >
                    {animationSettings['number-scroll'] ? (
                      <FlipNumbers
                        height={24}
                        width={17}
                        play
                        numbers={`${formatNumericValue(
                          Math.abs(mouseData.rate),
                          2,
                        )}%`}
                      />
                    ) : (
                      <span className="tabular-nums">
                        <FormatNumericValue
                          value={Math.abs(mouseData.rate)}
                          decimals={2}
                        />
                        %
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-th-fgd-4">
                    {t('utilization')}:{' '}
                    <span className="font-mono text-th-fgd-2">
                      {floorToDecimal(mouseData.util, 2).toString()}%
                    </span>
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex h-8 items-end font-display text-2xl text-th-fgd-1">
                    {animationSettings['number-scroll'] ? (
                      <FlipNumbers
                        height={24}
                        width={17}
                        play
                        numbers={`${formatNumericValue(currentRate)}%`}
                      />
                    ) : (
                      <span>
                        <span className="tabular-nums">
                          <FormatNumericValue
                            value={currentRate}
                            decimals={2}
                          />
                        </span>
                        %
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-th-fgd-4">
                    {t('utilization')}:{' '}
                    <span className="font-mono text-th-fgd-2">
                      {floorToDecimal(currentUtil, 2).toString()}%
                    </span>
                  </p>
                </div>
              )}
            </div>
            <div className="-mx-6 mt-2 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={rateCurveChartData}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <defs>
                    <linearGradient
                      id="gradientArea-rate-curve"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
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
                  </defs>
                  <Area
                    isAnimationActive={false}
                    type="linear"
                    dataKey="rate"
                    stroke={COLORS.UP[theme]}
                    strokeWidth={1.5}
                    fill="url(#gradientArea-rate-curve)"
                  />
                  <XAxis
                    axisLine={false}
                    dataKey="util"
                    minTickGap={20}
                    padding={{ left: 20, right: 20 }}
                    tick={{
                      fill: 'var(--fgd-4)',
                      fontSize: 10,
                    }}
                    tickLine={false}
                    tickFormatter={(d) => `${floorToDecimal(d, 2).toString()}%`}
                    type="number"
                  />
                  <YAxis
                    axisLine={false}
                    dataKey="rate"
                    minTickGap={20}
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    padding={{ top: 20, bottom: 20 }}
                    tick={{
                      fill: 'var(--fgd-4)',
                      fontSize: 10,
                    }}
                    tickFormatter={(v) => `${floorToDecimal(v, 2).toString()}%`}
                    tickLine={false}
                  />
                  <ReferenceDot
                    x={(
                      (bank.uiBorrows() / bank.uiDeposits()) *
                      100
                    ).toString()}
                    y={bank.getBorrowRateUi()}
                    r={4}
                    fill={COLORS.BKG1[theme]}
                    stroke={'var(--active)'}
                    strokeWidth={2}
                    isFront
                  >
                    <Label
                      value="Current"
                      offset={12}
                      position="top"
                      fill="var(--fgd-2)"
                      fontSize={12}
                    />
                  </ReferenceDot>
                  <Tooltip
                    cursor={{
                      strokeOpacity: 0.09,
                    }}
                    content={<></>}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div
            className={`flex h-72 items-center justify-center p-4 text-th-fgd-3`}
          >
            <div className="">
              <NoSymbolIcon className="mx-auto mb-1 h-6 w-6 text-th-fgd-4" />
              <p className="text-th-fgd-4">{t('chart-unavailable')}</p>
            </div>
          </div>
        )}
      </ContentBox>
    </FadeInFadeOut>
  )
}

export default RateCurveChart
