/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
  Label,
} from 'recharts'
import FlipNumbers from 'react-flip-numbers'
import ContentBox from './ContentBox'
import SheenLoader from './SheenLoader'
import { COLORS } from '../../styles/colors'
import { ArrowsRightLeftIcon, NoSymbolIcon } from '@heroicons/react/20/solid'
import { FadeInFadeOut } from './Transitions'
import ChartRangeButtons from './ChartRangeButtons'
import Change from './Change'
import useLocalStorageState from 'hooks/useLocalStorageState'
import {
  ANIMATION_SETTINGS_KEY,
  DAILY_MILLISECONDS,
  PRIVACY_MODE,
  PRIVATE_MODE_STRING,
} from 'utils/constants'
import { formatNumericValue } from 'utils/numbers'
import { INITIAL_ANIMATION_SETTINGS } from '@components/settings/AnimationSettings'
import { AxisDomain } from 'recharts/types/util/types'
import { useTranslation } from 'next-i18next'
import FormatNumericValue from './FormatNumericValue'
import { ContentType } from 'recharts/types/component/Tooltip'
import Tooltip from './Tooltip'
import useThemeWrapper from 'hooks/useThemeWrapper'

dayjs.extend(relativeTime)

const titleClasses = 'mb-0.5 text-base'

interface DetailedAreaOrBarChartProps {
  changeAsPercent?: boolean
  chartType?: 'area' | 'bar'
  customTooltip?: ContentType<number, string>
  data: any[] | undefined
  daysToShow?: string
  domain?: AxisDomain
  heightClass?: string
  hideChange?: boolean
  hideAxis?: boolean
  isPrivate?: boolean
  loaderHeightClass?: string
  loading?: boolean
  prefix?: string
  setDaysToShow?: (x: string) => void
  small?: boolean
  suffix?: string
  tickFormat?: (x: number) => string
  title?: string
  tooltipContent?: string
  xKey: string
  formatXKeyHeading?: (k: string | number) => string
  xAxisLabel?: string
  xAxisType?: 'number' | 'category' | undefined
  yDecimals?: number
  yKey: string
  showZeroLine?: boolean
  tooltipDateFormat?: string
}

export const formatDateAxis = (date: string, days: number) => {
  if (days === 1) {
    return dayjs(date).format('h:mma')
  } else {
    return dayjs(date).format('D MMM')
  }
}

const DetailedAreaOrBarChart: FunctionComponent<
  DetailedAreaOrBarChartProps
