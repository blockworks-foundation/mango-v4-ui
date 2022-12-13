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
import { formatFixedDecimals } from 'utils/numbers'
import { INITIAL_ANIMATION_SETTINGS } from '@components/settings/AnimationSettings'
import { AxisDomain } from 'recharts/types/util/types'
import { useTranslation } from 'next-i18next'

dayjs.extend(relativeTime)

interface DetailedAreaChartProps {
  data: any[]
  daysToShow?: string
  domain?: AxisDomain
  hideChange?: boolean
  hideChart?: () => void
  loading?: boolean
  prefix?: string
  setDaysToShow?: (x: string) => void
  small?: boolean
  suffix?: string
  tickFormat?: (x: number) => string
  title?: string
  xKey: string
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
  hideChange,
  hideChart,
  loading,
  prefix = '',
  setDaysToShow,
  small,
  suffix = '',
  tickFormat,
  title,
  xKey,
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

  const calculateChartChange = () => {
    if (data.length) {
      if (mouseData) {
        const index = data.findIndex((d: any) => d[xKey] === mouseData[xKey])
        const change = index >= 0 ? data[index][yKey] - data[0][yKey] : 0
        return isNaN(change) ? 0 : change
      } else return data[data.length - 1][yKey] - data[0][yKey]
    }
    return 0
  }

  const flipGradientCoords = useMemo(() => {
    if (!data.length) return
    return data[0][yKey] <= 0 && data[data.length - 1][yKey] < data[0][yKey]
  }, [data])

  return (
    <FadeInFadeOut show={true}>
      <ContentBox hideBorder hidePadding>
        {loading ? (
          <SheenLoader className="flex flex-1">
            <div className="h-[448px] w-full rounded-lg bg-th-bkg-2" />
          </SheenLoader>
        ) : data.length ? (
          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
                {hideChart ? (
                  <IconButton className="mb-6" onClick={hideChart}>
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
                            width={small ? 18 : 31}
                            play
                            numbers={
                              prefix +
                              formatFixedDecimals(mouseData[yKey] ?? 0) +
                              suffix
                            }
                          />
                        ) : (
                          <span>
                            {prefix +
                              formatFixedDecimals(mouseData[yKey] ?? 0) +
                              suffix}
                          </span>
                        )}
                        {!hideChange ? (
                          <span className="ml-3">
                            <Change
                              change={calculateChartChange()}
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
                            width={small ? 18 : 31}
                            play
                            numbers={
                              prefix +
                              formatFixedDecimals(data[data.length - 1][yKey]) +
                              suffix
                            }
                          />
                        ) : (
                          <span>
                            {prefix +
                              formatFixedDecimals(data[data.length - 1][yKey]) +
                              suffix}
                          </span>
                        )}
                        {!hideChange ? (
                          <span className="ml-3">
                            <Change
                              change={calculateChartChange()}
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
                        {dayjs(data[data.length - 1][xKey]).format(
                          'DD MMM YY, h:mma'
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="-mt-1 h-96 w-auto">
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
                    data={data}
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
                        id="gradientArea"
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
                      fill="url(#gradientArea)"
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
                      domain={domain ? domain : ['dataMin', 'dataMax']}
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
          <div className="flex h-96 items-center justify-center p-4 text-th-fgd-3">
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
