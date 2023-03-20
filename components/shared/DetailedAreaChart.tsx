/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import FlipNumbers from 'react-flip-numbers'
import ContentBox from '../shared/ContentBox'
import SheenLoader from '../shared/SheenLoader'
import { COLORS } from '../../styles/colors'
import { useTheme } from 'next-themes'
import { IconButton } from './Button'
import { ArrowLeftIcon, NoSymbolIcon } from '@heroicons/react/20/solid'
import { FadeInFadeOut } from './Transitions'
import ChartRangeButtons from './ChartRangeButtons'
import Change from './Change'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { ANIMATION_SETTINGS_KEY } from 'utils/constants'
import { formatNumericValue } from 'utils/numbers'
import { INITIAL_ANIMATION_SETTINGS } from '@components/settings/AnimationSettings'
import { AxisDomain } from 'recharts/types/util/types'
import { useTranslation } from 'next-i18next'
import FormatNumericValue from './FormatNumericValue'

dayjs.extend(relativeTime)

interface DetailedAreaChartProps {
  data: any[]
  daysToShow?: string
  domain?: AxisDomain
  heightClass?: string
  hideChange?: boolean
  hideChart?: () => void
  loaderHeightClass?: string
  loading?: boolean
  prefix?: string
  setDaysToShow?: (x: string) => void
  small?: boolean
  suffix?: string
  tickFormat?: (x: number) => string
  title?: string
  xKey: string
  yDecimals?: number
  yKey: string
}

export const formatDateAxis = (date: string, days: number) => {
  if (days === 1) {
    return dayjs(date).format('h:mma')
  } else {
    return dayjs(date).format('D MMM')
  }
}

