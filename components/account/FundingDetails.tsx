/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import useMangoAccount from 'hooks/useMangoAccount'
import { useEffect, useMemo } from 'react'
import {
  HourlyFundingChartData,
  HourlyFundingData,
  HourlyFundingStatsData,
} from 'types'
import { MANGO_DATA_API_URL } from 'utils/constants'
import { formatCurrencyValue } from 'utils/numbers'
import AccountChart from './AccountChart'
import { TooltipProps } from 'recharts/types/component/Tooltip'

const fetchHourlyFunding = async (mangoAccountPk: string) => {
  try {
    const data = await fetch(
      `${MANGO_DATA_API_URL}/stats/funding-account-hourly?mango-account=${mangoAccountPk}`
    )
    const res = await data.json()
    if (res) {
      const entries: HourlyFundingData[] = Object.entries(res)

      const stats: HourlyFundingStatsData[] = entries.map(([key, value]) => {
        const marketEntries = Object.entries(value)
        const marketFunding = marketEntries.map(([key, value]) => {
          return { ...value, time: key }
        })
        return { marketFunding, market: key }
      })

      return stats
    }
  } catch (e) {
    console.log('Failed to fetch account funding history', e)
  }
}

const FundingDetails = ({ hideChart }: { hideChart: () => void }) => {
  const { mangoAccountAddress } = useMangoAccount()
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
    }
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
        (item) => item['time'] === c.time
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
      const data: [string, any][] = Object.entries(payload[0].payload).filter(
        (p) => p[0] !== 'time' && p[0] !== 'total'
      )
      return (
        <div className="rounded-md bg-th-bkg-2 p-4">
          <h3 className="mb-3 text-sm">
            {dayjs(label).format('DD MMM YY, h:mma')}
          </h3>
          <div className="space-y-1">
            {data.map((d) => (
              <div className="flex items-center justify-between" key={d[0]}>
                <p>{d[0]}</p>
                <p className="pl-4 font-mono text-th-fgd-2">
                  {formatCurrencyValue(d[1])}
                </p>
              </div>
            ))}
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <AccountChart
      chartToShow="hourly-funding"
      customTooltip={<CustomTooltip />}
      data={chartData}
      hideChart={hideChart}
      loading={loadingFunding || fetchingFunding}
      yDecimals={4}
      yKey="total"
    />
  )
}

export default FundingDetails
