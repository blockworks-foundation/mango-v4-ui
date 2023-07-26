/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import useMangoAccount from 'hooks/useMangoAccount'
import { useEffect, useMemo, useState } from 'react'
import {
  HourlyFundingChartData,
  HourlyFundingData,
  HourlyFundingStatsData,
} from 'types'
import { DAILY_MILLISECONDS, MANGO_DATA_API_URL } from 'utils/constants'
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
import { IconButton } from '@components/shared/Button'
import { ArrowLeftIcon, NoSymbolIcon } from '@heroicons/react/20/solid'
import { FadeInFadeOut } from '@components/shared/Transitions'
import ContentBox from '@components/shared/ContentBox'
import SheenLoader from '@components/shared/SheenLoader'
import useThemeWrapper from 'hooks/useThemeWrapper'

const fetchHourlyFunding = async (mangoAccountPk: string) => {
  try {
    const data = await fetch(
      `${MANGO_DATA_API_URL}/stats/funding-account-hourly?mango-account=${mangoAccountPk}`,
    )
    const res = await data.json()
    if (res) {
      const entries: HourlyFundingData[] = Object.entries(res)

      const stats: HourlyFundingStatsData[] = entries.map(([key, value]) => {
        const marketEntries = Object.entries(value)
        const marketFunding = marketEntries.map(([key, value]) => {
          return {
            long_funding: value.long_funding * -1,
            short_funding: value.short_funding * -1,
            time: key,
          }
        })
        return { marketFunding, market: key }
      })

      return stats
    }
  } catch (e) {
    console.log('Failed to fetch account funding history', e)
  }
}

const FundingChart = ({ hideChart }: { hideChart: () => void }) => {
  const { t } = useTranslation('common')
  const { mangoAccountAddress } = useMangoAccount()
  const [daysToShow, setDaysToShow] = useState('30')
  const { theme } = useThemeWrapper()
  const {
    data: fundingData,
    isLoading: loadingFunding,
    isFetching: fetchingFunding,
    refetch,
  } = useQuery(
    ['hourly-funding'],
    () => fetchHourlyFunding(mangoAccountAddress),
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

  const chartData = useMemo(() => {
    if (!fundingData || !fundingData.length) return []
    const rawData = []
    for (const item of fundingData) {
      for (const fundingItem of item.marketFunding) {
        rawData.push({
          [item.market]: fundingItem.long_funding + fundingItem.short_funding,
          time: fundingItem.time,
        })
      }
    }
    const data = rawData.reduce((a: HourlyFundingChartData[], c) => {
      const found: HourlyFundingChartData | undefined = a.find(
        (item) => item['time'] === c.time,
      )
      const marketKey = Object.keys(c)[0]
      const marketFunding = Object.values(c)[0]
      if (found) {
        found[marketKey] = marketFunding
        found.total = found.total + marketFunding
      } else {
        a.push({ ...c, total: marketFunding })
      }
      return a
    }, [])
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
        <div className="rounded-md bg-th-bkg-2 p-4">
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

  const scaleDataTime = (data: HourlyFundingChartData[]) => {
    const scaledData = data.reduce((a: HourlyFundingChartData[], c) => {
      const found = a.find((item) => {
        // const threshold = daysToShow === '7' ? 14400000 : 86400000
        // const currentDataTime = new Date(c.time).getTime()
        // const date = new Date(item.time)
        // const maxTime = date.getTime() + threshold
        // return currentDataTime <= maxTime

        const currentDataDate = new Date(c.time)
        const itemDate = new Date(item.time)
        return (
          itemDate.getDate() === currentDataDate.getDate() &&
          itemDate.getMonth() === currentDataDate.getMonth() &&
          itemDate.getFullYear() === currentDataDate.getFullYear()
        )
      })
      if (found) {
        for (const key in found) {
          if (key !== 'time') {
            found[key] = found[key] + c[key]
          }
        }
      } else {
        a.push({ ...c })
      }
      return a
    }, [])
    return scaledData
  }

  const filteredData: HourlyFundingChartData[] = useMemo(() => {
    if (!chartData.length) return []
    const start = Number(daysToShow) * DAILY_MILLISECONDS
    const filtered = chartData.filter((d: HourlyFundingChartData) => {
      const date = new Date()
      if (daysToShow === '30') {
        date.setHours(0, 0, 0, 0)
      } else {
        date.setMinutes(0, 0, 0)
      }
      const dataTime = new Date(d.time).getTime()
      const now = date.getTime()
      const limit = now - start
      return dataTime >= limit
    })
    if (daysToShow === '30') {
      return scaleDataTime(filtered)
    }
    return filtered
  }, [chartData, daysToShow])

  return (
    <FadeInFadeOut show={true}>
      <ContentBox className="px-6 pt-4" hideBorder hidePadding>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 md:space-x-6">
            <IconButton onClick={hideChart} size="medium">
              <ArrowLeftIcon className="h-5 w-5" />
            </IconButton>
            <h2 className="text-lg">{t('funding')}</h2>
          </div>
          <ChartRangeButtons
            activeValue={daysToShow}
            names={['24H', '7D', '30D']}
            values={['1', '7', '30']}
            onChange={(v) => setDaysToShow(v)}
          />
        </div>
        {loadingFunding || fetchingFunding ? (
          <SheenLoader className="mt-6 flex flex-1">
            <div
              className={`h-[calc(100vh-166px)] w-full rounded-lg bg-th-bkg-2`}
            />
          </SheenLoader>
        ) : filteredData.find((d) => Math.abs(d.total) > 0) ? (
          <div className="-mx-6 mt-6 h-[calc(100vh-170px)]">
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
                  tickFormatter={(v) => formatDateAxis(v, parseInt(daysToShow))}
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
          <div className="mt-6 flex flex-col items-center rounded-lg border border-th-bkg-3 p-8">
            <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
            <p>{t('account:no-data')}</p>
          </div>
        )}
      </ContentBox>
    </FadeInFadeOut>
  )
}

export default FundingChart
