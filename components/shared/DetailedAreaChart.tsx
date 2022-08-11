import { FunctionComponent, ReactNode, useState } from 'react'
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
import { DownTriangle, UpTriangle } from '../shared/DirectionTriangles'
import { formatFixedDecimals } from '../../utils/numbers'
import SheenLoader from '../shared/SheenLoader'
import { COLORS } from '../../styles/colors'
import { useTheme } from 'next-themes'
import { IconButton } from './Button'
import { ArrowLeftIcon } from '@heroicons/react/solid'
import { FadeInFadeOut } from './Transitions'

dayjs.extend(relativeTime)

interface DetailedAreaChartProps {
  data: any[]
  daysToShow: number
  hideChart?: () => void
  loading?: boolean
  setDaysToShow: (x: number) => void
  tickFormat?: (x: any) => string
  title?: string
  xKey: string
  yKey: string
}

const DetailedAreaChart: FunctionComponent<DetailedAreaChartProps> = ({
  data,
  daysToShow = 1,
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
        const change =
          ((data[index][yKey] - data[0][yKey]) / data[0][yKey]) * 100
        return isNaN(change) ? 0 : change
      } else
        return (
          ((data[data.length - 1][yKey] - data[0][yKey]) / data[0][yKey]) * 100
        )
    }
    return 0
  }

  const formatDateAxis = (date: string) => {
    if (daysToShow === 1) {
      return dayjs(date).format('h:mma')
    } else {
      return dayjs(date).format('D MMM')
    }
  }

  return (
    <FadeInFadeOut show={true}>
      <ContentBox hideBorder hidePadding>
        {loading ? (
          <SheenLoader>
            <div className="h-[448px] rounded-lg bg-th-bkg-2" />
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
                        $
                        <FlipNumbers
                          height={40}
                          width={26}
                          play
                          numbers={mouseData[yKey].toFixed(2)}
                        />
                        <span
                          className={`ml-3 flex items-center text-sm ${
                            calculateChartChange() >= 0
                              ? 'text-th-green'
                              : 'text-th-red'
                          }`}
                        >
                          {calculateChartChange() >= 0 ? (
                            <UpTriangle />
                          ) : (
                            <DownTriangle />
                          )}
                          <span className="ml-1">
                            {calculateChartChange().toFixed(2)}%
                          </span>
                        </span>
                      </div>
                      <p className="text-sm text-th-fgd-4">
                        {dayjs(mouseData[xKey]).format('DD MMM YY, h:mma')}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-1 flex items-end text-4xl font-bold text-th-fgd-1">
                        $
                        <FlipNumbers
                          height={40}
                          width={26}
                          play
                          numbers={data[data.length - 1][yKey].toFixed(2)}
                        />
                        <span
                          className={`ml-3 mt-0 flex items-center text-sm ${
                            calculateChartChange() >= 0
                              ? 'text-th-green'
                              : 'text-th-red'
                          }`}
                        >
                          {calculateChartChange() >= 0 ? (
                            <UpTriangle />
                          ) : (
                            <DownTriangle />
                          )}
                          <span className="ml-1">
                            {calculateChartChange().toFixed(2)}%
                          </span>
                        </span>
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
                <button
                  className={`rounded-md px-3 py-2 font-bold  focus:outline-none md:hover:text-th-primary ${
                    daysToShow === 1 ? 'text-th-primary' : 'text-th-fgd-4'
                  }`}
                  onClick={() => setDaysToShow(1)}
                >
                  24H
                </button>
                <button
                  className={`rounded-md px-3 py-2 font-bold focus:outline-none md:hover:text-th-primary ${
                    daysToShow === 7 ? 'text-th-primary' : 'text-th-fgd-4'
                  }`}
                  onClick={() => setDaysToShow(7)}
                >
                  7D
                </button>
                <button
                  className={`rounded-md px-3 py-2 font-bold focus:outline-none md:hover:text-th-primary ${
                    daysToShow === 30 ? 'text-th-primary' : 'text-th-fgd-4'
                  }`}
                  onClick={() => setDaysToShow(30)}
                >
                  30D
                </button>
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
                        y1="0"
                        x2="0"
                        y2="1"
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
                      tickFormatter={(d) => formatDateAxis(d)}
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