const DetailedAreaChart: FunctionComponent<DetailedAreaChartProps> = ({
  data,
  daysToShow = '1',
  domain,
  heightClass,
  hideChange,
  hideChart,
  loaderHeightClass,
  loading,
  prefix = '',
  setDaysToShow,
  small,
  suffix = '',
  tickFormat,
  title,
  xKey,
  yDecimals,
  yKey,
}) => {
  const { t } = useTranslation('common')
  const [mouseData, setMouseData] = useState<any>(null)
  const { theme } = useTheme()
  const [animationSettings] = useLocalStorageState(
    ANIMATION_SETTINGS_KEY,
    INITIAL_ANIMATION_SETTINGS
  )

  const handleMouseMove = (coords: any) => {
    if (coords.activePayload) {
      setMouseData(coords.activePayload[0].payload)
    }
  }

  const handleMouseLeave = () => {
    setMouseData(null)
  }

  const flipGradientCoords = useMemo(() => {
    if (!data.length) return
    return data[0][yKey] <= 0 && data[data.length - 1][yKey] <= 0
  }, [data])

  const filteredData = useMemo(() => {
    if (!data.length) return []
    const start = Number(daysToShow) * 86400000
    const filtered = data.filter((d: any) => {
      const dataTime = new Date(d[xKey]).getTime()
      const now = new Date().getTime()
      const limit = now - start
      return dataTime >= limit
    })
    return filtered
  }, [data, daysToShow])

  const calculateChartChange = () => {
    if (filteredData.length) {
      if (mouseData) {
        const index = filteredData.findIndex(
          (d: any) => d[xKey] === mouseData[xKey]
        )
        const change =
          index >= 0 ? filteredData[index][yKey] - filteredData[0][yKey] : 0
        return isNaN(change) ? 0 : change
      } else
        return (
          filteredData[filteredData.length - 1][yKey] - filteredData[0][yKey]
        )
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
        ) : filteredData.length ? (
          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
                {hideChart ? (
                  <IconButton
                    className="mb-6"
                    onClick={hideChart}
                    size="medium"
                  >
                    <ArrowLeftIcon className="h-5 w-5" />
                  </IconButton>
                ) : null}
                <div>
                  <p
                    className={`${
                      small ? 'text-sm' : 'mb-0.5 text-base'
                    } text-th-fgd-3`}
                  >
                    {title}
                  </p>
                  {mouseData ? (
                    <div>
                      <div
                        className={`flex ${
                          small
                            ? 'h-8 items-center text-2xl'
                            : 'mb-1 items-end text-4xl'
                        } font-display text-th-fgd-1`}
                      >
                        {animationSettings['number-scroll'] ? (
                          <FlipNumbers
                            height={small ? 24 : 40}
                            width={small ? 17 : 30}
                            play
                            numbers={`${
                              mouseData[yKey] < 0 ? '-' : ''
                            }${prefix}${formatNumericValue(
                              Math.abs(mouseData[yKey]),
                              yDecimals
                            )}${suffix}`}
                          />
                        ) : (
                          <span>
                            {mouseData[yKey] < 0 ? '-' : ''}
                            {prefix}
                            <FormatNumericValue
                              value={Math.abs(mouseData[yKey])}
                              decimals={yDecimals}
                            />
                            {suffix}
                          </span>
                        )}
                        {!hideChange ? (
                          <span className="ml-3">
                            <Change
                              change={calculateChartChange()}
                              decimals={yDecimals}
                              prefix={prefix}
                              suffix={suffix}
                            />
                          </span>
                        ) : null}
                      </div>
                      <p
                        className={`${
                          small ? 'text-xs' : 'text-sm'
                        } text-th-fgd-4`}
                      >
                        {dayjs(mouseData[xKey]).format('DD MMM YY, h:mma')}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div
                        className={`flex ${
                          small
                            ? 'h-8 items-center text-2xl'
                            : 'mb-1 items-end text-4xl'
                        } font-display text-th-fgd-1`}
                      >
                        {animationSettings['number-scroll'] ? (
                          <FlipNumbers
                            height={small ? 24 : 40}
                            width={small ? 17 : 30}
                            play
                            numbers={`${
                              filteredData[filteredData.length - 1][yKey] < 0
                                ? '-'
                                : ''
                            }${prefix}${formatNumericValue(
                              Math.abs(
                                filteredData[filteredData.length - 1][yKey]
                              ),
                              yDecimals
                            )}${suffix}`}
                          />
                        ) : (
                          <span>
                            {filteredData[filteredData.length - 1][yKey] < 0
                              ? '-'
                              : ''}
                            {prefix}
                            <FormatNumericValue
                              value={Math.abs(data[data.length - 1][yKey])}
                              decimals={yDecimals}
                            />
                            {suffix}
                          </span>
                        )}
                        {!hideChange ? (
                          <span className="ml-3">
                            <Change
                              change={calculateChartChange()}
                              decimals={yDecimals}
                              prefix={prefix}
                              suffix={suffix}
                            />
                          </span>
                        ) : null}
                      </div>
                      <p
                        className={`${
                          small ? 'text-xs' : 'text-sm'
                        } text-th-fgd-4`}
                      >
                        {dayjs(
                          filteredData[filteredData.length - 1][xKey]
                        ).format('DD MMM YY, h:mma')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div
              className={`-mt-1 ${heightClass ? heightClass : 'h-96'} w-auto`}
            >
              {setDaysToShow ? (
                <div className="absolute -top-1 right-0 -mb-2 flex justify-end">
                  <ChartRangeButtons
                    activeValue={daysToShow}
                    names={['24H', '7D', '30D']}
                    values={['1', '7', '30']}
                    onChange={(v) => setDaysToShow(v)}
                  />
                </div>
              ) : null}
              <div className="-mx-6 mt-6 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={filteredData}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Tooltip
                      cursor={{
                        strokeOpacity: 0.09,
                      }}
                      content={<></>}
                    />
                    <defs>
                      <linearGradient
                        id={`gradientArea-${title?.replace(/[^a-zA-Z]/g, '')}`}
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
                        calculateChartChange() >= 0
                          ? COLORS.UP[theme]
                          : COLORS.DOWN[theme]
                      }
                      strokeWidth={1.5}
                      fill={`url(#gradientArea-${title?.replace(
                        /[^a-zA-Z]/g,
                        ''
                      )})`}
                    />
                    <XAxis
                      axisLine={false}
                      dataKey={xKey}
                      minTickGap={20}
                      padding={{ left: 20, right: 20 }}
                      tick={{
                        fill: 'var(--fgd-4)',
                        fontSize: 10,
                      }}
                      tickLine={false}
                      tickFormatter={(d) =>
                        formatDateAxis(d, parseInt(daysToShow))
                      }
                    />
                    <YAxis
                      axisLine={false}
                      dataKey={yKey}
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
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`flex ${
              heightClass ? heightClass : 'h-96'
            } items-center justify-center p-4 text-th-fgd-3`}
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

export default DetailedAreaChart
