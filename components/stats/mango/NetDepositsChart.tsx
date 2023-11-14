import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyObject } from 'types'
import { MANGO_DATA_API_URL } from 'utils/constants'
import { formatYAxis } from 'utils/formatting'

type NetDeposits = {
  [key: string]: {
    net_deposits: number
  }
}

const fetchNetDepositsData = async () => {
  try {
    const response = await fetch(
      `${MANGO_DATA_API_URL}/stats/net-deposits-daily`,
    )
    const data: null | EmptyObject | NetDeposits = await response.json()
    if (data && Object.keys(data).length) {
      const foramttedData = Object.entries(data).map(([key, value]) => {
        return { date: key, netDeposits: value.net_deposits }
      })
      return foramttedData
    }
    return []
  } catch (e) {
    console.log('Failed to fetch net deposits', e)
    return []
  }
}

const NetDepositsChart = () => {
  const { t } = useTranslation('stats')
  const [daysToShow] = useState('30')
  const { data, isInitialLoading } = useQuery(
    ['net-deposits-data'],
    () => fetchNetDepositsData(),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      refetchOnWindowFocus: false,
    },
  )

  return (
    <DetailedAreaOrBarChart
      hideChange
      data={data}
      daysToShow={daysToShow}
      loading={isInitialLoading}
      heightClass="h-[247px]"
      loaderHeightClass="h-[350px]"
      prefix="$"
      tickFormat={(x) => `$${formatYAxis(x)}`}
      title={t('stats:net-deposits')}
      xKey="date"
      yKey="netDeposits"
      chartType="bar"
    />
  )
}

export default NetDepositsChart