> = ({
  changeAsPercent,
  chartType = 'area',
  customTooltip,
  data,
  daysToShow = '1',
  domain,
  heightClass,
  hideChange,
  hideAxis,
  isPrivate,
  loaderHeightClass,
  loading,
  prefix = '',
  setDaysToShow,
  showZeroLine,
  small,
  suffix = '',
  tickFormat,
  title,
  tooltipContent,
  tooltipDateFormat,
  xKey,
  formatXKeyHeading,
  xAxisLabel,
  xAxisType,
  yDecimals,
  yKey,
}) => {
  const { t } = useTranslation('common')
  const [mouseData, setMouseData] = useState<any>(null)
  const [showChangePercentage, setShowChangePercentage] = useState(
    changeAsPercent || false,
  )
  const { theme } = useThemeWrapper()
  const [animationSettings] = useLocalStorageState(
    ANIMATION_SETTINGS_KEY,
    INITIAL_ANIMATION_SETTINGS,
  )
  const [privacyMode] = useLocalStorageState(PRIVACY_MODE)

  const handleMouseMove = (coords: any) => {
    if (coords.activePayload) {
      setMouseData(coords.activePayload[0].payload)
    }
  }

  const handleMouseLeave = () => {
    setMouseData(null)
  }

  const flipGradientCoords = useMemo(() => {
    if (!data || !data.length) return
    return data[0][yKey] <= 0 && data[data.length - 1][yKey] < 0
  }, [data])

  const filteredData = useMemo(() => {
    if (!data || !data.length) return []
    if (xAxisType === 'number') return data
    const start = Number(daysToShow) * DAILY_MILLISECONDS
    const filtered = data.filter((d: any) => {
      const dataTime = new Date(d[xKey]).getTime()
      const now = new Date().getTime()
      const limit = now - start
      return dataTime >= limit
    })
    return filtered
  }, [data, daysToShow, xAxisType])

  const calculateChartChange = () => {
    if (filteredData.length) {
      let firstValue = filteredData[0][yKey]
      if (xAxisType === 'number') {
        const minValue = filteredData.reduce(
          (min, current) => (current[xKey] < min[xKey] ? current : min),
          filteredData[0],
        )
        firstValue = minValue[yKey]
      }
      if (mouseData) {
        const index = filteredData.findIndex(
          (d: any) => d[xKey] === mouseData[xKey],
        )
        const currentValue = filteredData[index]?.[yKey]

        const change =
          index >= 0
            ? showChangePercentage
              ? ((currentValue - firstValue) / Math.abs(firstValue)) * 100
              : currentValue - firstValue
            : 0
        return isNaN(change) ? 0 : change
      } else {
        const currentValue = filteredData[filteredData.length - 1][yKey]
        return showChangePercentage
          ? ((currentValue - firstValue) / Math.abs(firstValue)) * 100
          : currentValue - firstValue
      }
    }
    return 0
  }

  return (
    <FadeInFadeOut show={true}>
      <ContentBox hideBorder hidePadding>
        {loading ? (
          <SheenLoader className="flex flex-1">
            <div
              className={`${
                loaderHeightClass ? loaderHeightClass : 'h-96'
              } w-full rounded-lg bg-th-bkg-2`}
            />
          </SheenLoader>
        ) : (
          <div className="relative">
            {setDaysToShow ? (
              <div className="mb-4 sm:absolute sm:-top-1 sm:right-0 sm:mb-0 sm:flex sm:justify-end">
                <ChartRangeButtons
                  activeValue={daysToShow}
                  names={['24H', '7D', '30D']}
                  values={['1', '7', '30']}
                  onChange={(v) => setDaysToShow(v)}
                />
              </div>
            ) : null}
            {title ? (
              tooltipContent ? (
                <Tooltip content={tooltipContent}>
                  <p
                    className={`${titleClasses}
              tooltip-underline`}
                  >
                    {title}
                  </p>
                </Tooltip>
              ) : (
                <p className={titleClasses}>{title}</p>
              )
            ) : null}
            {filteredData.length ? (
              <>
                <div className="flex items-start justify-between">
                  <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
                    <div>
                      {mouseData ? (
                        <div>
                          <div
                            className={`flex items-end ${
                              small ? 'h-8 text-2xl' : 'mb-1 text-4xl'
                            } font-display text-th-fgd-1`}
                          >
                            {animationSettings['number-scroll'] ? (
                              isPrivate && privacyMode ? (
                                <span>{PRIVATE_MODE_STRING}</span>
                              ) : (
                                <FlipNumbers
                                  height={small ? 24 : 40}
                                  width={small ? 17 : 30}
                                  play
                                  numbers={`${
                                    mouseData[yKey] < 0 ? '-' : ''
                                  }${prefix}${formatNumericValue(
                                    Math.abs(mouseData[yKey]),
                                    yDecimals,
                                  )}${suffix}`}
                                />
                              )
                            ) : (
                              <span className="tabular-nums">
                                {mouseData[yKey] < 0 ? '-' : ''}
                                {prefix}
                                <FormatNumericValue
                                  value={Math.abs(mouseData[yKey])}
                                  decimals={yDecimals}
                                  isPrivate={isPrivate}
                                />
                                {suffix}
                              </span>
                            )}
                            {!hideChange ? (
                              <div
                                className={`ml-3 flex items-center ${
                                  small ? 'mb-[3px]' : 'mb-0.5'
                                }`}
                              >
                                <Change
                                  change={calculateChartChange()}
                                  decimals={
                                    !showChangePercentage ? yDecimals : 2
                                  }
                                  prefix={!showChangePercentage ? prefix : ''}
                                  suffix={!showChangePercentage ? suffix : '%'}
                                  isPrivate={isPrivate}
                                />
                                {changeAsPercent ? (
                                  <ToggleChangeTypeButton
                                    changeType={showChangePercentage}
                                    setChangeType={setShowChangePercentage}
                                  />
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                          <p
                            className={`${
                              small ? 'text-xs' : 'text-sm'
                            } text-th-fgd-4`}
                          >
                            {formatXKeyHeading
                              ? formatXKeyHeading(mouseData[xKey])
                              : dayjs(mouseData[xKey]).format(
                                  tooltipDateFormat
                                    ? tooltipDateFormat
                                    : 'DD MMM YY, h:mma',
                                )}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div
                            className={`flex items-end ${
                              small ? 'h-8 text-2xl' : 'mb-1 text-4xl'
                            } font-display text-th-fgd-1`}
                          >
                            {animationSettings['number-scroll'] ? (
                              isPrivate && privacyMode ? (
                                <span>{PRIVATE_MODE_STRING}</span>
                              ) : (
                                <FlipNumbers
                                  height={small ? 24 : 40}
                                  width={small ? 17 : 30}
                                  play
                                  numbers={`${
                                    filteredData[filteredData.length - 1][
                                      yKey
                                    ] < 0
                                      ? '-'
                                      : ''
                                  }${prefix}${formatNumericValue(
                                    Math.abs(
                                      filteredData[filteredData.length - 1][
                                        yKey
                                      ],
                                    ),
                                    yDecimals,
                                  )}${suffix}`}
                                />
                              )
                            ) : (
                              <span>
                                {filteredData[filteredData.length - 1][yKey] < 0
                                  ? '-'
                                  : ''}
                                {prefix}
                                <span className="tabular-nums">
                                  <FormatNumericValue
                                    value={
                                      data
                                        ? Math.abs(data[data.length - 1][yKey])
                                        : 0
                                    }
                                    decimals={yDecimals}
                                    isPrivate={isPrivate}
                                  />
                                </span>
                                {suffix}
                              </span>
                            )}
                            {!hideChange ? (
                              <div
                                className={`ml-3 flex items-center ${
                                  small ? 'mb-[3px]' : 'mb-0.5'
                                }`}
                              >
                                <Change
                                  change={calculateChartChange()}
                                  decimals={
                                    !showChangePercentage ? yDecimals : 2
                                  }
                                  prefix={!showChangePercentage ? prefix : ''}
                                  suffix={!showChangePercentage ? suffix : '%'}
                                  isPrivate={isPrivate}
                                />
                                {changeAsPercent ? (
                                  <ToggleChangeTypeButton
                                    changeType={showChangePercentage}
                                    setChangeType={setShowChangePercentage}
                                  />
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                          <p
                            className={`${
                              small ? 'text-xs' : 'text-sm'
                            } text-th-fgd-4`}
                          >
                            {formatXKeyHeading
                              ? formatXKeyHeading(
                                  filteredData[filteredData.length - 1][xKey],
                                )
                              : dayjs(
                                  filteredData[filteredData.length - 1][xKey],
                                ).format(
                                  tooltipDateFormat
                                    ? tooltipDateFormat
                                    : 'DD MMM YY, h:mma',
                                )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div
                  className={`-mt-1 ${
                    heightClass ? heightClass : 'h-96'
                  } w-auto`}
                >
                  <div className="-mx-6 mt-6 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'area' ? (
                        <AreaChart
                          data={filteredData}
                          onMouseMove={handleMouseMove}
                          onMouseLeave={handleMouseLeave}
                        >
                          <RechartsTooltip
                            cursor={{
                              strokeOpacity: 0.09,
                            }}
                            content={customTooltip ? customTooltip : <></>}
                          />
                          <defs>
                            <linearGradient
                              id={`gradientArea-${title?.replace(
                                /[^a-zA-Z]/g,
                                '',
                              )}`}
                              x1="0"
                              y1={flipGradientCoords ? '1' : '0'}
                              x2="0"
                              y2={flipGradientCoords ? '0' : '1'}
                            >
                              <stop
                                offset="0%"
                                stopColor={
                                  calculateChartChange() >= 0
                                    ? COLORS.UP[theme]
                                    : COLORS.DOWN[theme]
                                }
                                stopOpacity={0.15}
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
                            dataKey={yKey}
                            stroke={
                              isNaN(calculateChartChange())
                                ? COLORS.FGD4[theme]
                                : calculateChartChange() >= 0
                                ? COLORS.UP[theme]
                                : COLORS.DOWN[theme]
                            }
                            strokeWidth={1.5}
                            fill={`url(#gradientArea-${title?.replace(
                              /[^a-zA-Z]/g,
                              '',
                            )})`}
                          />
                          <XAxis
                            axisLine={false}
                            dataKey={xKey}
                            hide={hideAxis}
                            minTickGap={20}
                            padding={{ left: 20, right: 20 }}
                            tick={{
                              fill: 'var(--fgd-4)',
                              fontSize: 10,
                            }}
                            tickLine={false}
                            tickFormatter={
                              xAxisType !== 'number'
                                ? (d) => formatDateAxis(d, parseInt(daysToShow))
                                : undefined
                            }
                            type={xAxisType}
                          >
                            {xAxisLabel ? (
                              <Label
                                value={xAxisLabel}
                                offset={-2}
                                position="insideBottom"
                                fontSize={10}
                                fill="var(--fgd-3)"
                              />
                            ) : null}
                          </XAxis>
                          <YAxis
                            axisLine={false}
                            dataKey={yKey}
                            hide={hideAxis}
                            minTickGap={20}
                            type="number"
                            domain={
                              domain
                                ? domain
                                : ([dataMin, dataMax]) => {
                                    const difference = dataMax - dataMin

                                    if (difference < 0.01) {
                                      return [dataMin - 0.001, dataMax + 0.001]
                                    } else if (difference < 0.1) {
                                      return [dataMin - 0.01, dataMax + 0.01]
                                    } else if (difference < 1) {
                                      return [dataMin - 0.1, dataMax + 0.11]
                                    } else if (difference < 10) {
                                      return [dataMin - 1, dataMax + 1]
                                    } else {
                                      return [dataMin, dataMax]
                                    }
                                  }
                            }
                            padding={{ top: 20, bottom: 20 }}
                            tick={{
                              fill: 'var(--fgd-4)',
                              fontSize: 10,
                            }}
                            tickFormatter={
                              tickFormat ? (v) => tickFormat(v) : undefined
                            }
                            tickLine={false}
                          />
                          {showZeroLine ? (
                            <ReferenceLine
                              y={0}
                              stroke="var(--fgd-4)"
                              strokeDasharray="2 2"
                            />
                          ) : null}
                        </AreaChart>
                      ) : (
                        <BarChart
                          data={filteredData}
                          onMouseMove={handleMouseMove}
                          onMouseLeave={handleMouseLeave}
                        >
                          <RechartsTooltip
                            cursor={{
                              fill: 'var(--bkg-2)',
                              opacity: 0.5,
                            }}
                            content={customTooltip ? customTooltip : <></>}
                          />
                          <defs>
                            <linearGradient
                              id="greenGradientBar"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor={COLORS.UP[theme]}
                                stopOpacity={1}
                              />
                              <stop
                                offset="100%"
                                stopColor={COLORS.UP[theme]}
                                stopOpacity={0.7}
                              />
                            </linearGradient>
                            <linearGradient
                              id="redGradientBar"
                              x1="0"
                              y1="1"
                              x2="0"
                              y2="0"
                            >
                              <stop
                                offset="0%"
                                stopColor={COLORS.DOWN[theme]}
                                stopOpacity={1}
                              />
                              <stop
                                offset="100%"
                                stopColor={COLORS.DOWN[theme]}
                                stopOpacity={0.7}
                              />
                            </linearGradient>
                          </defs>
                          <Bar dataKey={yKey}>
                            {filteredData.map((entry, index) => {
                              return (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    entry[yKey] > 0
                                      ? 'url(#greenGradientBar)'
                                      : 'url(#redGradientBar)'
                                  }
                                />
                              )
                            })}
                          </Bar>
                          <XAxis
                            dataKey={xKey}
                            axisLine={false}
                            dy={10}
                            minTickGap={20}
                            padding={{ left: 20, right: 20 }}
                            tick={{
                              fill: 'var(--fgd-4)',
                              fontSize: 10,
                            }}
                            tickLine={false}
                            tickFormatter={(v) =>
                              formatDateAxis(v, parseInt(daysToShow))
                            }
                          />
                          <YAxis
                            dataKey={yKey}
                            interval="preserveStartEnd"
                            axisLine={false}
                            dx={-10}
                            padding={{ top: 20, bottom: 20 }}
                            tick={{
                              fill: 'var(--fgd-4)',
                              fontSize: 10,
                            }}
                            tickLine={false}
                            tickFormatter={
                              tickFormat ? (v) => tickFormat(v) : undefined
                            }
                            type="number"
                          />
                          <ReferenceLine y={0} stroke={COLORS.BKG4[theme]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <div
                className={`flex ${
                  heightClass ? heightClass : 'h-96'
                } mt-4 items-center justify-center rounded-lg border border-th-bkg-3 p-8 text-th-fgd-3`}
              >
                <div>
                  <NoSymbolIcon className="mx-auto mb-1 h-6 w-6 text-th-fgd-4" />
                  <p className="text-th-fgd-3">{t('no-data')}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </ContentBox>
    </FadeInFadeOut>
  )
}

export default DetailedAreaOrBarChart

const ToggleChangeTypeButton = ({
  changeType,
  setChangeType,
}: {
  changeType: boolean
  setChangeType: (isPercent: boolean) => void
}) => {
  return (
    <button
      className="ml-2 flex h-4 w-4 items-center justify-center text-th-fgd-3 focus:outline-none md:hover:text-th-active"
      onClick={() => setChangeType(!changeType)}
    >
      <ArrowsRightLeftIcon className="h-3.5 w-3.5" />
    </button>
  )
}
