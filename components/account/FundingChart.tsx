/* eslint-disable @typescript-eslint/no-explicit-any */
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import {
  HourlyFundingChartData,
  MarginFundingFeed,
  isCollateralFundingItem,
  isPerpFundingItem,
} from 'types'
import { MANGO_DATA_API_URL } from 'utils/constants'
import { formatCurrencyValue } from 'utils/numbers'
import { TooltipProps } from 'recharts/types/component/Tooltip'
import {
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { COLORS } from 'styles/colors'
import { formatDateAxis } from '@components/shared/DetailedAreaOrBarChart'
import { formatYAxis } from 'utils/formatting'
import ChartRangeButtons from '@components/shared/ChartRangeButtons'
import { useTranslation } from 'next-i18next'
import { NoSymbolIcon } from '@heroicons/react/20/solid'
import { FadeInFadeOut } from '@components/shared/Transitions'
import ContentBox from '@components/shared/ContentBox'
import SheenLoader from '@components/shared/SheenLoader'
import useThemeWrapper from 'hooks/useThemeWrapper'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { useQuery } from '@tanstack/react-query'
import useMangoAccount from 'hooks/useMangoAccount'

type TempDataType = {
  [time: string]: {
    [marketKey: string]: number | string
    time: string
    total: number
  }
}

const fetchFundingData = async (mangoAccountPk: string, period: number) => {
  try {
    const response = await fetch(
      `${MANGO_DATA_API_URL}/stats/margin-funding?mango-account=${mangoAccountPk}&start-date=${dayjs()
        .subtract(period, 'day')
        .format('YYYY-MM-DD')}`,
    )
    const data = await response.json()
    if (data?.length) {
      return data.reverse()
    } else return []
  } catch (e) {
    console.error('Failed to fetch account margin funding', e)
  }
}

const FundingChart = () => {
  const { t } = useTranslation('common')
  const [daysToShow, setDaysToShow] = useState('30')
  const { theme } = useThemeWrapper()
  const { mangoAccountAddress } = useMangoAccount()
  const {
    data: fundingData,
    isInitialLoading: loadingFunding,
    refetch,
  } = useQuery(
    ['funding-chart-data', mangoAccountAddress, daysToShow],
    () => fetchFundingData(mangoAccountAddress, parseInt(daysToShow)),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      refetchOnWindowFocus: false,
      enabled: !!mangoAccountAddress,
    },
  )

  useEffect(() => {
    refetch()
  }, [])

  const chartData: HourlyFundingChartData[] = useMemo(() => {
    if (!fundingData || !fundingData.length) return []
    const tempData: TempDataType = {}
    const data: HourlyFundingChartData[] = []
    fundingData.forEach((item: MarginFundingFeed) => {
      const time = item.date_time
      let marketKey = ''
      let marketFunding = 0
      if (isPerpFundingItem(item)) {
        marketKey = item?.activity_details?.perp_market
        marketFunding =
          item?.activity_details?.long_funding +
          item?.activity_details?.short_funding
      }
      if (isCollateralFundingItem(item)) {
        marketKey = item?.activity_details?.symbol
        marketFunding = item?.activity_details?.fee_value_usd * -1
      }

      if (tempData[time]) {
        tempData[time][marketKey] = marketFunding
        tempData[time].total += marketFunding
      } else {
        tempData[time] = {
          [marketKey]: marketFunding,
          time,
          total: marketFunding,
        }
        data.push(tempData[time])
      }
    })
    data.sort((a, b) => (a.time > b.time ? 1 : 0))
    return data
  }, [fundingData])

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const load = payload[0].payload
      const data: [string, any][] = Object.entries(load).filter(
        (p) => p[0] !== 'time' && p[0] !== 'total',
      )
      return (
        <div className="rounded-md bg-th-bkg-2 p-4 outline-none ring-0">
          <h3 className="mb-3 text-sm">
            {daysToShow === '30'
              ? dayjs(label).format('DD MMM YY')
              : dayjs(label).format('DD MMM YY, h:mma')}
          </h3>
          <div className="space-y-1">
            {data
              .filter((d) => Math.abs(d[1]) > 0)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map((d) => (
                <div className="flex items-center justify-between" key={d[0]}>
                  <p>{d[0]}</p>
                  <p className="pl-4 font-mono text-th-fgd-2">
                    {formatCurrencyValue(d[1])}
                  </p>
                </div>
              ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-th-bkg-4 pt-3">
            <p>{t('total')}</p>
            <p className="pl-4 font-mono text-th-fgd-2">
              {formatCurrencyValue(load['total'])}
            </p>
          </div>
        </div>
      )
    }

    return null
  }

  const scaleDataTime = (
    data: HourlyFundingChartData[],
    daysToShow: string,
  ): HourlyFundingChartData[] => {
    const scaledData = data.reduce((a: HourlyFundingChartData[], c) => {
      const found = a.find((item) => {
        const currentDataDate = new Date(c.time)
        const itemDate = new Date(item.time)
        const includeHours =
          daysToShow === '7' &&
          currentDataDate.getHours() - itemDate.getHours() < 6
        return (
          (includeHours || daysToShow === '30') &&
          itemDate.getDate() === currentDataDate.getDate() &&
          itemDate.getMonth() === currentDataDate.getMonth() &&
          itemDate.getFullYear() === currentDataDate.getFullYear()
        )
      })

      if (found) {
        for (const key in c) {
          if (key !== 'time' && typeof c[key] === 'number') {
            found[key] = (found[key] || 0) + c[key]
          }
        }
      } else {
        a.push({ ...c })
      }
      return a
    }, [] as HourlyFundingChartData[])

    return scaledData
  }

  const filteredData: HourlyFundingChartData[] = useMemo(() => {
    if (!chartData?.length) return []
    if (daysToShow !== '1') {
      return scaleDataTime(chartData, daysToShow)
    }
    return chartData
  }, [chartData, daysToShow])

  const totalForTimePeriod = useMemo(() => {
    if (!filteredData.length) return 0
    return filteredData.reduce((a, c) => a + c.total, 0)
  }, [filteredData])

  return (
    <FadeInFadeOut show={true}>
      <ContentBox hideBorder hidePadding>
        {loadingFunding ? (
          <SheenLoader className="flex flex-1">
            <div className={`h-[350px] w-full rounded-lg bg-th-bkg-2`} />
          </SheenLoader>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="mb-0.5 text-base font-normal text-th-fgd-3">
                  {t('funding')}
                </h2>
                {totalForTimePeriod ? (
                  <span className="font-display text-2xl text-th-fgd-1">
                    <FormatNumericValue
                      value={totalForTimePeriod}
                      isUsd
                      isPrivate
                    />
                  </span>
                ) : null}
              </div>
              <ChartRangeButtons
                activeValue={daysToShow}
                names={['24H', '7D', '30D']}
                values={['1', '7', '30']}
                onChange={(v) => setDaysToShow(v)}
              />
            </div>
            {filteredData.find((d) => Math.abs(d.total) > 0) ? (
              <div className="-mx-6 mt-6 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredData}>
                    <Tooltip
                      cursor={{
                        fill: 'var(--bkg-2)',
                        opacity: 0.5,
                      }}
                      content={<CustomTooltip />}
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
                    <Bar dataKey="total">
                      {filteredData.map((entry, index) => {
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry['total'] > 0
                                ? 'url(#greenGradientBar)'
                                : 'url(#redGradientBar)'
                            }
                          />
                        )
                      })}
                    </Bar>
                    <XAxis
                      dataKey="time"
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
                      dataKey="total"
                      interval="preserveStartEnd"
                      axisLine={false}
                      dx={-10}
                      padding={{ top: 20, bottom: 20 }}
                      tick={{
                        fill: 'var(--fgd-4)',
                        fontSize: 10,
                      }}
                      tickLine={false}
                      tickFormatter={(v) => formatYAxis(v)}
                      type="number"
                    />
                    <ReferenceLine y={0} stroke={COLORS.BKG4[theme]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="mt-4 flex h-64 flex-col items-center justify-center rounded-lg border border-th-bkg-3 p-8">
                <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
                <p>{t('account:no-data')}</p>
              </div>
            )}
          </>
        )}
      </ContentBox>
    </FadeInFadeOut>
  )
}

export default FundingChart
