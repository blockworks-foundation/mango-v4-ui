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

import LineChartIcon from '../icons/LineChartIcon'
import ContentBox from '../shared/ContentBox'
import SheenLoader from '../shared/SheenLoader'
import { COLORS } from '../../styles/colors'
import { useTheme } from 'next-themes'
import { IconButton } from './Button'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'
import { FadeInFadeOut } from './Transitions'
import ChartRangeButtons from './ChartRangeButtons'
import Change from './Change'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { ANIMATION_SETTINGS_KEY } from 'utils/constants'
import { formatFixedDecimals } from 'utils/numbers'
import { INITIAL_ANIMATION_SETTINGS } from '@components/settings/AnimationSettings'

dayjs.extend(relativeTime)

interface DetailedAreaChartProps {
  data: any[]
  daysToShow: number
  hideChange?: boolean
  hideChart?: () => void
  loading?: boolean
  setDaysToShow: (x: number) => void
  tickFormat?: (x: any) => string
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
  daysToShow = 1,
  hideChange,
  hideChart,
  loading,
  setDaysToShow,
  tickFormat,
  title,
  xKey,
  yKey,
}) => {
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
        const change = data[index][yKey] - data[0][yKey]
        return isNaN(change) ? 0 : change
      } else return data[data.length - 1][yKey] - data[0][yKey]
    }
    return 0
  }

  const flipGradientCoords = useMemo(
    () => data[0][yKey] <= 0 && data[data.length - 1][yKey] < data[0][yKey],
    [data]
  )

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
                <IconButton className="mb-6" onClick={hideChart}>
                  <ArrowLeftIcon className="h-5 w-5" />
                </IconButton>
                <div>
                  <p className="mb-0.5 text-base text-th-fgd-3">{title}</p>
                  {mouseData ? (
                    <div>
                      <div className="mb-1 flex items-end text-4xl font-bold text-th-fgd-1">
                        {animationSettings['number-scroll'] ? (
                          <FlipNumbers
                            height={40}
                            width={26}
                            play
                            numbers={formatFixedDecimals(mouseData[yKey], true)}
                          />
                        ) : (
                          <span>
                            {formatFixedDecimals(mouseData[yKey], true)}
                          </span>
                        )}
                        {!hideChange ? (
                          <span className="ml-3">
                            <Change
                              change={calculateChartChange()}
                              isCurrency
                            />
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-th-fgd-4">
                        {dayjs(mouseData[xKey]).format('DD MMM YY, h:mma')}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-1 flex items-end text-4xl font-bold text-th-fgd-1">
                        {animationSettings['number-scroll'] ? (
                          <FlipNumbers
                            height={40}
                            width={26}
                            play
                            numbers={formatFixedDecimals(
                              data[data.length - 1][yKey],
                              true
                            )}
                          />
                        ) : (
                          <span>
                            {formatFixedDecimals(
                              data[data.length - 1][yKey],
                              true
                            )}
                          </span>
                        )}
                        {!hideChange ? (
                          <span className="ml-3">
                            <Change
                              change={calculateChartChange()}
                              isCurrency
                            />
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-th-fgd-4">
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
              <div className="absolute -top-1 right-0 -mb-2 flex justify-end">
                <ChartRangeButtons
                  activeValue={daysToShow}
                  names={['24H', '7D', '30D']}
                  values={[1, 7, 30]}
                  onChange={(v) => setDaysToShow(v)}
                />
              </div>
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
                              ? COLORS.GREEN[theme]
                              : COLORS.RED[theme]
                          }
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="99%"
                          stopColor={
                            calculateChartChange() >= 0
                              ? COLORS.GREEN[theme]
                              : COLORS.RED[theme]
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
                          ? COLORS.GREEN[theme]
                          : COLORS.RED[theme]
                      }
                      strokeWidth={1.5}
                      fill="url(#gradientArea)"
                    />
                    <XAxis
                      axisLine={false}
                      dataKey={xKey}
                      padding={{ left: 20, right: 20 }}
                      tick={{
                        fill:
                          theme === 'Light'
                            ? 'rgba(0,0,0,0.4)'
                            : 'rgba(255,255,255,0.6)',
                        fontSize: 10,
                      }}
                      tickLine={false}
                      tickFormatter={(d) => formatDateAxis(d, daysToShow)}
                    />
                    <YAxis
                      axisLine={false}
                      dataKey={yKey}
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      padding={{ top: 20, bottom: 20 }}
                      tick={{
                        fill:
                          theme === 'Light'
                            ? 'rgba(0,0,0,0.4)'
                            : 'rgba(255,255,255,0.6)',
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
          <div className="flex h-96 items-center justify-center rounded-lg bg-th-bkg-2 p-4 text-th-fgd-3">
            <div className="">
              <LineChartIcon className="mx-auto h-10 w-10 text-th-fgd-4" />
              <p className="text-th-fgd-4">Chart not available</p>
            </div>
          </div>
        )}
      </ContentBox>
    </FadeInFadeOut>
  )
}

export default DetailedAreaChart
